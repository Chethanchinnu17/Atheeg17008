import { Candidate, Test, Attempt, ProctoringSnapshot, ProctoringEvent, AppSettings } from '../types';
import { SEED_CANDIDATE, SEED_TEST, DEFAULT_SETTINGS } from '../data/seedData';

const KEYS = {
  CANDIDATES: 'atheeg_candidates',
  TESTS: 'atheeg_tests',
  ATTEMPTS: 'atheeg_attempts',
  SNAPSHOTS: 'atheeg_snapshots',
  EVENTS: 'atheeg_events',
  SETTINGS: 'atheeg_settings',
  ADMIN_SESSION: 'atheeg_admin_session',
  CANDIDATE_SESSION: 'atheeg_candidate_session',
  INITIALIZED: 'atheeg_storage_initialized'
};

// In-memory fallback if localStorage quota is exceeded or unavailable
const memoryFallback: Record<string, string> = {};

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`localStorage.setItem failed for key "${key}", pruning caches and retrying`, e);
    try {
      // Free space by clearing large snapshot base64 images
      localStorage.setItem(KEYS.SNAPSHOTS, JSON.stringify([]));
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      try {
        // Free space by trimming events and old attempts
        localStorage.setItem(KEYS.EVENTS, JSON.stringify([]));
        localStorage.setItem(key, value);
        return true;
      } catch (e3) {
        console.error(`localStorage quota completely exceeded. Using memory fallback for key "${key}"`, e3);
        memoryFallback[key] = value;
        return false;
      }
    }
  }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch (e) {
    console.warn(`localStorage.getItem failed for key "${key}"`, e);
  }
  return memoryFallback[key] ?? null;
}

