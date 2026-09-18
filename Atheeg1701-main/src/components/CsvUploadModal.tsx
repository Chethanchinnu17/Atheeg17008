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
  X,
  FileText
} from 'lucide-react';
import { Test } from '../types';
import { convertCSVToQuiz, getSampleQuizCSV, CSVParseResult } from '../utils/csvQuizParser';
import { saveTest } from '../utils/storage';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTest: Test) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
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

  if (!isOpen) return null;

  // Handler for parsing CSV text
  const handleParse = (text: string, sourceName?: string) => {
    setCsvContent(text);
    if (sourceName) setFileName(sourceName);

    // Derive initial title from filename if applicable
    let derivedTitle = '';
    if (sourceName) {
      derivedTitle = sourceName.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
      // Capitalize words
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
    handleParse(sample, 'sample_tech_assessment.csv');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins']">
                CSV to Quiz Converter by Level
              </h3>
              <p className="text-xs text-slate-500">
                Upload a CSV spreadsheet to automatically generate multi-level timed assessments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          {/* Success Banner if published */}
          {publishedTest ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Quiz Successfully Created & Published!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  "{publishedTest.title}" has been structured into{' '}
                  <span className="text-emerald-700 font-bold">{publishedTest.levels.length} levels</span> with{' '}
                  <span className="text-emerald-700 font-bold">
                    {publishedTest.levels.reduce((acc, lvl) => acc + lvl.questions.length, 0)} questions
                  </span>
                  .
                </p>
              </div>

              <div className="inline-flex items-center gap-3 p-3 rounded-xl bg-white border border-emerald-200 shadow-sm">
                <span className="text-xs text-slate-500">Test Code:</span>
                <span className="font-mono text-sm font-bold text-blue-600">{publishedTest.code}</span>
                <button
                  onClick={() => handleCopyCode(publishedTest.code)}
                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  Done & View in Tests
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Action Bar: Upload File vs Paste Text, and Template Download */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'paste' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Paste Raw CSV
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download CSV Template</span>
                  </button>
                  <button
                    onClick={handleLoadSampleData}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Load Demo 3-Level CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone Tab */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {fileName ? (
                      <span className="text-blue-600 font-mono">{fileName}</span>
                    ) : (
                      'Click to browse or drop your CSV file here'
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Atheeg automatically scans rows, groups questions by the <span className="text-blue-600 font-semibold">Level</span> column (e.g. Level 1, Level 2), and creates corresponding timed test sections.
                  </p>
                </div>
              )}

              {/* Paste Raw CSV Tab */}
              {activeTab === 'paste' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Paste CSV Data (Including Header Row):
                  </label>
                  <textarea
                    rows={6}
                    value={csvContent}
                    onChange={(e) => handleParse(e.target.value, 'pasted_data.csv')}
                    placeholder={`Level,Question,Option A,Option B,Option C,Option D,Correct Answer,Difficulty,Explanation\nLevel 1: Easy,What is 2+2?,2,3,4,5,C,Easy,2+2 equals 4\nLevel 2: Hard,What is the derivative of x^2?,x,2x,2,x^2,B,Hard,By power rule d/dx(x^2)=2x`}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Error messages if parsing failed */}
              {parseResult && !parseResult.success && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>CSV Parsing Errors</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Preview & Configuration */}
              {parseResult && parseResult.success && parseResult.test && (
                <div className="space-y-6 pt-2">
                  {/* Summary Bar */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          CSV Converted: {parseResult.levelsCount} Progressive Levels Detected
                        </div>
                        <div className="text-slate-600 text-xs mt-0.5">
                          Total {parseResult.totalQuestions} Questions &bull; Estimated Duration:{' '}
                          {parseResult.test.duration} Minutes
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {parseResult.test.levels.map((lvl, idx) => (
                        <span
                          key={lvl.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[11px] text-slate-700 flex items-center gap-1.5 shadow-sm"
                        >
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span>
                            L{idx + 1}: {lvl.questions.length} Qs ({lvl.timeLimit}m)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Warnings if any */}
                  {parseResult.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                      <div className="font-semibold mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Parser Notices:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {parseResult.warnings.slice(0, 3).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Editable Quiz Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Quiz Title:</label>
                      <input
                        type="text"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Full Stack Engineering Certification"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Test Code:</label>
                      <input
                        type="text"
                        value={quizCode}
                        onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-blue-700 font-mono font-bold focus:outline-none focus:border-blue-500"
                        placeholder="e.g. ATH-CSV101"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Description:</label>
                      <input
                        type="text"
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500"
                        placeholder="Assessment overview details"
                      />
                    </div>
                  </div>

                  {/* Level Accordion & Question Inspection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Level-Wise Question Hierarchy:
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Click level header to inspect questions & options
                      </span>
                    </div>

                    {parseResult.test.levels.map((lvl, lIdx) => {
                      const isExpanded = expandedLevel === lIdx;
                      return (
                        <div
                          key={lvl.id}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedLevel(isExpanded ? null : lIdx)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/60 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                                {lIdx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 text-xs">{lvl.name}</span>
                                <span className="text-slate-500 text-[11px] ml-2">
                                  ({lvl.questions.length} Questions)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>{lvl.timeLimit} Minutes</span>
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 space-y-3 border-t border-slate-100 divide-y divide-slate-100 bg-white">
                              {lvl.questions.map((q, qIdx) => (
                                <div key={q.id} className="pt-3 first:pt-0 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="font-semibold text-slate-800 text-xs flex gap-2">
                                      <span className="text-blue-600 font-mono">Q{qIdx + 1}.</span>
                                      <span>{q.text}</span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                        q.difficulty === 'Easy'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : q.difficulty === 'Hard'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {q.difficulty}
                                    </span>
                                  </div>

                                  {/* Options grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    {q.options.map((opt, oIdx) => {
                                      const isCorrect = oIdx === q.correctIndex;
                                      return (
                                        <div
                                          key={oIdx}
                                          className={`p-2 rounded-lg border flex items-center gap-2 ${
                                            isCorrect
                                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                              : 'bg-slate-50 border-slate-200 text-slate-600'
                                          }`}
                                        >
                                          <span
                                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                              isCorrect
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-200 text-slate-700'
                                            }`}
                                          >
                                            {String.fromCharCode(65 + oIdx)}
                                          </span>
                                          <span className="truncate">{opt}</span>
                                          {isCorrect && (
                                            <span className="text-[10px] text-emerald-700 ml-auto uppercase font-bold">
                                              Correct
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {q.explanation && (
                                    <div className="text-[10px] text-slate-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                      <span className="font-semibold text-blue-800">Explanation:</span> {q.explanation}
                                    </div>
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
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!publishedTest && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="text-slate-500 text-xs">
              {parseResult?.success && (
                <span>
                  Ready to import <strong className="text-slate-900">{parseResult.totalQuestions} questions</strong> into{' '}
                  <strong className="text-slate-900">{parseResult.levelsCount} levels</strong>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuiz}
                disabled={!parseResult?.success || !parseResult.test}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md transition-all ${
                  parseResult?.success && parseResult.test
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Save & Publish Quiz</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
