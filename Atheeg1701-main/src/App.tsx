import React, { useState, useEffect } from 'react';
import './firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CandidateAuth } from './components/CandidateAuth';
import { AdminLogin } from './components/AdminLogin';
import { CandidateDashboard } from './components/CandidateDashboard';
import { ExamEngine } from './components/ExamEngine';
import { ResultView } from './components/ResultView';
import { AdminPanel } from './components/AdminPanel';
import { CsvUploadModal } from './components/CsvUploadModal';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { NotFound } from './components/NotFound';
import { API_URL } from './config/env';
import { Test, Candidate, Attempt, AppSettings } from './types';
import {
  initializeStorage,
  getTests,
  getCandidates,
  getAttempts,
  getSettings,
  getCurrentCandidateSession,
  isAdminSessionActive,
  clearAdminSession,
  clearCandidateSession,
  getTestByCode,
  deleteAttempt,
  safeSetItem
} from './utils/storage';

export default function App() {
  // App initialization & reactive storage state
  const [tests, setTests] = useState<Test[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());

  // Session state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminSessionActive());
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(() => getCurrentCandidateSession());

  // View router state: 'landing' | 'candidate-auth' | 'admin-login' | 'candidate-dashboard' | 'exam' | 'result' | 'admin-panel'
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('atheeg_current_view');
      if (saved && saved !== 'exam') return saved;
      if (isAdminSessionActive()) return 'admin-panel';
      if (getCurrentCandidateSession()) return 'candidate-dashboard';
    } catch {}
    return 'landing';
  });
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  // Active exam / result state
  const [activeExamTest, setActiveExamTest] = useState<Test | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);

  // Global CSV Upload modal state
  const [isGlobalCsvModalOpen, setIsGlobalCsvModalOpen] = useState<boolean>(false);

  // Notification / toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<'checking' | 'ok' | 'offline' | 'error'>('checking');
  const [apiHealthMessage, setApiHealthMessage] = useState('Checking backend connection...');

  useEffect(() => {
    if (!API_URL) {
      setApiHealth('offline');
      setApiHealthMessage('Backend not configured. Running in local demo mode.');
      return;
    }

    const controller = new AbortController();

    fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const payload = await response.json();
        if (payload.status === 'ok') {
          setApiHealth('ok');
          setApiHealthMessage('Backend connected and healthy.');
        } else {
          throw new Error('Unexpected health payload');
        }
      })
      .catch(() => {
        setApiHealth('error');
        setApiHealthMessage('Unable to reach backend. Please verify VITE_API_URL.');
      });

    return () => controller.abort();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const isTestAvailable = (test: Test) => {
    const now = new Date();

    if (test.opensAt) {
      const opensAt = new Date(test.opensAt);
      if (Number.isNaN(opensAt.getTime()) || opensAt.getTime() > now.getTime()) {
        return false;
      }
    }

    if (test.closesAt) {
      const closesAt = new Date(test.closesAt);
      if (Number.isNaN(closesAt.getTime()) || closesAt.getTime() < now.getTime()) {
        return false;
      }
    }

    if (test.allowedStartTime && test.allowedEndTime) {
      const [startHour, startMinute] = test.allowedStartTime.split(':').map(Number);
      const [endHour, endMinute] = test.allowedEndTime.split(':').map(Number);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
        return false;
      }
    }

    return true;
  };

  // Sync data from localStorage
  const refreshAppData = () => {
    initializeStorage();
    const storedTests = getTests();
    const storedCandidates = getCandidates();
    const storedAttempts = getAttempts();
    const storedSettings = getSettings();

    setTests(storedTests);
    setCandidates(storedCandidates);
    setAttempts(storedAttempts);
    setSettings(storedSettings);

    const adminLoggedIn = isAdminSessionActive();
    setIsAdmin(adminLoggedIn);

    const cand = getCurrentCandidateSession();
    setCurrentCandidate(cand);
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  // Navigation handler
  const handleNavigate = (view: string, initialTab: 'login' | 'register' = 'login') => {
    if (view === 'candidate-auth') {
      setAuthInitialTab(initialTab);
    }
    setCurrentView(view);
    if (view !== 'exam') {
      safeSetItem('atheeg_current_view', view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch test by code
  const handleStartExamByCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const test = getTestByCode(trimmed);

    if (!test) {
      showToast(`Test with code "${trimmed}" was not found. Please verify the code or try the demo test code "ATH-GK101".`);
      return;
    }

    if (!isTestAvailable(test)) {
      showToast('This assessment is not currently available within its scheduling window.');
      return;
    }

    if (!currentCandidate) {
      showToast('Please log in or register as a candidate first before taking this test.');
      handleNavigate('candidate-auth', 'login');
      return;
    }

    setActiveExamTest(test);
    setCurrentView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When an exam is finished
  const handleFinishExam = (attempt: Attempt) => {
    setActiveAttempt(attempt);
    refreshAppData();
    setCurrentView('result');
    safeSetItem('atheeg_current_view', 'result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to delete an attempt
  const handleDeleteAttempt = (attemptId: string) => {
    deleteAttempt(attemptId);
    refreshAppData();
    showToast('Examination record deleted.');
  };

  // Candidate logout
  const handleCandidateLogout = () => {
    clearCandidateSession();
    setCurrentCandidate(null);
    try {
      localStorage.removeItem('atheeg_current_view');
    } catch {}
    showToast('Signed out of candidate account.');
    handleNavigate('landing');
  };

  // Admin logout
  const handleAdminLogout = () => {
    clearAdminSession();
    setIsAdmin(false);
    try {
      localStorage.removeItem('atheeg_current_view');
    } catch {}
    showToast('Admin session logged out.');
    handleNavigate('landing');
  };

  // Download the single-file atheeg-test.html
  const handleDownloadHtml = () => {
    const link = document.createElement('a');
    link.href = '/atheeg-test.html';
    link.download = 'atheeg-test.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validViews = new Set([
    'landing',
    'candidate-auth',
    'admin-login',
    'candidate-dashboard',
    'exam',
    'result',
    'admin-panel'
  ]);

  if (!validViews.has(currentView)) {
    return <NotFound onNavigate={handleNavigate} />;
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Inter'] selection:bg-blue-600 selection:text-white relative">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-blue-900/95 border border-blue-400/40 text-xs font-semibold text-white shadow-xl backdrop-blur-md animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Persistent Navigation Bar (hidden during active full-screen exam for focus) */}
      {currentView !== 'exam' && currentView !== 'admin-panel' && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          isAdmin={isAdmin}
          candidate={currentCandidate}
          onLogout={isAdmin ? handleAdminLogout : handleCandidateLogout}
          onDownloadHtml={handleDownloadHtml}
          onOpenCsvUpload={() => setIsGlobalCsvModalOpen(true)}
        />
      )}

      {/* Main View Display */}
      <main className="flex-1 flex flex-col">
        {/* LANDING PAGE */}
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            availableTests={tests.filter((t) => t.published && isTestAvailable(t))}
            onStartExamByCode={handleStartExamByCode}
            isCandidateLoggedIn={!!currentCandidate}
            isAdminLoggedIn={isAdmin}
          />
        )}

        {/* CANDIDATE AUTHENTICATION (LOGIN / REGISTER) */}
        {currentView === 'candidate-auth' && (
          <CandidateAuth
            initialTab={authInitialTab}
            onNavigate={handleNavigate}
            onSuccessLogin={(cand) => {
              setCurrentCandidate(cand);
              refreshAppData();
              handleNavigate('candidate-dashboard');
              showToast(`Welcome back, ${cand.name}!`);
            }}
          />
        )}

        {/* ADMIN LOGIN */}
        {currentView === 'admin-login' && (
          <AdminLogin
            onNavigate={handleNavigate}
            onSuccessAdminLogin={() => {
              setIsAdmin(true);
              refreshAppData();
              handleNavigate('admin-panel');
              showToast('Admin access granted.');
            }}
          />
        )}

        {/* CANDIDATE DASHBOARD */}
        {currentView === 'candidate-dashboard' && currentCandidate && (
          <CandidateDashboard
            candidate={currentCandidate}
            tests={tests.filter((t) => t.published && isTestAvailable(t))}
            attempts={attempts}
            onStartExamByCode={handleStartExamByCode}
            onViewAttemptResult={(att) => {
              setActiveAttempt(att);
              setCurrentView('result');
            }}
            onDeleteAttempt={handleDeleteAttempt}
            onLogout={handleCandidateLogout}
          />
        )}

        {/* CANDIDATE DASHBOARD FALLBACK IF NOT LOGGED IN */}
        {currentView === 'candidate-dashboard' && !currentCandidate && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center max-w-md shadow-sm">
              <p className="text-sm text-slate-600 mb-4">Please log in to view your candidate dashboard.</p>
              <button
                onClick={() => handleNavigate('candidate-auth', 'login')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        )}

        {/* EXAM ENGINE */}
        {currentView === 'exam' && activeExamTest && currentCandidate && (
          <ExamEngine
            test={activeExamTest}
            candidate={currentCandidate}
            onFinishExam={handleFinishExam}
            onCancelExam={() => {
              handleNavigate('candidate-dashboard');
            }}
          />
        )}

        {/* EXAM FALLBACK IF RELOADED */}
        {currentView === 'exam' && (!activeExamTest || !currentCandidate) && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center max-w-md shadow-sm">
              <p className="text-sm text-slate-700 font-semibold mb-2">No active test session found</p>
              <p className="text-xs text-slate-500 mb-5">Please return to the dashboard to select and start an exam.</p>
              <button
                onClick={() => handleNavigate(currentCandidate ? 'candidate-dashboard' : 'landing')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* RESULT VIEW */}
        {currentView === 'result' && activeAttempt && (
          <ResultView
            attempt={activeAttempt}
            test={tests.find((t) => t.id === activeAttempt.testId) || null}
            onBackToDashboard={() => {
              if (currentCandidate) {
                handleNavigate('candidate-dashboard');
              } else {
                handleNavigate('landing');
              }
            }}
            onRetakeTest={(code) => handleStartExamByCode(code)}
          />
        )}

        {/* ADMIN PANEL */}
        {currentView === 'admin-panel' && isAdmin && (
          <AdminPanel
            tests={tests}
            candidates={candidates}
            attempts={attempts}
            settings={settings}
            onRefreshData={refreshAppData}
            onDeleteAttempt={handleDeleteAttempt}
            onLogout={handleAdminLogout}
          />
        )}

        {/* ADMIN PANEL FALLBACK IF NOT AUTHENTICATED */}
        {currentView === 'admin-panel' && !isAdmin && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center max-w-md shadow-sm">
              <p className="text-sm text-rose-600 font-semibold mb-4">
                Restricted Admin Access. Please authenticate first.
              </p>
              <button
                onClick={() => handleNavigate('admin-login')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Admin Sign In
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer (shown on landing and candidate views) */}
      {currentView !== 'exam' && currentView !== 'admin-panel' && (
        <footer className="border-t border-slate-200 bg-white py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-['Poppins']">Atheeg Test</span>
              <span>&bull;</span>
              <span>Master Every Test. Ace Every Exam.</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                onClick={handleDownloadHtml}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer font-medium"
              >
                Download atheeg-test.html
              </button>
              <span>&bull;</span>
              <button
                onClick={() => handleNavigate('admin-login')}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer font-medium"
              >
                Admin Access
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
                <span className={`h-2 w-2 rounded-full ${apiHealth === 'ok' ? 'bg-emerald-500' : apiHealth === 'checking' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                {apiHealthMessage}
              </span>
            </div>
          </div>
        </footer>
      )}
      {/* Global CSV to Quiz Upload Modal */}
      <CsvUploadModal
        isOpen={isGlobalCsvModalOpen}
        onClose={() => setIsGlobalCsvModalOpen(false)}
        onSuccess={(newTest) => {
          refreshAppData();
          showToast(`Quiz "${newTest.title}" (${newTest.levels.length} levels) created successfully! Code: ${newTest.code}`);
        }}
      />
    </div>
    </AppErrorBoundary>
  );
}
