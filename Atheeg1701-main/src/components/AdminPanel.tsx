import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  History,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  KeyRound,
  ChevronDown,
  RefreshCw,
  Video,
  FileSpreadsheet,
  Camera
} from 'lucide-react';
import { Test, Candidate, Attempt, AppSettings, TestLevel, Question, ProctoringSnapshot, ProctoringEvent } from '../types';
import {
  saveTest,
  deleteTest,
  saveSettings,
  resetAllData,
  getSnapshotsForAttempt,
  getEventsForAttempt,
  saveCandidate,
  deleteCandidate
} from '../utils/storage';
import { exportAttemptsToCSV, generateCandidateResultPDF } from '../utils/pdfGenerator';
import { CsvUploadModal } from './CsvUploadModal';

interface AdminPanelProps {
  tests: Test[];
  candidates: Candidate[];
  attempts: Attempt[];
  settings: AppSettings;
  onRefreshData: () => void;
  onDeleteAttempt?: (attemptId: string) => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  tests,
  candidates,
  attempts,
  settings,
  onRefreshData,
  onDeleteAttempt,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tests' | 'candidates' | 'attempts' | 'analytics' | 'settings'>('dashboard');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [candidateFormError, setCandidateFormError] = useState('');

  // Test editor modal state
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Attempt detail modal
  const [selectedAttemptForAudit, setSelectedAttemptForAudit] = useState<Attempt | null>(null);
  const [auditSnapshots, setAuditSnapshots] = useState<ProctoringSnapshot[]>([]);
  const [auditEvents, setAuditEvents] = useState<ProctoringEvent[]>([]);

  // Deletion and Reset In-App Confirmation States (No window.confirm/alert for iframe safety)
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [attemptToDelete, setAttemptToDelete] = useState<Attempt | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [adminFeedbackMessage, setAdminFeedbackMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setAdminFeedbackMessage(msg);
    setTimeout(() => {
      setAdminFeedbackMessage(null);
    }, 4000);
  };

  // Settings form state
  const [proctoringToggle, setProctoringToggle] = useState(settings.proctoringEnabled);
  const [autoEndTabToggle, setAutoEndTabToggle] = useState(settings.autoEndOnTabSwitch ?? true);
  const [capturePhotoTabToggle, setCapturePhotoTabToggle] = useState(settings.capturePhotoOnTabSwitch ?? true);