// Initialize default seed data only on the very first visit
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  const alreadyInitialized = safeGetItem(KEYS.INITIALIZED) === 'true';

  if (!alreadyInitialized) {
    // Very first initial launch
    if (safeGetItem(KEYS.TESTS) === null) {
      safeSetItem(KEYS.TESTS, JSON.stringify([SEED_TEST]));
    }
    if (safeGetItem(KEYS.CANDIDATES) === null) {
      safeSetItem(KEYS.CANDIDATES, JSON.stringify([SEED_CANDIDATE]));
    }
    if (safeGetItem(KEYS.SETTINGS) === null) {
      safeSetItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (safeGetItem(KEYS.ATTEMPTS) === null) {
      const sampleAttempt: Attempt = {
        id: "att_sample_01",
        candidateId: SEED_CANDIDATE.id,
        candidateName: SEED_CANDIDATE.name,
        candidateEmail: SEED_CANDIDATE.email,
        testId: SEED_TEST.id,
        testCode: SEED_TEST.code,
        testTitle: SEED_TEST.title,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
        answers: {
          "q_101": 1,
          "q_102": 1,
          "q_103": 1,
          "q_201": 1,
          "q_202": 0
        },
        markedForReview: ["q_103"],
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        levelScores: [
          {
            levelId: "lvl_1",
            levelName: "Level 1: Fundamentals",
            totalQuestions: 3,
            correctAnswers: 3,
            score: 3
          },
          {
            levelId: "lvl_2",
            levelName: "Level 2: Advanced Reasoning",
            totalQuestions: 2,
            correctAnswers: 1,
            score: 1
          }
        ],
        timeTaken: 420,
        status: 'Completed',
        proctoringEventsCount: 0
      };
      safeSetItem(KEYS.ATTEMPTS, JSON.stringify([sampleAttempt]));
    }
    safeSetItem(KEYS.SNAPSHOTS, JSON.stringify([]));
    safeSetItem(KEYS.EVENTS, JSON.stringify([]));
    safeSetItem(KEYS.INITIALIZED, 'true');
  } else {
    // App was already initialized: ensure basic arrays exist without resurrecting deleted items
    if (safeGetItem(KEYS.TESTS) === null) safeSetItem(KEYS.TESTS, JSON.stringify([]));
    if (safeGetItem(KEYS.CANDIDATES) === null) safeSetItem(KEYS.CANDIDATES, JSON.stringify([]));
    if (safeGetItem(KEYS.ATTEMPTS) === null) safeSetItem(KEYS.ATTEMPTS, JSON.stringify([]));
    if (safeGetItem(KEYS.SNAPSHOTS) === null) safeSetItem(KEYS.SNAPSHOTS, JSON.stringify([]));
    if (safeGetItem(KEYS.EVENTS) === null) safeSetItem(KEYS.EVENTS, JSON.stringify([]));
    if (safeGetItem(KEYS.SETTINGS) === null) safeSetItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

// ================= CANDIDATES =================
// In production: Replace with `GET /api/candidates`
export function getCandidates(): Candidate[] {
  try {
    const raw = safeGetItem(KEYS.CANDIDATES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// In production: Replace with `POST /api/candidates/register`
export function saveCandidate(candidate: Candidate): void {
  const list = getCandidates();
  const existingIdx = list.findIndex(c => c.id === candidate.id || c.email.toLowerCase() === candidate.email.toLowerCase());
  if (existingIdx >= 0) {
    list[existingIdx] = candidate;
  } else {
    list.push(candidate);
  }
  safeSetItem(KEYS.CANDIDATES, JSON.stringify(list));
}

// In production: Replace with `GET /api/candidates/:id`
export function getCandidateById(id: string): Candidate | null {
  const list = getCandidates();
  return list.find(c => c.id === id) || null;
}

// ================= TESTS =================
// In production: Replace with `GET /api/tests`
export function getTests(): Test[] {
  try {
    const raw = safeGetItem(KEYS.TESTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// In production: Replace with `GET /api/tests/:code`
export function getTestByCode(code: string): Test | null {
  const tests = getTests();
  const normalized = code.trim().toUpperCase();
  return tests.find(t => t.code.toUpperCase() === normalized) || null;
}

// In production: Replace with `POST /api/tests` or `PUT /api/tests/:id`
export function saveTest(test: Test): void {
  const tests = getTests();
  const index = tests.findIndex(t => t.id === test.id || (t.code && test.code && t.code.toUpperCase() === test.code.toUpperCase()));
  if (index >= 0) {
    tests[index] = test;
  } else {
    tests.unshift(test);
  }
  safeSetItem(KEYS.TESTS, JSON.stringify(tests));
}

// In production: Replace with `DELETE /api/tests/:id`
export function deleteTest(id: string): boolean {
  try {
    const cleanId = String(id).trim().toLowerCase();
    const tests = getTests();
    const targetTest = tests.find(t =>
      String(t.id).trim().toLowerCase() === cleanId ||
      String(t.code).trim().toLowerCase() === cleanId
    );

    const remainingTests = tests.filter(t =>
      String(t.id).trim().toLowerCase() !== cleanId &&
      String(t.code).trim().toLowerCase() !== cleanId
    );

    safeSetItem(KEYS.TESTS, JSON.stringify(remainingTests));

    // Also clean up any attempts associated with this test
    if (targetTest) {
      deleteAttemptsForTest(targetTest.id);
    }
    return true;
  } catch (err) {
    console.error('Error deleting test from storage', err);
    return false;
  }
}

// ================= ATTEMPTS =================
// In production: Replace with `GET /api/attempts`
export function getAttempts(): Attempt[] {
  try {
    const raw = safeGetItem(KEYS.ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// In production: Replace with `POST /api/attempts`
export function saveAttempt(attempt: Attempt): void {
  const attempts = getAttempts();
  const index = attempts.findIndex(a => a.id === attempt.id);
  if (index >= 0) {
    attempts[index] = attempt;
  } else {
    attempts.unshift(attempt);
  }
  safeSetItem(KEYS.ATTEMPTS, JSON.stringify(attempts));
}

// Delete a single attempt by ID
export function deleteAttempt(attemptId: string): boolean {
  try {
    const cleanId = String(attemptId).trim();
    const attempts = getAttempts().filter(a => String(a.id).trim() !== cleanId);
    safeSetItem(KEYS.ATTEMPTS, JSON.stringify(attempts));

    // Clean up snapshots and events for this attempt
    try {
      const rawSnaps = safeGetItem(KEYS.SNAPSHOTS);
      if (rawSnaps) {
        const snaps: ProctoringSnapshot[] = JSON.parse(rawSnaps);
        safeSetItem(KEYS.SNAPSHOTS, JSON.stringify(snaps.filter(s => s.attemptId !== cleanId)));
      }
    } catch {}

    try {
      const rawEvents = safeGetItem(KEYS.EVENTS);
      if (rawEvents) {
        const evts: ProctoringEvent[] = JSON.parse(rawEvents);
        safeSetItem(KEYS.EVENTS, JSON.stringify(evts.filter(e => e.attemptId !== cleanId)));
      }
    } catch {}

    return true;
  } catch (err) {
    console.error('Error deleting attempt', err);
    return false;
  }
}

// Delete all attempts for a given test ID
export function deleteAttemptsForTest(testId: string): void {
  try {
    const cleanTestId = String(testId).trim();
    const attempts = getAttempts();
    const attemptsToDelete = attempts.filter(a => String(a.testId).trim() === cleanTestId);
    const remaining = attempts.filter(a => String(a.testId).trim() !== cleanTestId);
    safeSetItem(KEYS.ATTEMPTS, JSON.stringify(remaining));

    const attemptIdsSet = new Set(attemptsToDelete.map(a => a.id));
    if (attemptIdsSet.size > 0) {
      try {
        const rawSnaps = safeGetItem(KEYS.SNAPSHOTS);
        if (rawSnaps) {
          const snaps: ProctoringSnapshot[] = JSON.parse(rawSnaps);
          safeSetItem(KEYS.SNAPSHOTS, JSON.stringify(snaps.filter(s => !attemptIdsSet.has(s.attemptId))));
        }
      } catch {}

      try {
        const rawEvents = safeGetItem(KEYS.EVENTS);
        if (rawEvents) {
          const evts: ProctoringEvent[] = JSON.parse(rawEvents);
          safeSetItem(KEYS.EVENTS, JSON.stringify(evts.filter(e => !attemptIdsSet.has(e.attemptId))));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Error deleting attempts for test', err);
  }
}

export function getAttemptsByCandidate(candidateId: string): Attempt[] {
  return getAttempts().filter(a => a.candidateId === candidateId);
}

export function getAttemptById(attemptId: string): Attempt | null {
  return getAttempts().find(a => a.id === attemptId) || null;
}

// ================= PROCTORING =================
// In production: Replace with `POST /api/proctoring/snapshot` (upload to S3 / Cloud Storage)
export function saveSnapshot(snapshot: ProctoringSnapshot): void {
  try {
    const raw = safeGetItem(KEYS.SNAPSHOTS);
    const list: ProctoringSnapshot[] = raw ? JSON.parse(raw) : [];
    // Keep max 15 snapshots in demo localStorage to avoid quota limits
    if (list.length >= 15) list.shift();
    list.push(snapshot);
    safeSetItem(KEYS.SNAPSHOTS, JSON.stringify(list));
  } catch (err) {
    console.warn('Snapshot storage error', err);
  }
}

export function getSnapshotsForAttempt(attemptId: string): ProctoringSnapshot[] {
  try {
    const raw = safeGetItem(KEYS.SNAPSHOTS);
    const list: ProctoringSnapshot[] = raw ? JSON.parse(raw) : [];
    return list.filter(s => s.attemptId === attemptId);
  } catch {
    return [];
  }
}

// In production: Replace with `POST /api/proctoring/event`
export function logProctoringEvent(event: ProctoringEvent): void {
  try {
    const raw = safeGetItem(KEYS.EVENTS);
    const list: ProctoringEvent[] = raw ? JSON.parse(raw) : [];
    if (list.length >= 50) list.shift();
    list.push(event);
    safeSetItem(KEYS.EVENTS, JSON.stringify(list));
  } catch (err) {
    console.warn('Event logging storage error', err);
  }
}

export function getEventsForAttempt(attemptId: string): ProctoringEvent[] {
  try {
    const raw = safeGetItem(KEYS.EVENTS);
    const list: ProctoringEvent[] = raw ? JSON.parse(raw) : [];
    return list.filter(e => e.attemptId === attemptId);
  } catch {
    return [];
  }
}

// ================= SETTINGS =================
export function getSettings(): AppSettings {
  try {
    const raw = safeGetItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  safeSetItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ================= SESSIONS =================
export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem(KEYS.ADMIN_SESSION) === 'true' ||
    localStorage.getItem(KEYS.ADMIN_SESSION) === 'true'
  );
}

export const isAdminSessionActive = isAdminLoggedIn;

export function setAdminSession(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem(KEYS.ADMIN_SESSION, 'true');
    localStorage.setItem(KEYS.ADMIN_SESSION, 'true');
  } else {
    sessionStorage.removeItem(KEYS.ADMIN_SESSION);
    localStorage.removeItem(KEYS.ADMIN_SESSION);
  }
}

export function clearAdminSession(): void {
  setAdminSession(false);
}

export function getCandidateSession(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem(KEYS.CANDIDATE_SESSION) ||
    localStorage.getItem(KEYS.CANDIDATE_SESSION)
  );
}

export function getCurrentCandidateSession(): Candidate | null {
  const id = getCandidateSession();
  if (!id) return null;
  return getCandidateById(id);
}

export function setCandidateSession(candidateId: string | null): void {
  if (typeof window === 'undefined') return;
  if (candidateId) {
    sessionStorage.setItem(KEYS.CANDIDATE_SESSION, candidateId);
    localStorage.setItem(KEYS.CANDIDATE_SESSION, candidateId);
  } else {
    sessionStorage.removeItem(KEYS.CANDIDATE_SESSION);
    localStorage.removeItem(KEYS.CANDIDATE_SESSION);
  }
}

export function clearCandidateSession(): void {
  setCandidateSession(null);
}

// Reset all storage to clean seed data
export function resetAllData(): void {
  safeSetItem(KEYS.TESTS, JSON.stringify([SEED_TEST]));
  safeSetItem(KEYS.CANDIDATES, JSON.stringify([SEED_CANDIDATE]));
  safeSetItem(KEYS.ATTEMPTS, JSON.stringify([]));
  safeSetItem(KEYS.SNAPSHOTS, JSON.stringify([]));
  safeSetItem(KEYS.EVENTS, JSON.stringify([]));
  safeSetItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  safeSetItem(KEYS.INITIALIZED, 'true');
}
