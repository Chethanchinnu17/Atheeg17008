import React, { useState } from 'react';
import {
  KeyRound,
  ArrowRight,
  Clock,
  Layers,
  Award,
  Calendar,
  LogOut,
  FileText,
  AlertCircle,
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { Candidate, Test, Attempt } from '../types';

interface CandidateDashboardProps {
  candidate: Candidate;
  tests: Test[];
  attempts: Attempt[];
  onStartExamByCode: (code: string) => void;
  onViewAttemptResult: (attempt: Attempt) => void;
  onDeleteAttempt?: (attemptId: string) => void;
  onLogout: () => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  candidate,
  tests,
  attempts,
  onStartExamByCode,
  onViewAttemptResult,
  onDeleteAttempt,
  onLogout
}) => {
  const [testCodeInput, setTestCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptToDelete, setAttemptToDelete] = useState<Attempt | null>(null);

  const candidateAttempts = attempts.filter(a => a.candidateId === candidate.id);
  const totalCompleted = candidateAttempts.length;
  const avgScore = totalCompleted > 0
    ? Math.round(candidateAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalCompleted)
    : 0;

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = testCodeInput.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter an exam code to begin.');
      return;
    }
    onStartExamByCode(code);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-500/10">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Candidate Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Poppins']">
              Welcome back, {candidate.name}
            </h1>
            <p className="text-sm text-blue-100 mt-1.5 flex items-center gap-2">
              <span>{candidate.email}</span> &bull; <span>{candidate.phone}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-center min-w-[100px] backdrop-blur-xs">
              <div className="text-lg font-bold text-white font-['Poppins']">{totalCompleted}</div>
              <div className="text-[10px] uppercase font-semibold text-blue-100 tracking-wider">Tests Taken</div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-center min-w-[100px] backdrop-blur-xs">
              <div className="text-lg font-bold text-white font-['Poppins']">{avgScore}%</div>
              <div className="text-[10px] uppercase font-semibold text-blue-100 tracking-wider">Avg Accuracy</div>
            </div>
            <button
              id="candidate-dash-logout-btn"
              onClick={onLogout}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enter Test Code Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 font-['Poppins'] flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <span>Launch Exam by Code</span>
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Enter the unique test code provided by your administrator or institution.
          </p>

          <form onSubmit={handleLaunch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                id="candidate-test-code-input"
                type="text"
                value={testCodeInput}
                onChange={(e) => setTestCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. ATH-GK101"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <button
              id="candidate-start-test-btn"
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {errorMessage && (
            <div className="mt-3 text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Available Tests to Take */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">
              Published Assessments Catalog
            </h3>
            <p className="text-xs text-slate-500">
              Browse current available exams and start whenever you are ready.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const totalQ = test.levels.reduce((acc, lvl) => acc + lvl.questions.length, 0);
            return (
              <div
                key={test.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                      {test.code}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 font-['Poppins'] mb-1.5">
                    {test.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {test.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      {test.levels.length} Level{test.levels.length === 1 ? '' : 's'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {test.duration} mins
                    </span>
                    <span>{totalQ} Questions</span>
                  </div>

                  <button
                    onClick={() => onStartExamByCode(test.code)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Launch Test ({test.code})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Attempts History */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Poppins'] flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Past Examination Records</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Review your previous performance, detailed question breakdowns, and official certificates.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {candidateAttempts.length} Record{candidateAttempts.length === 1 ? '' : 's'}
          </span>
        </div>

        {candidateAttempts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-700 font-medium">No attempts recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Launch one of the available tests above to earn your first certified score report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Name</th>
                  <th className="py-3 px-4">Test Code</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Date Completed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {candidateAttempts.map((attempt) => {
                  const isPassed = attempt.percentage >= 60;
                  const dateStr = new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">{attempt.testTitle}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{attempt.testCode}</td>
                      <td className="py-3.5 px-4">
                        {attempt.score} / {attempt.totalQuestions}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {attempt.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{dateStr}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewAttemptResult(attempt)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer font-semibold text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Scorecard</span>
                          </button>
                          {onDeleteAttempt && (
                            <button
                              type="button"
                              onClick={() => setAttemptToDelete(attempt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer font-semibold text-xs"
                              title="Delete this attempt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Attempt Modal */}
      {attemptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Delete Test Record?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to delete your test record for <span className="font-semibold text-slate-900">{attemptToDelete.testTitle}</span> ({attemptToDelete.testCode})?
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will remove the score of {attemptToDelete.percentage}% from your history.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAttemptToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAttempt && attemptToDelete) {
                    onDeleteAttempt(attemptToDelete.id);
                  }
                  setAttemptToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
