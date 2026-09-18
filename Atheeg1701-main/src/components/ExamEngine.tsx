import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Camera,
  Shield,
  Layers,
  HelpCircle,
  Video,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Test, Candidate, Attempt, LevelScore, ProctoringSnapshot, ProctoringEvent, AppSettings } from '../types';
import { saveAttempt, saveSnapshot, logProctoringEvent, getSettings } from '../utils/storage';

interface ExamEngineProps {
  test: Test;
  candidate: Candidate;
  onFinishExam: (attempt: Attempt) => void;
  onCancelExam: () => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({
  test,
  candidate,
  onFinishExam,
  onCancelExam
}) => {
  // Pre-exam consent stage
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [examStarted, setExamStarted] = useState(false);

  // Flattened question structure for navigation
  const allQuestions = test.levels.flatMap((lvl, lvlIdx) =>
    lvl.questions.map((q) => ({
      ...q,
      levelId: lvl.id,
      levelName: lvl.name,
      levelIndex: lvlIdx,
      levelTimeLimit: lvl.timeLimit
    }))
  );

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [startedAt] = useState<string>(new Date().toISOString());

  // Timer state (seconds remaining in total exam)
  const totalDurationSeconds = test.duration * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalDurationSeconds);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violationPhoto, setViolationPhoto] = useState<string | null>(null);
  const [isAutoTerminated, setIsAutoTerminated] = useState(false);

  // Attempt ID & mutable tracking refs
  const attemptIdRef = useRef<string>(`att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const violationPhotoRef = useRef<string | null>(null);
  const isTerminatedRef = useRef<boolean>(false);
  const pendingAttemptRef = useRef<Attempt | null>(null);

  // Synchronized state refs to avoid stale closures in event listeners
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const secondsRemainingRef = useRef(secondsRemaining);
  secondsRemainingRef.current = secondsRemaining;

  // Proctoring references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentQ = allQuestions[currentQIndex] || allQuestions[0];
  const settings: AppSettings = getSettings();

  // Stop media tracks cleanup helper
  const stopAllMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
  };

  // Instant snapshot capture helper (returns data URL)
  const captureSnapshotNow = (reason: string = 'periodic'): string => {
    let imageData = '';
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
          imageData = canvas.toDataURL('image/jpeg', 0.65);
        }
      }
    } catch (err) {
      console.warn('Error capturing canvas snapshot', err);
    }

    if (!imageData) {
      const timeStr = new Date().toLocaleTimeString();
      imageData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="%231e1b4b"/><circle cx="160" cy="100" r="45" fill="%23e11d48" opacity="0.3"/><text x="160" y="100" fill="%23fb7185" font-size="15" font-family="sans-serif" font-weight="bold" text-anchor="middle">INTEGRITY CAPTURE</text><text x="160" y="125" fill="%23cbd5e1" font-size="11" font-family="sans-serif" text-anchor="middle">TAB SWITCH AT ${timeStr}</text></svg>`;
    }

    const snap: ProctoringSnapshot = {
      attemptId: attemptIdRef.current,
      timestamp: new Date().toISOString(),
      imageData,
      reason
    };
    saveSnapshot(snap);
    return imageData;
  };

  // 1. Consent and Camera initialization
  const handleGrantConsentAndStart = async () => {
    setConsentError('');
    if (settings.proctoringEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: true
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Media devices request notice:', err);
        // If camera/mic is blocked or unavailable in iframe, still allow candidate with notice
        setConsentError('Camera/Microphone access not granted or unavailable. Proctoring telemetry will run in simulated audit mode.');
      }
    }

    setConsentGranted(true);
    setExamStarted(true);
  };

  // 2. Setup video stream on element once consent granted
  useEffect(() => {
    if (consentGranted && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [consentGranted]);

  // 3. Periodic 30-second Proctoring Snapshot capture
  useEffect(() => {
    if (!examStarted) return;

    // Initial capture
    captureSnapshotNow('Initial Verification Frame');

    // Every 30 seconds
    snapshotIntervalRef.current = setInterval(() => {
      if (!isTerminatedRef.current) {
        captureSnapshotNow('periodic');
      }
    }, 30000);

    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    };
  }, [examStarted]);

  // 4. Tab-switch & window blur tracking: Instant violation photo & automatic ending
  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isTerminatedRef.current) return;

        // Immediately capture photo at the exact moment of tab departure
        const photo = captureSnapshotNow('Tab Switch Violation (Auto-Ended)');
        violationPhotoRef.current = photo;
        setViolationPhoto(photo);

        setTabSwitchCount((prev) => prev + 1);

        const shouldAutoEnd = settings.autoEndOnTabSwitch !== false;

        const event: ProctoringEvent = {
          attemptId: attemptIdRef.current,
          type: 'tab_switch',
          timestamp: new Date().toISOString(),
          details: shouldAutoEnd
            ? 'Candidate switched browser tab or minimized window. Violation photo captured. Exam automatically terminated.'
            : 'Candidate switched browser tab or minimized window. Violation photo captured.',
          snapshotData: photo
        };
        logProctoringEvent(event);

        if (shouldAutoEnd) {
          isTerminatedRef.current = true;
          setIsAutoTerminated(true);

          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
          stopAllMediaTracks();

          // Construct and immediately persist disqualified attempt with evidentiary snapshot
          const disqualifiedAttempt = handleFinalSubmit(
            'Disqualified',
            {
              violationSnapshot: photo,
              terminationReason: 'Exam automatically ended due to unauthorized tab switch.'
            },
            false
          );
          pendingAttemptRef.current = disqualifiedAttempt;
        } else {
          setTabSwitchAlert(true);
        }
      }
    };

    const handleWindowBlur = () => {
      if (isTerminatedRef.current) return;
      const event: ProctoringEvent = {
        attemptId: attemptIdRef.current,
        type: 'window_blur',
        timestamp: new Date().toISOString(),
        details: 'Candidate window lost focus'
      };
      logProctoringEvent(event);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [examStarted]);

  // 5. Timer loop
  useEffect(() => {
    if (!examStarted) return;

    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleFinalSubmit('Timed Out');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [examStarted]);

  // 6. Cleanup media tracks on unmount / beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAllMediaTracks();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopAllMediaTracks();
    };
  }, []);

  // Answer selection handler
  const handleSelectOption = (optionIndex: number) => {
    if (isTerminatedRef.current) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  // Toggle mark for review
  const handleToggleReview = () => {
    if (isTerminatedRef.current) return;
    setMarkedForReview((prev) => {
      if (prev.includes(currentQ.id)) {
        return prev.filter((id) => id !== currentQ.id);
      } else {
        return [...prev, currentQ.id];
      }
    });
  };

  // Final Submit calculation & persistence
  const handleFinalSubmit = (
    statusOverride?: 'Completed' | 'Timed Out' | 'Disqualified',
    options?: { violationSnapshot?: string; terminationReason?: string },
    triggerCallback: boolean = true
  ): Attempt => {
    stopAllMediaTracks();

    const currentAnswers = answersRef.current;
    const currentSeconds = secondsRemainingRef.current;

    // Calculate score & level breakdowns
    let totalScore = 0;
    const levelScores: LevelScore[] = test.levels.map((lvl) => {
      let lvlCorrect = 0;
      lvl.questions.forEach((q) => {
        const candidateAns = currentAnswers[q.id];
        if (candidateAns !== undefined && candidateAns === q.correctIndex) {
          lvlCorrect += 1;
          totalScore += 1;
        }
      });
      return {
        levelId: lvl.id,
        levelName: lvl.name,
        totalQuestions: lvl.questions.length,
        correctAnswers: lvlCorrect,
        score: lvlCorrect
      };
    });

    const totalQuestions = allQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const timeTaken = totalDurationSeconds - currentSeconds;

    const attempt: Attempt = {
      id: attemptIdRef.current,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      testId: test.id,
      testCode: test.code,
      testTitle: test.title,
      startedAt,
      submittedAt: new Date().toISOString(),
      answers: currentAnswers,
      markedForReview,
      score: totalScore,
      totalQuestions,
      percentage,
      levelScores,
      timeTaken: Math.max(timeTaken, 1),
      status: statusOverride || 'Completed',
      proctoringEventsCount: tabSwitchCount + (statusOverride === 'Disqualified' ? 1 : 0),
      violationSnapshot: options?.violationSnapshot || violationPhotoRef.current || undefined,
      terminationReason: options?.terminationReason || undefined
    };

    // Save to localStorage
    saveAttempt(attempt);

    // Call callback if requested
    if (triggerCallback) {
      onFinishExam(attempt);
    }
    return attempt;
  };

  // Handler for proceeding after auto-termination
  const handleProceedAfterTermination = () => {
    if (pendingAttemptRef.current) {
      onFinishExam(pendingAttemptRef.current);
    } else {
      handleFinalSubmit('Disqualified', {
        violationSnapshot: violationPhotoRef.current || undefined,
        terminationReason: 'Exam automatically ended due to unauthorized tab switch.'
      }, true);
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Count metrics for summary
  const answeredCount = Object.values(answers).filter((v) => v !== undefined && v !== null).length;
  const markedCount = markedForReview.length;
  const unansweredCount = allQuestions.length - answeredCount;

  // Render PRE-EXAM CONSENT MODAL
  if (!examStarted) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12 relative bg-slate-50">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-900">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-6">
            <Shield className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 font-['Poppins']">
            Pre-Exam Instructions &amp; Proctoring Consent
          </h2>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
            <p className="text-slate-900 font-semibold text-sm mb-1">{test.title} ({test.code})</p>
            <div className="flex items-center justify-between text-slate-600 pt-1">
              <span>Total Duration: <strong className="text-slate-900">{test.duration} Minutes</strong></span>
              <span>Total Questions: <strong className="text-slate-900">{allQuestions.length} Questions</strong></span>
              <span>Levels: <strong className="text-slate-900">{test.levels.length} Stages</strong></span>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Questions are grouped into timed levels. You can navigate between questions within the active level.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Use <strong>Mark for Review</strong> to flag questions you want to re-examine before final submission.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-rose-900">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Strict Security: Automatic Photo Capture &amp; Tab-Switch Termination</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Navigating away from this tab, opening other applications, or minimizing the window will <strong>instantly take a camera photo</strong> and <strong>automatically terminate your exam immediately</strong> with Disqualified status. Keep this screen in focus at all times.
              </p>
            </div>
          </div>

          {consentError && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              {consentError}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onCancelExam}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel &amp; Return
            </button>
            <button
              id="exam-consent-agree-btn"
              onClick={handleGrantConsentAndStart}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>I Agree &amp; Begin Test</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM INTERFACE
  const isTimeCritical = secondsRemaining <= 120; // 2 minutes or less

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Hidden canvas for capturing proctoring snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Tab switch warning banner */}
      {tabSwitchAlert && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-rose-700 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
            <span>
              Warning: Tab switch / loss of focus detected ({tabSwitchCount} time{tabSwitchCount > 1 ? 's' : ''}). This incident is logged in the proctoring audit log.
            </span>
          </div>
          <button
            onClick={() => setTabSwitchAlert(false)}
            className="px-2.5 py-0.5 rounded bg-black/20 hover:bg-black/30 text-white text-[11px] cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Exam Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="font-bold text-white text-sm font-['Poppins']">A</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 font-['Poppins']">{test.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {test.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {currentQ.levelName} &bull; Question {currentQIndex + 1} of {allQuestions.length}
              </p>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Anti-cheat tab monitor badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Strict Tab Monitoring</span>
            </div>

            {/* Timer countdown */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
                isTimeCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-blue-50/70 text-blue-700 border-blue-200'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Finish & Submit Trigger */}
            <button
              id="exam-finish-submit-btn"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Finish Exam</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / allQuestions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content Area: Question + Sidebar Palette */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Proctoring Live Webcam Box - Always visible top-right (160x120) */}
        <div className="lg:col-span-12 flex justify-end">
          <div className="flex items-center gap-3 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <div className="relative w-36 h-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
              {/* If no stream, show avatar placeholder */}
              {!streamRef.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-[10px] text-slate-300 p-1 text-center">
                  <Video className="w-4 h-4 text-blue-400 mb-1" />
                  <span>Audit Stream Active</span>
                </div>
              )}
              {/* Blinking Red REC Badge */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-rose-500/30 flex items-center gap-1 text-[9px] font-bold text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>REC</span>
              </div>
            </div>
            <div className="text-left pr-2 text-[11px] text-slate-600">
              <div className="font-semibold text-slate-900">Live Proctoring</div>
              <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Monitoring 30s Snapshots</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Candidate: <span className="text-slate-800 font-semibold">{candidate.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Active Question Container */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm min-h-[460px]">
          <div>
            {/* Question Header Meta */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs font-mono">
                  Q{currentQIndex + 1}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentQ.levelName}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  currentQ.difficulty === 'Easy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentQ.difficulty === 'Medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {currentQ.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-6">
              {currentQ.text}
            </h3>

            {/* 4 Options as clickable cards */}
            <div className="space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm ring-1 ring-blue-600'
                        : 'bg-slate-50 hover:bg-blue-50/40 border-slate-200 text-slate-800 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="flex-1 leading-snug">{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation and Review Controls */}
          <div className="pt-8 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReview}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  markedForReview.includes(currentQ.id)
                    ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {markedForReview.includes(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(prev - 1, 0))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentQIndex < allQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex((prev) => Math.min(prev + 1, allQuestions.length - 1))}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>Review &amp; Submit</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-['Poppins'] mb-3 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs text-slate-500 font-normal">
                {answeredCount}/{allQuestions.length} answered
              </span>
            </h4>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 mb-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-purple-600" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-200 border border-slate-300" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md border-2 border-blue-600 bg-blue-50" />
                <span>Current</span>
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {allQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                const isMarked = markedForReview.includes(q.id);
                const isCurrent = idx === currentQIndex;

                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isMarked) {
                  colorClasses = 'bg-purple-600 text-white border-purple-600';
                } else if (isAnswered) {
                  colorClasses = 'bg-emerald-600 text-white border-emerald-600';
                }

                if (isCurrent) {
                  colorClasses += ' ring-2 ring-blue-600 ring-offset-2 ring-offset-white font-extrabold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${colorClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Summary Footer in Sidebar */}
          <div className="pt-4 border-t border-slate-100 mt-6 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Answered:</span>
              <span className="text-emerald-700 font-bold">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Marked for Review:</span>
              <span className="text-purple-700 font-bold">{markedCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Remaining Unanswered:</span>
              <span className="text-slate-600 font-bold">{unansweredCount}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Submission Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in text-slate-900">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 font-['Poppins']">
              Submit Assessment?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Once submitted, your responses will be evaluated and your official scorecard generated.
            </p>

            <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="text-slate-900 font-bold">{allQuestions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Answered Questions:</span>
                <span className="text-emerald-700 font-bold">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Marked for Review:</span>
                <span className="text-purple-700 font-bold">{markedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Unanswered Questions:</span>
                <span className="text-rose-700 font-bold">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                Continue Test
              </button>
              <button
                id="exam-confirm-final-submit-btn"
                type="button"
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  handleFinalSubmit('Completed');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                Confirm &amp; Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Automatic Ending Due to Tab Switch Modal */}
      {isAutoTerminated && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 sm:p-7 text-center space-y-4 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200 shadow-xs">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                Violation Detected &bull; Automatic Ending
              </span>
              <h3 className="text-xl font-black text-slate-900 font-['Poppins'] mt-2">
                Exam Session Terminated
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                You switched browser tabs or minimized the active exam window. The proctoring system captured your photo and automatically ended your exam.
              </p>
            </div>

            {/* Captured Photo Card */}
            {violationPhoto && (
              <div className="p-3 bg-slate-50 rounded-xl border border-rose-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-rose-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>Captured Violation Snapshot</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-200 shadow-sm">
                  <img
                    src={violationPhoto}
                    alt="Tab switch violation snapshot"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-mono font-bold tracking-wider shadow">
                    FLAGGED EVIDENCE
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-snug">
                  This snapshot has been attached to your evaluation record and logged in the administrator proctoring audit trail.
                </p>
              </div>
            )}

            <button
              id="exam-violation-proceed-btn"
              onClick={handleProceedAfterTermination}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Disqualification &amp; Results</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
