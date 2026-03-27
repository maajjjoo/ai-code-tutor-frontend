// ─── Language ─────────────────────────────────────────────────────────────────
export type Language = 'javascript' | 'python' | 'java' | 'typescript' | 'cpp';

// ─── Backend entities ─────────────────────────────────────────────────────────
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

// ─── API request/response shapes ──────────────────────────────────────────────
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  message: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  programmingLanguage: Language;
  userId: number;
}

export interface AnalyzeCodeRequest {
  code: string;
  language: string;
  projectId: number;
}

export interface SaveSnapshotRequest {
  content: string;
  versionLabel?: string;
  projectId: number;
}

// ─── UI-only types ────────────────────────────────────────────────────────────
export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface EditorAction {
  type: 'STEP_TOGGLE' | 'CODE_CHANGE' | 'SUGGESTION_DISMISS';
  payload: unknown;
  timestamp: number;
}

// ─── Virtual File System (local only) ────────────────────────────────────────
export interface FileNode {
  id: string;
  type: 'file';
  name: string;
  content: string;
  language: Language;
  parentId: string | null;
}

export interface FolderNode {
  id: string;
  type: 'folder';
  name: string;
  parentId: string | null;
  isOpen: boolean;
}

export type FSNode = FileNode | FolderNode;
