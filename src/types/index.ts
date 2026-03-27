// ─── Lenguajes soportados ─────────────────────────────────────────────────────
export type Language = 'javascript' | 'python' | 'java' | 'typescript' | 'cpp';

// ─── Entidades del backend ────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  programmingLanguage: Language;
  createdAt: string;
  updatedAt: string;
  userId: number;
  username: string;
}

export interface EditorData {
  projectId: number;
  projectName: string;
  language: Language;
  currentCode: string;
  versionNumber: number;
}

export interface CodeSnapshot {
  id: number;
  content: string;
  versionLabel: string;
  versionNumber: number;
  createdAt: string;
  projectId: number;
}

export interface AnalysisHistory {
  id: number;
  analyzedCode: string;
  explanation: string;
  suggestions: string;
  analyzedAt: string;
  projectId: number;
}

// ─── Learn ────────────────────────────────────────────────────────────────────
export type LearnCategory = 'DATA_STRUCTURE' | 'DESIGN_PATTERN' | 'ALGORITHM';

export interface LearnTopic {
  id: number;
  name: string;
  description: string;
  category: LearnCategory;
}

export interface Exercise {
  id: number;
  statement: string;
  starterCode: string;
  language: Language;
  topicId: number;
}

export interface ExerciseEvaluation {
  correct: boolean;
  feedback: string;
  score: number;
}

export interface UserProgress {
  topicId: number;
  topicName: string;
  completedExercises: number;
  totalExercises: number;
}

// ─── Requests ─────────────────────────────────────────────────────────────────
export interface RegisterRequest { username: string; email: string; password: string; }
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { id: number; username: string; email: string; message: string; }
export interface CreateProjectRequest { name: string; description: string; programmingLanguage: Language; userId: number; }
export interface SaveSnapshotRequest { content: string; versionLabel?: string; projectId: number; }
export interface AnalyzeCodeRequest { code: string; language: string; projectId: number; }
export interface GenerateExerciseRequest { topicId: number; language: Language; userId: number; }
export interface EvaluateSolutionRequest { exerciseId: number; userCode: string; language: Language; userId: number; }

// ─── UI only ──────────────────────────────────────────────────────────────────
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; timestamp: number; }
export interface EditorAction { type: 'STEP_TOGGLE' | 'CODE_CHANGE' | 'SUGGESTION_DISMISS'; payload: unknown; timestamp: number; }
export interface GuideStep { id: string; stepNumber: number; title: string; description: string; completed: boolean; }
export interface FileNode { id: string; type: 'file'; name: string; content: string; language: Language; parentId: string | null; }
export interface FolderNode { id: string; type: 'folder'; name: string; parentId: string | null; isOpen: boolean; }
export type FSNode = FileNode | FolderNode;
