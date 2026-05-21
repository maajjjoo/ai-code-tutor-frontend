import axios from 'axios';
import type {
  Project, EditorData, CodeSnapshot, AnalysisHistory,
  RegisterRequest, LoginRequest, LoginResponse,
  CreateProjectRequest, SaveSnapshotRequest, AnalyzeCodeRequest,
  AnalyzeCodePedagogicalRequest, CodeAnalysisResponse,
  LearnTopic, LearnCategory, Exercise, ExerciseEvaluation, UserProgress,
  GenerateExerciseRequest, EvaluateSolutionRequest, ExerciseVerifyResponse,
} from '../types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if available
client.interceptors.request.use(config => {
  const token = localStorage.getItem('codetutor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 (token expired or missing)
client.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('codetutor_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (body: RegisterRequest) =>
  client.post<LoginResponse>('/users', body).then(r => r.data);

export const loginUser = (body: LoginRequest) =>
  client.post<LoginResponse>('/users/login', body).then(r => r.data);

// ─── Proyectos ────────────────────────────────────────────────────────────────
export const createProject = (body: CreateProjectRequest) =>
  client.post<Project>('/projects', body).then(r => r.data);

export const getProjectsByUser = (userId: number) =>
  client.get<Project[]>(`/projects/user/${userId}`).then(r => r.data);

export const loadEditor = (projectId: number) =>
  client.get<EditorData>(`/projects/${projectId}/editor`).then(r => r.data);

export const saveSnapshot = (body: SaveSnapshotRequest) =>
  client.post<CodeSnapshot>('/projects/snapshots', body).then(r => r.data);

// ─── IA ───────────────────────────────────────────────────────────────────────
export const analyzeCode = (body: AnalyzeCodeRequest) =>
  client.post<AnalysisHistory>('/code/analyze', body).then(r => r.data);

export const analyzeCodePedagogical = (body: AnalyzeCodePedagogicalRequest) =>
  client.post<CodeAnalysisResponse>('/projects/analyze', body).then(r => r.data);

export const generateGuide = (description: string) =>
  client.post<string>('/code/guide', description, {
    headers: { 'Content-Type': 'text/plain' },
  }).then(r => r.data);

// ─── Learn ────────────────────────────────────────────────────────────────────
export const getTopicsByCategory = (category: LearnCategory) =>
  client.get<LearnTopic[]>(`/learn/topics/category/${category}`).then(r => r.data);

export const generateExercise = (body: GenerateExerciseRequest) =>
  client.post<Exercise>('/learn/exercises/generate', body).then(r => r.data);

export const getHint = (exerciseId: number) =>
  client.get<string>(`/learn/exercises/${exerciseId}/hint`).then(r => r.data);

export const evaluateSolution = (body: EvaluateSolutionRequest) =>
  client.post<ExerciseEvaluation>('/learn/exercises/evaluate', body).then(r => r.data);

export const getProgress = (userId: number) =>
  client.get<UserProgress[]>(`/learn/progress/${userId}`).then(r => r.data);

// ─── Exercise Verify ───────────────────────────────────────────────────────────
export const verifyExercise = (body: {
  code: string;
  language: string;
  exercisePrompt: string;
  lessonTitle: string;
  level: string;
}) => client.post<ExerciseVerifyResponse>('/lessons/exercise/verify', body).then(r => r.data);

// ─── Helper para extraer mensaje de error del backend ─────────────────────────
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const e = err as { response?: { data?: Record<string, unknown> } };
    const data = e.response?.data;
    if (data) {
      if (typeof data === 'string') return data;
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      return JSON.stringify(data);
    }
  }
  return 'Error inesperado. Intenta de nuevo.';
}

// ─── Chat unificado ───────────────────────────────────────────────────────────
export const sendChatMessage = (body: {
  message: string;
  history: { role: 'user' | 'ai'; content: string }[];
  currentCode?: string;
  language?: string;
}) => client.post<{ message: string }>('/chat', body).then(r => r.data);

// ─── Explain ──────────────────────────────────────────────────────────────────
export const explainCode = (body: { selectedText: string; language: string; context: string }) =>
  client.post<{ explanation: string }>('/editor/explain', body).then(r => r.data);

// ─── Terminal ─────────────────────────────────────────────────────────────────
export const runCode = (body: { code: string; language: string; stdin?: string }) =>
  client.post<{ stdout: string; stderr: string; exitCode: number }>('/terminal/run', body).then(r => r.data);
