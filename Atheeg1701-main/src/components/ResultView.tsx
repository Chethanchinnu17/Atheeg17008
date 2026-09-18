import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Printer,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { Attempt, Test } from '../types';
import { generateCandidateResultPDF } from '../utils/pdfGenerator';

interface ResultViewProps {
  attempt: Attempt;
  test?: Test | null;
  onBackToDashboard: () => void;
  onRetakeTest?: (code: string) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  attempt,
  test,
  onBackToDashboard,
  onRetakeTest
}) => {
  const isPassed = attempt.percentage >= 60;

  // Trigger celebration confetti if passed
  useEffect(() => {
    if (isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if canvas not supported
      }
    }
  }, [isPassed]);

  // Answer counters
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  // Flatten questions from test if available
  const questionsList = test
    ? test.levels.flatMap((lvl) =>
        lvl.questions.map((q) => ({ ...q, levelName: lvl.name }))
      )
    : [];

  questionsList.forEach((q) => {
    const candidateAns = attempt.answers[q.id];
    if (candidateAns === undefined || candidateAns === null) {
      skippedCount += 1;
    } else if (candidateAns === q.correctIndex) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
  });

  const minutes = Math.floor(attempt.timeTaken / 60);
  const seconds = attempt.timeTaken % 60;

  const handleDownloadPDF = () => {
    generateCandidateResultPDF(attempt, test);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            id="result-download-pdf-btn"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Certificate PDF</span>
          </button>
        </div>
      </div>

      {/* Violation Alert Banner if Disqualified or Terminated */}
      {(attempt.status === 'Disqualified' || attempt.violationSnapshot) && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-rose-200/70 text-rose-800 font-bold border border-rose-300">
                    DISQUALIFIED
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">Academic Integrity Violation</span>
                </div>
                <p className="text-xs text-rose-700 mt-1">
                  {attempt.terminationReason || 'This exam was automatically terminated due to unauthorized tab switching or focus loss.'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-mono text-rose-700 block font-semibold">
                {attempt.proctoringEventsCount} Flagged Event{attempt.proctoringEventsCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {attempt.violationSnapshot && (
            <div className="pt-4 border-t border-rose-200 flex flex-col sm:flex-row items-start gap-4">
              <div className="relative w-44 sm:w-52 aspect-video rounded-xl overflow-hidden border border-rose-300 bg-black shrink-0 shadow-md">
                <img
                  src={attempt.violationSnapshot}
                  alt="Evidentiary tab switch capture"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-rose-600 text-[9px] font-mono font-bold text-white shadow">
                  TAB SWITCH CAPTURE
                </span>
              </div>
              <div className="text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>Evidentiary Webcam Photo Captured</span>
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The candidate attempted to navigate away from the test window. This high-resolution evidentiary frame was automatically captured at that moment and permanently attached to the audit record.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Scorecard Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          {/* Animated Circular Score Ring */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="text-slate-100"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Progress Value Stroke */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className={`${
                    isPassed ? 'text-blue-600' : 'text-rose-500'
                  } transition-all duration-1000 ease-out`}
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={
                    2 * Math.PI * 52 - (2 * Math.PI * 52 * attempt.percentage) / 100
                  }
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-['Poppins']">
                  {attempt.percentage}%
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                  Accuracy
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isPassed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isPassed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PASSED &bull; CERTIFIED</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>NEEDS IMPROVEMENT</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Assessment Overview Stats */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-blue-600 mb-1">
                <span>TEST CODE: {attempt.testCode}</span>
                <span>&bull;</span>
                <span className="text-slate-500">{attempt.status}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Poppins']">
                {attempt.testTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Candidate: <strong className="text-slate-800">{attempt.candidateName}</strong> ({attempt.candidateEmail})
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xl font-bold text-slate-900 font-['Poppins']">
                  {attempt.score}/{attempt.totalQuestions}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Final Score</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xl font-bold text-emerald-600 font-['Poppins']">
                  {correctCount}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Correct</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xl font-bold text-rose-600 font-['Poppins']">
                  {wrongCount}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Incorrect</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xl font-bold text-blue-600 font-['Poppins']">
                  {minutes}m {seconds}s
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Time Spent</div>
              </div>
            </div>

            {/* Retake CTA if available */}
            {onRetakeTest && (
              <div className="pt-2">
                <button
                  onClick={() => onRetakeTest(attempt.testCode)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Retake This Assessment</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level-wise Breakdown */}
      {attempt.levelScores && attempt.levelScores.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 font-['Poppins'] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Level-wise Performance Breakdown</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Level Stage</th>
                  <th className="py-3 px-4">Total Questions</th>
                  <th className="py-3 px-4">Correct Answers</th>
                  <th className="py-3 px-4">Level Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attempt.levelScores.map((lvl) => {
                  const pct = Math.round((lvl.correctAnswers / (lvl.totalQuestions || 1)) * 100);
                  return (
                    <tr key={lvl.levelId}>
                      <td className="py-3 px-4 text-slate-900 font-semibold">{lvl.levelName}</td>
                      <td className="py-3 px-4 text-slate-600">{lvl.totalQuestions}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{lvl.correctAnswers}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 font-bold text-slate-800">{pct}%</span>
                          <div className="flex-1 max-w-[140px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question-by-Question Review with Explanations */}
      {questionsList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins']">
                Comprehensive Question Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your answers, correct solutions, and rationales for each prompt.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {questionsList.length} Questions
            </span>
          </div>

          <div className="space-y-6">
            {questionsList.map((q, idx) => {
              const candidateAns = attempt.answers[q.id];
              const isAnswered = candidateAns !== undefined && candidateAns !== null;
              const isCorrect = isAnswered && candidateAns === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-bold">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs text-slate-500">{q.levelName}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isAnswered
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-200/80 text-slate-600 border-slate-300'
                      }`}
                    >
                      {isCorrect ? 'Correct' : isAnswered ? 'Incorrect' : 'Skipped'}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.text}
                  </h4>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const wasSelected = candidateAns === optIdx;
                      const isOptionCorrect = optIdx === q.correctIndex;
                      const letter = String.fromCharCode(65 + optIdx);

                      let borderClass = 'border-slate-200 bg-white text-slate-700';
                      if (isOptionCorrect) {
                        borderClass = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (wasSelected && !isOptionCorrect) {
                        borderClass = 'border-rose-300 bg-rose-50 text-rose-900 line-through';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 ${borderClass}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {letter}
                          </span>
                          <span className="flex-1 leading-tight">{opt}</span>
                          {isOptionCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {wasSelected && !isOptionCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700">
                      <span className="font-semibold text-blue-800 block mb-1">
                        Explanation:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