  // KPI calculations
  const totalTests = tests.length;
  const totalCandidates = candidates.length;
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts)
    : 0;
  const passCount = attempts.filter(a => a.percentage >= 60).length;
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;
  const bestAttempt = attempts.reduce<Attempt | null>((best, current) => {
    if (!best || current.percentage > best.percentage) return current;
    return best;
  }, null);
  const topPerformer = bestAttempt ? bestAttempt.candidateName : 'N/A';
  const topTest = attempts.length > 0
    ? attempts.reduce<Record<string, number>>((acc, attempt) => {
        acc[attempt.testTitle] = (acc[attempt.testTitle] || 0) + 1;
        return acc;
      }, {})
    : {};
  const mostAttemptedTest = Object.entries(topTest).sort((a, b) => b[1] - a[1])[0];
  const recentResults = [...attempts].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 6);

  // Handler to open Attempt Audit Modal
  const handleOpenAuditModal = (attempt: Attempt) => {
    setSelectedAttemptForAudit(attempt);
    const snaps = getSnapshotsForAttempt(attempt.id);
    const evts = getEventsForAttempt(attempt.id);
    setAuditSnapshots(snaps);
    setAuditEvents(evts);
  };

  // Handler to open Create Test modal
  const handleOpenCreateTest = () => {
    const randomCode = `ATH-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTest: Test = {
      id: `test_${Date.now()}`,
      title: 'New Assessment Test',
      description: 'Description of the newly created test assessment.',
      code: randomCode,
      duration: 15,
      published: true,
      createdAt: new Date().toISOString(),
      levels: [
        {
          id: `lvl_${Date.now()}_1`,
          name: 'Level 1: Core Concepts',
          timeLimit: 10,
          questions: [
            {
              id: `q_${Date.now()}_1`,
              text: 'Sample question 1 text?',
              options: ['Option Alpha', 'Option Beta', 'Option Gamma', 'Option Delta'],
              correctIndex: 0,
              explanation: 'Detailed solution explanation for this question.',
              difficulty: 'Easy'
            }
          ]
        }
      ]
    };
    setEditingTest(newTest);
    setIsTestModalOpen(true);
  };

  // Handler to save test
  const handleSaveTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    saveTest(editingTest);
    setIsTestModalOpen(false);
    setEditingTest(null);
    showNotification('Assessment test saved successfully.');
    onRefreshData();
  };

  // In-app handler to permanently delete test
  const handleConfirmDeleteTest = () => {
    if (!testToDelete) return;
    const testTitle = testToDelete.title;
    deleteTest(testToDelete.id);
    setTestToDelete(null);
    showNotification(`Test "${testTitle}" has been permanently deleted.`);
    onRefreshData();
  };

  // In-app handler to permanently delete an attempt
  const handleConfirmDeleteAttempt = () => {
    if (!attemptToDelete) return;
    const testTitle = attemptToDelete.testTitle;
    if (onDeleteAttempt) {
      onDeleteAttempt(attemptToDelete.id);
    }
    if (selectedAttemptForAudit?.id === attemptToDelete.id) {
      setSelectedAttemptForAudit(null);
    }
    setAttemptToDelete(null);
    showNotification(`Candidate attempt for "${testTitle}" has been deleted.`);
    onRefreshData();
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateFormError('');

    const name = candidateForm.name.trim();
    const email = candidateForm.email.trim().toLowerCase();
    const phone = candidateForm.phone.replace(/\D/g, '');
    const password = candidateForm.password.trim();

    if (!name || !email || !phone || !password) {
      setCandidateFormError('Please complete all student fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCandidateFormError('Please provide a valid email address.');
      return;
    }

    if (phone.length !== 10) {
      setCandidateFormError('Phone number must be exactly 10 digits.');
      return;
    }

    if (password.length < 6) {
      setCandidateFormError('Password must be at least 6 characters long.');
      return;
    }

    if (candidates.some(c => c.email.toLowerCase() === email)) {
      setCandidateFormError('A student with this email already exists.');
      return;
    }

    const newCandidate: Candidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      phone,
      password,
      createdAt: new Date().toISOString()
    };

    saveCandidate(newCandidate);
    setCandidateForm({ name: '', email: '', phone: '', password: '' });
    showNotification(`${name} has been added as a student.`);
    onRefreshData();
  };

  const handleDeleteCandidate = (candidate: Candidate) => {
    deleteCandidate(candidate.id);
    showNotification(`${candidate.name} has been removed from student records.`);
    onRefreshData();
  };

  // Handler for saving settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      ...settings,
      proctoringEnabled: proctoringToggle,
      autoEndOnTabSwitch: autoEndTabToggle,
      capturePhotoOnTabSwitch: capturePhotoTabToggle
    });
    showNotification('Settings updated successfully.');
    onRefreshData();
  };

  // Handler for resetting all data
  const handleConfirmResetData = () => {
    resetAllData();
    setShowResetConfirm(false);
    showNotification('Platform demonstration data reset to clean seeds.');
    onRefreshData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 font-['Poppins'] block">
                Admin Control
              </span>
              <span className="text-[10px] text-slate-500">Atheeg Test v2.4</span>
            </div>
          </div>
        </div>

        {/* Sidebar Menu Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            id="admin-nav-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="admin-nav-tests"
            onClick={() => setActiveTab('tests')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manage Tests</span>
          </button>

          <button
            id="admin-nav-candidates"
            onClick={() => setActiveTab('candidates')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidates ({candidates.length})</span>
          </button>

          <button
            id="admin-nav-attempts"
            onClick={() => setActiveTab('attempts')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'attempts'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Exam Attempts ({attempts.length})</span>
          </button>

          <button
            id="admin-nav-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            id="admin-nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>
        </nav>

        {/* Sidebar Admin Identity Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-[11px] font-semibold text-slate-800 block truncate">
                madderlachethan@gmail.com
              </span>
              <span className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">
                Root SuperAdmin
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 font-['Poppins'] capitalize">
              {activeTab} Overview
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="admin-header-logout-btn"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900 font-['Poppins']">{totalTests}</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mt-1">Total Tests</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 font-['Poppins']">{totalCandidates}</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mt-1">Candidates</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600 font-['Poppins']">{totalAttempts}</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mt-1">Attempts Logged</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600 font-['Poppins']">{avgScore}%</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mt-1">Avg Score</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-2xl font-bold text-sky-600 font-['Poppins']">{passRate}%</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mt-1">Pass Rate</div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Quick Actions</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Author new exam questions, inspect candidate audit logs, or export reports.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleOpenCreateTest}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Assessment</span>
                  </button>
                  <button
                    onClick={() => exportAttemptsToCSV(attempts)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Export Attempts CSV</span>
                  </button>
                </div>
              </div>

              {/* Recent Attempts Table Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 font-['Poppins']">Recent Examinations</h3>
                  <button
                    onClick={() => setActiveTab('attempts')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    View All Attempts &rarr;
                  </button>
                </div>

                {attempts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No examination attempts logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Candidate</th>
                          <th className="py-2.5 px-3">Test</th>
                          <th className="py-2.5 px-3">Score</th>
                          <th className="py-2.5 px-3">Accuracy</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {attempts.slice(0, 5).map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-900 block">{a.candidateName}</span>
                              <span className="text-[10px] text-slate-500">{a.candidateEmail}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="block font-medium text-slate-800">{a.testTitle}</span>
                              <span className="text-[10px] font-mono text-blue-600 font-semibold">{a.testCode}</span>
                            </td>
                            <td className="py-3 px-3">{a.score}/{a.totalQuestions}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                a.percentage >= 60
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {a.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {new Date(a.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleOpenAuditModal(a)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                Review Log
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE TESTS (CRUD) */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Assessment Test Suites</h3>
                  <p className="text-xs text-slate-500">Create, edit, or configure dynamic levels and question banks.</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    id="admin-upload-csv-btn"
                    onClick={() => setIsCsvModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload CSV to Quiz</span>
                  </button>
                  <button
                    id="admin-create-test-btn"
                    onClick={handleOpenCreateTest}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Assessment</span>
                  </button>
                </div>
              </div>

              {/* Get Started Workflow Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-['Poppins']">Get Started: Add New Assessment</h4>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                      Upload your questions CSV file to auto-generate a multi-level quiz with section timers, or compose custom assessment stages manually.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => setIsCsvModalOpen(true)}
                    className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload CSV</span>
                  </button>
                  <button
                    onClick={handleOpenCreateTest}
                    className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Manual Builder</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tests.map((test) => {
                  const totalQ = test.levels.reduce((acc, lvl) => acc + lvl.questions.length, 0);
                  return (
                    <div
                      key={test.id}
                      className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                            {test.code}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            Published
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 font-['Poppins'] mb-1">
                          {test.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {test.description}
                        </p>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Duration:</span>
                            <span className="font-bold text-slate-900">{test.duration} Minutes</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Dynamic Levels:</span>
                            <span className="font-bold text-slate-900">{test.levels.length} Stages</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Total Questions:</span>
                            <span className="font-bold text-blue-600">{totalQ} Questions</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setEditingTest(JSON.parse(JSON.stringify(test)));
                            setIsTestModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTestToDelete(test)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Delete ${test.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CANDIDATES */}
          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Registered Candidates</h3>
                  <p className="text-xs text-slate-500">View, add, and remove enrolled student records.</p>
                </div>
                <div className="w-full sm:w-64">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddCandidate} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900 font-['Poppins']">Add New Student</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={candidateForm.name}
                      onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Student name"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={candidateForm.email}
                      onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="student@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={candidateForm.phone}
                      onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Password</label>
                    <input
                      type="text"
                      value={candidateForm.password}
                      onChange={(e) => setCandidateForm({ ...candidateForm, password: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                {candidateFormError && (
                  <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    {candidateFormError}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Save Student
                  </button>
                </div>
              </form>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Candidate Name</th>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4">Enrolled Date</th>
                        <th className="py-3 px-4">Exams Completed</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {candidates
                        .filter(c =>
                          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((c) => {
                          const userAttemptsCount = attempts.filter(a => a.candidateId === c.id).length;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 text-slate-900 font-semibold">{c.name}</td>
                              <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{c.phone}</td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                                  {userAttemptsCount} Tests
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCandidate(c)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTEMPTS */}
          {activeTab === 'attempts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Examination Audit Logs</h3>
                  <p className="text-xs text-slate-500">Full candidate attempt breakdown, proctoring telemetry, and records management.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportAttemptsToCSV(attempts)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Test Name &amp; Code</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Percentage</th>
                        <th className="py-3 px-4">Time Spent</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Proctor Alerts</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {attempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{att.candidateName}</span>
                            <span className="text-[10px] text-slate-500">{att.candidateEmail}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="block text-slate-800">{att.testTitle}</span>
                            <span className="text-[10px] font-mono text-blue-600 font-semibold">{att.testCode}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800">{att.score} / {att.totalQuestions}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              att.percentage >= 60
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {att.percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {Math.floor(att.timeTaken / 60)}m {att.timeTaken % 60}s
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(att.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            {att.proctoringEventsCount > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                {att.proctoringEventsCount} alerts
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Clean</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenAuditModal(att)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Audit Log
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttemptToDelete(att)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                                title="Delete this attempt"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Results Analytics</h3>
                <p className="text-xs text-slate-500">Track student outcomes, score trends, and performance by assessment.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-[11px] uppercase font-semibold text-slate-500">Total attempts</div>
                  <div className="mt-2 text-2xl font-black text-slate-900 font-['Poppins']">{totalAttempts}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-[11px] uppercase font-semibold text-slate-500">Average score</div>
                  <div className="mt-2 text-2xl font-black text-blue-600 font-['Poppins']">{avgScore}%</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-[11px] uppercase font-semibold text-slate-500">Top performer</div>
                  <div className="mt-2 text-base font-bold text-emerald-600">{topPerformer}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-[11px] uppercase font-semibold text-slate-500">Most attempted test</div>
                  <div className="mt-2 text-sm font-bold text-slate-900">{mostAttemptedTest ? mostAttemptedTest[0] : 'No data'}</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 font-['Poppins']">Recent Results</h4>
                  <span className="text-[11px] text-slate-500">Latest submissions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Test</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Percent</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {recentResults.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 text-slate-900 font-semibold">{attempt.candidateName}</td>
                          <td className="py-3.5 px-4">{attempt.testTitle}</td>
                          <td className="py-3.5 px-4">{attempt.score}/{attempt.totalQuestions}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              attempt.percentage >= 60
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {attempt.percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Score Range Distribution Bar Chart */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 font-['Poppins'] mb-4 flex items-center justify-between">
                    <span>Score Distribution Ranges</span>
                    <span className="text-xs text-slate-500">{attempts.length} attempts</span>
                  </h4>

                  <div className="space-y-3 pt-2">
                    {[
                      { range: '90 - 100%', count: attempts.filter(a => a.percentage >= 90).length, color: 'bg-emerald-500' },
                      { range: '75 - 89%', count: attempts.filter(a => a.percentage >= 75 && a.percentage < 90).length, color: 'bg-blue-500' },
                      { range: '60 - 74%', count: attempts.filter(a => a.percentage >= 60 && a.percentage < 75).length, color: 'bg-indigo-500' },
                      { range: '40 - 59%', count: attempts.filter(a => a.percentage >= 40 && a.percentage < 60).length, color: 'bg-amber-500' },
                      { range: '< 40%', count: attempts.filter(a => a.percentage < 40).length, color: 'bg-rose-500' }
                    ].map((item, i) => {
                      const pctOfAttempts = attempts.length > 0 ? (item.count / attempts.length) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium">{item.range}</span>
                            <span className="text-slate-500">{item.count} candidates ({Math.round(pctOfAttempts)}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-500`}
                              style={{ width: `${pctOfAttempts}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pass vs Fail Ratio */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-['Poppins'] mb-4">
                      Pass / Retake Status Breakdown
                    </h4>

                    <div className="flex items-center justify-center py-6">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" className="text-rose-100" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 - (2 * Math.PI * 40 * passRate) / 100}
                            className="text-emerald-500 transition-all duration-1000"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-slate-900 font-['Poppins']">{passRate}%</span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Pass Rate</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-center">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-lg font-bold text-emerald-700 font-['Poppins']">{passCount}</span>
                      <span className="block text-[10px] uppercase text-emerald-600 font-semibold mt-0.5">Passing</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-lg font-bold text-rose-700 font-['Poppins']">{attempts.length - passCount}</span>
                      <span className="block text-[10px] uppercase text-rose-600 font-semibold mt-0.5">Retake</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Platform Configurations</h3>
                <p className="text-xs text-slate-500">Control system policies, consent rules, and persistent seed data.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Smart Proctoring &amp; Webcam Audits</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Enforce pre-exam consent modal and periodic 30s snapshots.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proctoringToggle}
                      onChange={(e) => setProctoringToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Capture Photo on Tab Switch</h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200 font-medium">
                        Camera Evidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Automatically take an evidentiary webcam photograph the instant a candidate switches tabs or leaves focus.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capturePhotoTabToggle}
                      onChange={(e) => setCapturePhotoTabToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-rose-600">Auto-End Exam on Tab Switch</h4>
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-mono border border-rose-200 font-medium">
                        Strict Policy
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Immediately terminate and submit the exam as Disqualified when a tab switch or defocus is detected.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoEndTabToggle}
                      onChange={(e) => setAutoEndTabToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>

              {/* Data Reset Box */}
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Reset Seed Demonstration Data</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clear custom local tests, reset candidates back to standard seed, and purge stored snapshots.
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset All Demo Data
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE / EDIT TEST MODAL */}
      {isTestModalOpen && editingTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">
                  {editingTest.id.startsWith('test_') ? 'Assessment Suite Builder' : 'Edit Assessment'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure dynamic levels, questions, and duration.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestModalOpen(false);
                    setIsCsvModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import from CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer px-2 text-xl font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveTestSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Title</label>
                  <input
                    type="text"
                    required
                    value={editingTest.title}
                    onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Code</label>
                  <input
                    type="text"
                    required
                    value={editingTest.code}
                    onChange={(e) => setEditingTest({ ...editingTest, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-blue-700 uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingTest.description}
                  onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingTest.duration}
                    onChange={(e) => setEditingTest({ ...editingTest, duration: parseInt(e.target.value) || 10 })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingTest.published ? 'published' : 'draft'}
                    onChange={(e) => setEditingTest({ ...editingTest, published: e.target.value === 'published' })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="published">Published &amp; Active</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Levels Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 font-['Poppins']">Test Levels &amp; Questions</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newLevel: TestLevel = {
                        id: `lvl_${Date.now()}_${editingTest.levels.length + 1}`,
                        name: `Level ${editingTest.levels.length + 1}: General`,
                        timeLimit: 5,
                        questions: [
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                            text: 'Enter question text here',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctIndex: 0,
                            explanation: 'Explanation for correct option A',
                            difficulty: 'Medium'
                          }
                        ]
                      };
                      setEditingTest({
                        ...editingTest,
                        levels: [...editingTest.levels, newLevel]
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Level</span>
                  </button>
                </div>

                {editingTest.levels.map((lvl, lvlIdx) => (
                  <div key={lvl.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={lvl.name}
                        onChange={(e) => {
                          const updatedLevels = [...editingTest.levels];
                          updatedLevels[lvlIdx].name = e.target.value;
                          setEditingTest({ ...editingTest, levels: updatedLevels });
                        }}
                        className="font-semibold text-xs text-slate-900 bg-white border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-blue-600 flex-1"
                      />
                      {editingTest.levels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingTest.levels.filter((_, i) => i !== lvlIdx);
                            setEditingTest({ ...editingTest, levels: updated });
                          }}
                          className="text-rose-600 text-xs hover:underline cursor-pointer"
                        >
                          Remove Level
                        </button>
                      )}
                    </div>

                    {/* Questions in this level */}
                    <div className="space-y-3 pl-2">
                      {lvl.questions.map((q, qIdx) => (
                        <div key={q.id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 text-xs shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-700">Question {qIdx + 1}</span>
                            <div className="flex items-center gap-2">
                              <select
                                value={q.difficulty}
                                onChange={(e) => {
                                  const updatedLevels = [...editingTest.levels];
                                  updatedLevels[lvlIdx].questions[qIdx].difficulty = e.target.value as any;
                                  setEditingTest({ ...editingTest, levels: updatedLevels });
                                }}
                                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-700"
                              >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                              </select>
                              {lvl.questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLevels = [...editingTest.levels];
                                    updatedLevels[lvlIdx].questions = updatedLevels[lvlIdx].questions.filter((_, idx) => idx !== qIdx);
                                    setEditingTest({ ...editingTest, levels: updatedLevels });
                                  }}
                                  className="text-rose-600 hover:text-rose-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Question text"
                            value={q.text}
                            onChange={(e) => {
                              const updatedLevels = [...editingTest.levels];
                              updatedLevels[lvlIdx].questions[qIdx].text = e.target.value;
                              setEditingTest({ ...editingTest, levels: updatedLevels });
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                          />

                          {/* 4 Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_${lvl.id}_${q.id}`}
                                  checked={q.correctIndex === optIdx}
                                  onChange={() => {
                                    const updatedLevels = [...editingTest.levels];
                                    updatedLevels[lvlIdx].questions[qIdx].correctIndex = optIdx;
                                    setEditingTest({ ...editingTest, levels: updatedLevels });
                                  }}
                                  title="Mark as correct answer"
                                  className="text-emerald-600 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updatedLevels = [...editingTest.levels];
                                    updatedLevels[lvlIdx].questions[qIdx].options[optIdx] = e.target.value;
                                    setEditingTest({ ...editingTest, levels: updatedLevels });
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                                />
                              </div>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="Explanation / solution rationale"
                            value={q.explanation}
                            onChange={(e) => {
                              const updatedLevels = [...editingTest.levels];
                              updatedLevels[lvlIdx].questions[qIdx].explanation = e.target.value;
                              setEditingTest({ ...editingTest, levels: updatedLevels });
                            }}
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const newQ: Question = {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                            text: 'New question prompt...',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctIndex: 0,
                            explanation: 'Explanation for correct answer',
                            difficulty: 'Medium'
                          };
                          const updatedLevels = [...editingTest.levels];
                          updatedLevels[lvlIdx].questions.push(newQ);
                          setEditingTest({ ...editingTest, levels: updatedLevels });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question to {lvl.name}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED ATTEMPT & PROCTORING AUDIT MODAL */}
      {selectedAttemptForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins'] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Comprehensive Proctoring &amp; Exam Audit</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attempt #{selectedAttemptForAudit.id} &bull; Candidate: {selectedAttemptForAudit.candidateName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttemptForAudit(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-xl font-bold px-2"
              >
                &times;
              </button>
            </div>

            {/* Scorecard Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500">Score</span>
                <span className="block text-base font-bold text-slate-900 font-['Poppins']">
                  {selectedAttemptForAudit.score}/{selectedAttemptForAudit.totalQuestions}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500">Percentage</span>
                <span className="block text-base font-bold text-blue-700 font-['Poppins']">
                  {selectedAttemptForAudit.percentage}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500">Time Taken</span>
                <span className="block text-base font-bold text-slate-800 font-['Poppins']">
                  {Math.floor(selectedAttemptForAudit.timeTaken / 60)}m {selectedAttemptForAudit.timeTaken % 60}s
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500">Proctor Alerts</span>
                <span className="block text-base font-bold text-amber-600 font-['Poppins']">
                  {selectedAttemptForAudit.proctoringEventsCount}
                </span>
              </div>
            </div>

            {/* Captured Tab Switch Violation Photo */}
            {selectedAttemptForAudit.violationSnapshot && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-rose-600" />
                    <span>Captured Tab-Switch Violation Photo (Evidentiary Record)</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-[10px] font-mono font-bold text-white uppercase">
                    Automatic Ending Trigger
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="relative w-48 aspect-video rounded-xl overflow-hidden bg-black border border-rose-300 shadow-md shrink-0">
                    <img
                      src={selectedAttemptForAudit.violationSnapshot}
                      alt="Violation Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-rose-300 font-mono text-[9px]">
                      FLAGGED SNAPSHOT
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-semibold text-rose-900">
                      Reason: {selectedAttemptForAudit.terminationReason || 'Exam terminated due to unauthorized tab switch.'}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Captured instantaneously via candidate webcam the moment document visibility changed to hidden. The session was closed, and this photo was permanently stored in the institutional database.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Captured 30-sec Proctoring Snapshots */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Poppins'] mb-3 flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <span>Captured Video Audit Snapshots (30s intervals)</span>
              </h4>

              {auditSnapshots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  No camera snapshots recorded for this session (simulated or proctoring disabled).
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {auditSnapshots.map((snap, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 shadow-xs">
                      <div className="w-full h-24 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={snap.imageData}
                          alt={`Audit frame ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event Audit Log */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Poppins'] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Focus &amp; Tab-Switch Incidents</span>
              </h4>

              {auditEvents.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                  Clean candidate session: No tab switching or browser defocus recorded.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {auditEvents.map((evt, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <span className="text-amber-700 font-semibold">{evt.type}</span>
                      <span className="text-slate-600 text-[11px]">{evt.details || 'Browser blurred'}</span>
                      <span className="text-slate-400 text-[10px] font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => generateCandidateResultPDF(selectedAttemptForAudit)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Candidate Certificate PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAttemptForAudit(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification */}
      {adminFeedbackMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{adminFeedbackMessage}</span>
        </div>
      )}

      {/* In-App Test Deletion Confirmation Modal */}
      {testToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Delete Assessment Test?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <span className="text-rose-600 font-semibold">{testToDelete.title}</span> (<span className="font-mono text-blue-700 font-bold">{testToDelete.code}</span>)?
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will remove the test and its configured question levels from your database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTestToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTest}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Assessment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Attempt Deletion Confirmation Modal */}
      {attemptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Delete Candidate Attempt?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to delete the attempt of <span className="font-semibold text-slate-900">{attemptToDelete.candidateName}</span> for <span className="text-blue-600 font-semibold">{attemptToDelete.testTitle}</span>?
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will permanently remove this attempt, score record, and all associated proctoring snapshots from storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAttemptToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAttempt}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Attempt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Demo Data Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Reset Demo Data to Seeds?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will reseed standard candidate test data, clear custom assessments, and purge stored snapshots.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetData}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV to Quiz Upload Modal */}
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          onRefreshData();
        }}
      />
    </div>
  );
};
