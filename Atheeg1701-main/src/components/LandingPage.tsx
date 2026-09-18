import React, { useState } from 'react';
import {
  ArrowRight,
  Shield,
  Clock,
  Award,
  Video,
  Layers,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Check,
  Eye,
  FileText,
  Lock,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Users
} from 'lucide-react';
import { Test } from '../types';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  availableTests: Test[];
  onStartExamByCode: (code: string) => void;
  isCandidateLoggedIn: boolean;
  isAdminLoggedIn: boolean;
  onOpenCsvUpload?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  availableTests,
  onStartExamByCode,
  isCandidateLoggedIn,
  isAdminLoggedIn
}) => {
  const [testCodeInput, setTestCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleQuickLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    if (!testCodeInput.trim()) {
      setCodeError('Please enter a test code (e.g. ATH-GK101)');
      return;
    }
    onStartExamByCode(testCodeInput.trim());
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden selection:bg-blue-600 selection:text-white bg-slate-50 text-slate-800">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-200/50 via-sky-100/30 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[400px] -right-[250px] w-[550px] h-[550px] bg-blue-100/40 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[1000px] -left-[200px] w-[500px] h-[500px] bg-indigo-100/40 blur-[150px] pointer-events-none -z-10" />

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 mb-8 shadow-sm hover:border-blue-400 transition-colors">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-semibold text-blue-800">
            Enterprise Assessment &amp; Smart Proctoring Suite
          </span>
        </div>

        {/* Hero Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 font-['Poppins'] max-w-4xl mx-auto leading-[1.15]">
          Evaluate with Precision.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
            Certify with Confidence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          The high-integrity online examination platform built for modern engineering academies, universities, and enterprise hiring. Multi-level timed progression, live webcam proctoring, and instant verifiable PDF certificates.
        </p>

        {/* Action Group: Primary CTA + Quick Code Portal */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {isCandidateLoggedIn ? (
            <button
              id="landing-hero-candidate-dashboard-btn"
              onClick={() => onNavigate('candidate-dashboard')}
              className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Go to Candidate Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="landing-hero-get-started-btn"
              onClick={() => onNavigate('candidate-auth')}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => scrollToSection('assessments')}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span>Explore Assessments</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Quick Launch Test Code Card */}
        <div className="mt-12 max-w-lg mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-blue-900/5 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Have an Exam Access Code?</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Direct Entry</span>
            </div>

            <form
              onSubmit={handleQuickLaunch}
              className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
            >
              <input
                id="landing-test-code-input"
                type="text"
                value={testCodeInput}
                onChange={(e) => setTestCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER TEST CODE (e.g. ATH-GK101)"
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none px-3 uppercase font-mono tracking-wider font-semibold"
              />
              <button
                id="landing-quick-start-btn"
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Take Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {codeError && (
              <p className="text-xs text-rose-600 font-medium text-left px-1">{codeError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 px-1 border-t border-slate-100">
              <span>Sample Test Codes:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTestCodeInput('ATH-GK101');
                    onStartExamByCode('ATH-GK101');
                  }}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 font-mono text-blue-700 text-[11px] font-semibold border border-blue-200 cursor-pointer transition-colors"
                >
                  ATH-GK101
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestCodeInput('ATH-SWE202');
                    onStartExamByCode('ATH-SWE202');
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 font-mono text-indigo-700 text-[11px] font-semibold border border-indigo-200 cursor-pointer transition-colors"
                >
                  ATH-SWE202
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TRUST & METRICS BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-y border-slate-200 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Poppins']">100%</div>
            <div className="text-xs text-slate-500 font-medium">Client-Side Privacy</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-['Poppins']">Multi-Tier</div>
            <div className="text-xs text-slate-500 font-medium">Timed Stage Gating</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 font-['Poppins']">Active REC</div>
            <div className="text-xs text-slate-500 font-medium">Consent Smart Proctoring</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-['Poppins']">Instant PDF</div>
            <div className="text-xs text-slate-500 font-medium">Verifiable Certificates</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          HOW IT WORKS (3-STEP TIMELINE)
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seamless Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-['Poppins']">
            How Atheeg Test Operates
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            From seamless onboarding to verifiable certification, experience an uninterrupted examination lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm relative space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold font-['Poppins'] text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Register &amp; Verify</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Candidates sign up or enter a test code. A transparent hardware handshake ensures webcam readiness and sets clear integrity parameters before entering.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-blue-700 font-medium">
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant camera permission check</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm relative space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-extrabold font-['Poppins'] text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Timed Multi-Level Exam</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Navigate structured difficulty tiers (Beginner, Intermediate, Advanced) with individual countdown timers, question flagging, and automated anti-blur tracking.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-sky-700 font-medium">
              <Check className="w-3.5 h-3.5 text-sky-600" />
              <span>Independent stage time limits</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm relative space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-extrabold font-['Poppins'] text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-['Poppins']">Instant Results &amp; PDF</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive immediate performance scoring with circular percentage rings, question-level explanations, and download an official signed PDF credential.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>One-click PDF certification</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CORE FEATURES (BENTO GRID)
      ───────────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture &amp; Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-['Poppins']">
            Engineered for Modern Assessment
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            A comprehensive toolset providing both candidates and administrators with precision, fairness, and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Timed Multi-Level Tiers</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Exams break into autonomous stages with specific durations. Once a section timer expires, the exam automatically finalizes and transitions to the subsequent tier.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Smart Consent Proctoring</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Candidate opt-in camera feed with live recording indicators, periodic 30-second snapshot audit trails, and window blur and fullscreen exit tracking.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Official PDF Certification</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Automated client-side PDF credential compilation complete with performance percentages, level breakdown scores, and unique verification tokens.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Full Administrative Suite</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Complete administrator dashboard to author assessments, review candidate logs, audit webcam verification snapshots, and export attempt rosters.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Granular Review Rationale</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Detailed explanations and question rationale provide actionable learning feedback immediately upon test completion.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Poppins']">Zero Data-Loss Engine</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              State-preserved local storage persistence prevents accidental tab closures or connection hiccups from terminating candidate exam attempts prematurely.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          INTEGRITY & PROCTORING SPOTLIGHT
      ───────────────────────────────────────────────────────────── */}
      <section id="integrity" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-50 via-white to-sky-50 border border-blue-200/80 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-800 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span>Anti-Cheat Assurance</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Poppins'] leading-snug">
                Transparent Proctoring Without Invasive Software
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Atheeg Test operates entirely within standard modern web browsers. Candidates grant explicit camera permissions with full visibility into their active feed, while administrators receive verified audit snapshots and blur timestamps.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-slate-700">
                    Explicit camera consent required before test launch with live &quot;REC&quot; status
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-slate-700">
                    Automatic snapshot capture every 30 seconds for non-intrusive identity audits
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-slate-700">
                    Immediate warning prompts upon browser tab switching or loss of window focus
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Visual Graphic */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-emerald-600">REC 00:24:18</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Session ID: #ATH-8841</span>
              </div>

              <div className="aspect-video rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 mb-2">
                  <Video className="w-8 h-8" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Live Camera Verification Active</span>
                <span className="text-[10px] text-slate-400 mt-1">Periodic snapshot audit in progress</span>
                <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-1 rounded bg-black/70 text-[10px] text-slate-200 border border-white/10">
                  <Eye className="w-3 h-3 text-sky-400" />
                  <span>Face In Frame: Verified</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Tab Focus: Protected</span>
                <span className="text-emerald-600 font-semibold">0 Integrity Violations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          AVAILABLE ASSESSMENTS CATALOG
      ───────────────────────────────────────────────────────────── */}
      <section id="assessments" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Poppins'] flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-blue-600" />
              <span>Active Assessment Suites</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1.5">
              Select any assessment suite to review stages and start an evaluation session.
            </p>
          </div>
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {availableTests.length} Published Assessment{availableTests.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTests.map((t) => {
            const totalQuestions = t.levels.reduce((acc, lvl) => acc + lvl.questions.length, 0);
            return (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                      {t.code}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-['Poppins'] mb-2">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {t.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4 font-medium">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      {t.levels.length} Level{t.levels.length === 1 ? '' : 's'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {t.duration} Mins
                    </span>
                    <span>{totalQuestions} Qs</span>
                  </div>

                  <button
                    onClick={() => onStartExamByCode(t.code)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    <span>Start Test ({t.code})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM "GET STARTED" CALL-TO-ACTION BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Ready for Certified Evaluations?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Poppins'] max-w-2xl mx-auto leading-tight">
            Start Your Assessment Journey Today
          </h2>

          <p className="text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Join candidates and educators taking certified, multi-level exams with transparent proctoring and instantaneous results.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('candidate-auth')}
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-bold text-sm shadow-xl flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('admin-login')}
              className="px-6 py-3.5 rounded-xl bg-blue-800/60 hover:bg-blue-800/80 text-white font-semibold text-sm border border-white/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Shield className="w-4 h-4 text-blue-200" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 text-center sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-4 sm:mb-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            A
          </div>
          <span className="text-sm font-semibold text-slate-800 font-['Poppins']">
            Atheeg Test Assessment Suite
          </span>
        </div>
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Atheeg Test. Built with precision for educational and organizational integrity.
        </p>
      </footer>
    </div>
  );
};
