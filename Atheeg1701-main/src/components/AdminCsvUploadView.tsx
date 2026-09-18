import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  HelpCircle,
  Check,
  Copy,
  FileText,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { Test } from '../types';
import { convertCSVToQuiz, getSampleQuizCSV, CSVParseResult } from '../utils/csvQuizParser';
import { saveTest } from '../utils/storage';

interface AdminCsvUploadViewProps {
  onSuccess: (newTest: Test) => void;
  onNavigateToTests?: () => void;
}

export const AdminCsvUploadView: React.FC<AdminCsvUploadViewProps> = ({
  onSuccess,
  onNavigateToTests
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);

  // Editable fields for the quiz
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [quizCode, setQuizCode] = useState<string>('');
  const [quizDescription, setQuizDescription] = useState<string>('');

  // UI state for accordion preview
  const [expandedLevel, setExpandedLevel] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [publishedTest, setPublishedTest] = useState<Test | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for parsing CSV text
  const handleParse = (text: string, sourceName?: string) => {
    setCsvContent(text);
    if (sourceName) setFileName(sourceName);

    // Derive initial title from filename if applicable
    let derivedTitle = '';
    if (sourceName) {
      derivedTitle = sourceName.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
      derivedTitle = derivedTitle
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    const res = convertCSVToQuiz(text, {
      customTitle: derivedTitle || undefined
    });

    setParseResult(res);

    if (res.success && res.test) {
      setQuizTitle(res.test.title);
      setQuizCode(res.test.code);
      setQuizDescription(res.test.description);
    }
  };

  // File drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
        setParseResult({
          success: false,
          test: null,
          totalQuestions: 0,
          levelsCount: 0,
          levelNames: [],
          warnings: [],
          errors: ['Please upload a valid .csv format file.']
        });
        return;
      }
      readFile(file);
    }
  };

  // File select handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParse(text, file.name);
    };
    reader.readAsText(file);
  };

  // Download template
  const handleDownloadTemplate = () => {
    const templateContent = getSampleQuizCSV();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'atheeg_quiz_level_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load sample data directly into preview
  const handleLoadSampleData = () => {
    const sample = getSampleQuizCSV();
    handleParse(sample, 'tech_assessment_3levels.csv');
  };

  // Clear data
  const handleReset = () => {
    setCsvContent('');
    setFileName('');
    setParseResult(null);
    setPublishedTest(null);
    setQuizTitle('');
    setQuizCode('');
    setQuizDescription('');
  };

  // Save the parsed quiz
  const handleSaveQuiz = () => {
    if (!parseResult || !parseResult.test) return;

    const finalTest: Test = {
      ...parseResult.test,
      title: quizTitle.trim() || parseResult.test.title,
      code: quizCode.trim().toUpperCase() || parseResult.test.code,
      description: quizDescription.trim() || parseResult.test.description
    };

    saveTest(finalTest);
    setPublishedTest(finalTest);
    onSuccess(finalTest);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Question Bank Ingestion</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Poppins'] flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Upload CSV to Quiz by Level</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Upload any questions spreadsheet with columns for Level/Tier, Question, Options A-D, Answer, and Explanation.
            The engine parses and automatically builds dynamic multi-tier levels with calculated timers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleLoadSampleData}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo 3-Level CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* Success Banner if published */}
      {publishedTest && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900">Quiz Successfully Created &amp; Published!</h3>
              <p className="text-xs text-slate-700 mt-1">
                Assessment <strong className="text-slate-900">"{publishedTest.title}"</strong> is now live with{' '}
                <span className="text-emerald-700 font-semibold">{publishedTest.levels.length} levels</span> and{' '}
                <span className="text-emerald-700 font-semibold">
                  {publishedTest.levels.reduce((acc, lvl) => acc + lvl.questions.length, 0)} total questions
                </span>
                .
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">Exam Test Code:</span>
                  <span className="font-mono text-sm font-bold text-blue-600">{publishedTest.code}</span>
                  <button
                    onClick={() => handleCopyCode(publishedTest.code)}
                    className="ml-1 p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Copy Test Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {onNavigateToTests && (
                  <button
                    onClick={onNavigateToTests}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>View in Assessment Test Suites</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Upload Another CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Controls on Left, Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Dropzone & CSV Paste (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-['Poppins'] flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>CSV Input Source</span>
              </h3>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    inputMode === 'paste'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste CSV Text
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                      : fileName
                      ? 'border-blue-300 bg-blue-50/50 hover:border-blue-400'
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  {fileName ? (
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>{fileName}</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Loaded and parsed! Click to choose a different file.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Drag and drop your <span className="text-blue-600 font-bold">.CSV</span> file here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">or click to browse from your device</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Supports comma-separated and quoted fields</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={csvContent}
                  onChange={(e) => handleParse(e.target.value, 'pasted_quiz.csv')}
                  placeholder={`Level,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation
Beginner,What is RAM in computer hardware?,Random Access Memory,Read Access Memory,Rapid Array Memory,Run Action Module,A,RAM stands for Random Access Memory.
Intermediate,Which SQL clause filters grouped rows?,HAVING,WHERE,GROUP BY,ORDER BY,A,HAVING filters grouped aggregates.`}
                  rows={9}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-y"
                />
                <p className="text-[11px] text-slate-500">
                  Paste rows directly. First line must contain the column headers (Level, Question, Option A, Option B...).
                </p>
              </div>
            )}

            {/* Error or Warnings display */}
            {parseResult && !parseResult.success && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-bold">Failed to parse CSV:</span>
                  <p className="mt-0.5 text-[11px]">
                    {parseResult.errors.length > 0 ? parseResult.errors.join(', ') : 'Unable to parse CSV structure.'}
                  </p>
                </div>
              </div>
            )}

            {parseResult && parseResult.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                <span className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Warnings ({parseResult.warnings.length}):
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-900">
                  {parseResult.warnings.slice(0, 3).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formatting Help Guide Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Expected CSV Column Headers:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Level</code> (e.g. Beginner / Level 1),{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Question</code>,{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Option A</code>,{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Option B</code>,{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Option C</code>,{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Option D</code>,{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Correct Answer</code> (A, B, C, or D),{' '}
                <code className="text-blue-700 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">Explanation</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quiz Configuration & Level Breakdown Preview (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          {parseResult && parseResult.success && parseResult.test ? (
            <div className="space-y-5">
              {/* Assessment Configuration Form */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 font-['Poppins'] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Assessment Settings</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Configure quiz details prior to publishing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title</label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. Software Engineering Assessment"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Access Code</label>
                    <input
                      type="text"
                      value={quizCode}
                      onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ATH-SWE202"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-600 uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    rows={2}
                    placeholder="Provide a brief summary of this multi-tier exam."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Level Summary Stats Bar */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600 font-['Poppins']">
                      {parseResult.test.levels.length}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Levels Detected</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 font-['Poppins']">
                      {parseResult.test.levels.reduce((acc, lvl) => acc + lvl.questions.length, 0)}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Total Questions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-indigo-600 font-['Poppins']">
                      {parseResult.test.duration} mins
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Total Duration</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Level-Wise Questions Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-['Poppins'] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Level Breakdown &amp; Question Inspection</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Click any level to expand questions</span>
                </div>

                <div className="space-y-2.5">
                  {parseResult.test.levels.map((lvl, lvlIdx) => {
                    const isExpanded = expandedLevel === lvlIdx;
                    return (
                      <div
                        key={lvl.id}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedLevel(isExpanded ? null : lvlIdx)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                              {lvlIdx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-slate-900">{lvl.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                  {lvl.questions.length} Question{lvl.questions.length === 1 ? '' : 's'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Tier assessment stage &bull; {lvl.questions.length} multiple-choice questions &bull; {lvl.timeLimit} minutes limit
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              {lvl.timeLimit}m
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                            {lvl.questions.map((q, qIdx) => (
                              <div
                                key={q.id}
                                className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <span className="font-medium text-slate-900">
                                    <span className="font-bold text-blue-600 mr-1.5">Q{qIdx + 1}.</span>
                                    {q.text}
                                  </span>
                                  {q.difficulty && (
                                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 border border-slate-200">
                                      {q.difficulty}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  {q.options.map((opt, optIdx) => {
                                    const isCorrect = optIdx === q.correctIndex;
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 ${
                                          isCorrect
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="truncate">{opt}</span>
                                        {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />}
                                      </div>
                                    );
                                  })}
                                </div>

                                {q.explanation && (
                                  <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-100">
                                    <span className="font-semibold text-slate-700 not-italic">Explanation: </span>
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Convert & Publish Primary Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="admin-convert-and-publish-btn"
                  onClick={handleSaveQuiz}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Convert &amp; Publish Assessment Suite</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty State Prompt */
            <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-blue-500" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No CSV Loaded Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Upload a CSV spreadsheet on the left, paste raw question data, or click{' '}
                <strong className="text-blue-600">"Load Demo 3-Level CSV"</strong> above to see a live multi-tier breakdown.
              </p>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try with Sample Tech Quiz</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
