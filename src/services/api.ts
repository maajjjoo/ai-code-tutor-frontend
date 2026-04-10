import axios from 'axios';
import type {
  User, Project, EditorData, CodeSnapshot, AnalysisHistory,
  RegisterRequest, LoginRequest, LoginResponse,
  CreateProjectRequest, SaveSnapshotRequest, AnalyzeCodeRequest,
  LearnTopic, LearnCategory, Exercise, ExerciseEvaluation, UserProgress,
  GenerateExerciseRequest, EvaluateSolutionRequest,
} from '../types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (body: RegisterRequest) =>
  client.post<User>('/users', body).then(r => r.data);

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

// ─── Helper para extraer mensaje de error del backend ─────────────────────────
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const e = err as { response?: { data?: unknown } };
    if (e.response?.data) return String(e.response.data);
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

// ─── Terminal ─────────────────────────────────────────────────────────────────
export const runCode = (body: { code: string; language: string; stdin?: string }) =>
  client.post<{ stdout: string; stderr: string; exitCode: number }>('/terminal/run', body).then(r => r.data);
