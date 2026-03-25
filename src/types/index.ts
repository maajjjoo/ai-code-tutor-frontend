export type Language = 'javascript' | 'python' | 'java' | 'cpp';

export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface GuideResponse {
  steps: GuideStep[];
  projectTitle: string;
}

export interface FunctionExplanation {
  functionName: string;
  explanation: string;
  lineStart: number;
  lineEnd: number;
}

export interface AnalysisResponse {
  explanations: FunctionExplanation[];
  suggestions: string[];
  summary: string;
}

export interface ProjectData {
  id?: string;
  name: string;
  description: string;
  language: Language;
  code: string;
  guideSteps: GuideStep[];
}

export interface SaveResponse {
  success: boolean;
  projectId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  message: string;
}

export interface EditorAction {
  type: 'STEP_TOGGLE' | 'CODE_CHANGE' | 'SUGGESTION_DISMISS';
  payload: unknown;
  timestamp: number;
}

// ─── Virtual File System ──────────────────────────────────────────────────────
export type FileNodeType = 'file' | 'folder';

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
