// Types for Atheeg Test Platform

export interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, or 3
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface TestLevel {
  id: string;
  name: string;
  timeLimit: number; // in minutes
  questions: Question[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  code: string; // e.g., 'ATH-GK101'
  duration: number; // total duration in minutes
  levels: TestLevel[];
  published: boolean;
  createdAt: string;
  opensAt?: string; // ISO datetime when the test is first available
  closesAt?: string; // ISO datetime when the test stops accepting attempts
  allowedStartTime?: string; // e.g. '09:00'
  allowedEndTime?: string; // e.g. '18:00'
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Note: In production, hash with bcrypt on server
  createdAt: string;
}

export interface LevelScore {
  levelId: string;
  levelName: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
}

export interface ProctoringSnapshot {
  attemptId: string;
  timestamp: string;
  imageData: string; // base64 or canvas snapshot
  reason?: string; // 'periodic' | 'tab_switch' | 'disqualification'
}

export interface ProctoringEvent {
  attemptId: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 're-focus';
  timestamp: string;
  details?: string;
  snapshotData?: string; // photo captured at moment of event
}

export interface Attempt {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  testId: string;
  testCode: string;
  testTitle: string;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, number | null>; // questionId -> selectedIndex
  markedForReview: string[]; // questionIds
  score: number; // Total points/correct count
  totalQuestions: number;
  percentage: number;
  levelScores: LevelScore[];
  timeTaken: number; // in seconds
  status: 'Completed' | 'Timed Out' | 'Disqualified';
  proctoringEventsCount: number;
  violationSnapshot?: string; // photo captured upon tab switch / auto-ending
  terminationReason?: string; // reason for auto-termination
}

export interface AppSettings {
  theme: 'dark' | 'light';
  proctoringEnabled: boolean;
  strictTabSwitchLimit: number;
  autoEndOnTabSwitch: boolean; // Automatically end exam if candidate switches tabs
  capturePhotoOnTabSwitch: boolean; // Automatically capture camera photo when tab switch is detected
}
