import { API_URL } from '../config/env';
import { Candidate, Test, Attempt, ProctoringSnapshot, ProctoringEvent, AppSettings } from '../types';
import { SEED_CANDIDATE, SEED_TEST, DEFAULT_SETTINGS } from '../data/seedData';

const KEYS = {
  ADMIN_SESSION: 'atheeg_admin_session',
  CANDIDATE_SESSION: 'atheeg_candidate_session',
  CURRENT_VIEW: 'atheeg_current_view'
};

let settingsCache: AppSettings = DEFAULT_SETTINGS;
let candidatesCache: Candidate[] = [];
let testsCache: Test[] = [];
let attemptsCache: Attempt[] = [];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('Backend is not configured. Set VITE_API_URL.');
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed with status ${response.status}`);
  return payload.data as T;
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

export async function initializeStorage(): Promise<void> {
  const [remoteTests, remoteCandidates, remoteAttempts, remoteSettings] = await Promise.all([
    request<Test[]>('/api/tests'),
    request<Candidate[]>('/api/candidates'),
    request<Attempt[]>('/api/attempts'),
    request<AppSettings>('/api/settings')
  ]);
  testsCache = remoteTests || [];
  candidatesCache = remoteCandidates || [];
  attemptsCache = remoteAttempts || [];
  settingsCache = { ...DEFAULT_SETTINGS, ...(remoteSettings || {}) };

  if (testsCache.length === 0) {
    await request('/api/tests', { method: 'POST', body: JSON.stringify(SEED_TEST) });
    testsCache = [SEED_TEST];
  }
  if (candidatesCache.length === 0) {
    await request('/api/candidates', { method: 'POST', body: JSON.stringify(SEED_CANDIDATE) });
    candidatesCache = [SEED_CANDIDATE];
  }
  if (!remoteSettings || Object.keys(remoteSettings).length === 0) {
    await request('/api/settings', { method: 'PUT', body: JSON.stringify(DEFAULT_SETTINGS) });
    settingsCache = DEFAULT_SETTINGS;
  }
}

export async function getCandidates(): Promise<Candidate[]> {
  candidatesCache = await request<Candidate[]>('/api/candidates');
  return candidatesCache;
}

export async function saveCandidate(candidate: Candidate): Promise<Candidate> {
  const existing = candidatesCache.some(item => item.id === candidate.id);
  const saved = await request<Candidate>(`/api/candidates${existing ? `/${candidate.id}` : ''}`, {
    method: existing ? 'PUT' : 'POST', body: JSON.stringify(candidate)
  });
  candidatesCache = await request<Candidate[]>('/api/candidates');
  return saved;
}

export async function deleteCandidate(candidateId: string): Promise<boolean> {
  await request(`/api/candidates/${encodeURIComponent(candidateId)}`, { method: 'DELETE' });
  candidatesCache = candidatesCache.filter(candidate => candidate.id !== candidateId);
  attemptsCache = attemptsCache.filter(attempt => attempt.candidateId !== candidateId);
  return true;
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  try { return await request<Candidate>(`/api/candidates/${encodeURIComponent(id)}`); } catch { return null; }
}

export async function getTests(): Promise<Test[]> {
  testsCache = await request<Test[]>('/api/tests');
  return testsCache;
}

export async function getTestByCode(code: string): Promise<Test | null> {
  const tests = await getTests();
  const normalized = code.trim().toUpperCase();
  return tests.find(test => test.code.toUpperCase() === normalized) || null;
}

export async function saveTest(test: Test): Promise<Test> {
  const existing = testsCache.some(item => item.id === test.id);
  const saved = await request<Test>(`/api/tests${existing ? `/${test.id}` : ''}`, {
    method: existing ? 'PUT' : 'POST', body: JSON.stringify(test)
  });
  testsCache = await request<Test[]>('/api/tests');
  return saved;
}

export async function deleteTest(id: string): Promise<boolean> {
  await request(`/api/tests/${encodeURIComponent(id)}`, { method: 'DELETE' });
  testsCache = testsCache.filter(test => test.id !== id);
  return true;
}

export async function getAttempts(): Promise<Attempt[]> {
  attemptsCache = await request<Attempt[]>('/api/attempts');
  return attemptsCache;
}

export async function saveAttempt(attempt: Attempt): Promise<Attempt> {
  const saved = await request<Attempt>('/api/attempts', { method: 'POST', body: JSON.stringify(attempt) });
  attemptsCache = await request<Attempt[]>('/api/attempts');
  return saved;
}

export async function deleteAttempt(attemptId: string): Promise<boolean> {
  await request(`/api/attempts/${encodeURIComponent(attemptId)}`, { method: 'DELETE' });
  attemptsCache = attemptsCache.filter(attempt => attempt.id !== attemptId);
  return true;
}

export async function deleteAttemptsForTest(testId: string): Promise<void> {
  const attempts = (await getAttempts()).filter(attempt => attempt.testId === testId);
  await Promise.all(attempts.map(attempt => deleteAttempt(attempt.id)));
}

export async function getAttemptsByCandidate(candidateId: string): Promise<Attempt[]> {
  return (await getAttempts()).filter(attempt => attempt.candidateId === candidateId);
}

export async function getAttemptById(attemptId: string): Promise<Attempt | null> {
  try { return await request<Attempt>(`/api/attempts/${encodeURIComponent(attemptId)}`); } catch { return null; }
}

export async function saveSnapshot(snapshot: ProctoringSnapshot): Promise<void> {
  await request('/api/proctoring/snapshots', { method: 'POST', body: JSON.stringify(snapshot) });
}

export async function getSnapshotsForAttempt(attemptId: string): Promise<ProctoringSnapshot[]> {
  return request<ProctoringSnapshot[]>(`/api/proctoring/snapshots/${encodeURIComponent(attemptId)}`);
}

export async function logProctoringEvent(event: ProctoringEvent): Promise<void> {
  await request('/api/proctoring/events', { method: 'POST', body: JSON.stringify(event) });
}

export async function getEventsForAttempt(attemptId: string): Promise<ProctoringEvent[]> {
  return request<ProctoringEvent[]>(`/api/proctoring/events/${encodeURIComponent(attemptId)}`);
}

export function getSettings(): AppSettings { return settingsCache; }

export async function loadSettings(): Promise<AppSettings> {
  settingsCache = { ...DEFAULT_SETTINGS, ...(await request<AppSettings>('/api/settings')) };
  return settingsCache;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  settingsCache = await request<AppSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
}

export function isAdminLoggedIn(): boolean {
  return typeof window !== 'undefined' && sessionStorage.getItem(KEYS.ADMIN_SESSION) === 'true';
}
export const isAdminSessionActive = isAdminLoggedIn;
export function setAdminSession(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) sessionStorage.setItem(KEYS.ADMIN_SESSION, 'true');
  else sessionStorage.removeItem(KEYS.ADMIN_SESSION);
}
export function clearAdminSession(): void { setAdminSession(false); }
export function getCandidateSession(): string | null { return typeof window === 'undefined' ? null : sessionStorage.getItem(KEYS.CANDIDATE_SESSION); }
export function getCurrentCandidateSession(): Candidate | null {
  const id = getCandidateSession();
  return id ? candidatesCache.find(candidate => candidate.id === id) || null : null;
}
export function setCandidateSession(candidateId: string | null): void {
  if (typeof window === 'undefined') return;
  if (candidateId) sessionStorage.setItem(KEYS.CANDIDATE_SESSION, candidateId);
  else sessionStorage.removeItem(KEYS.CANDIDATE_SESSION);
}
export function clearCandidateSession(): void { setCandidateSession(null); }
export function getCurrentView(): string | null { return safeGetItem(KEYS.CURRENT_VIEW); }
export function setCurrentView(view: string): void { safeSetItem(KEYS.CURRENT_VIEW, view); }
export function clearCurrentView(): void { if (typeof window !== 'undefined') localStorage.removeItem(KEYS.CURRENT_VIEW); }

export async function resetAllData(): Promise<void> {
  const [candidates, tests, attempts] = await Promise.all([getCandidates(), getTests(), getAttempts()]);
  await Promise.all([
    ...candidates.filter(candidate => candidate.id !== SEED_CANDIDATE.id).map(candidate => deleteCandidate(candidate.id)),
    ...tests.filter(test => test.id !== SEED_TEST.id).map(test => deleteTest(test.id)),
    ...attempts.map(attempt => deleteAttempt(attempt.id))
  ]);
  if (!(await getCandidateById(SEED_CANDIDATE.id))) await saveCandidate(SEED_CANDIDATE);
  if (!(await getTestByCode(SEED_TEST.code))) await saveTest(SEED_TEST);
  await saveSettings(DEFAULT_SETTINGS);
}
