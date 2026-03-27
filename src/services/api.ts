import axios from 'axios';
import type {
  User, Project, CodeSnapshot, AnalysisHistory,
  RegisterRequest, CreateProjectRequest, AnalyzeCodeRequest, SaveSnapshotRequest,
  LoginRequest, LoginResponse,
} from '../types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const registerUser = (body: RegisterRequest) =>
  client.post<User>('/users', body).then((r) => r.data);

export const loginUser = (body: LoginRequest) =>
  client.post<LoginResponse>('/users/login', body).then((r) => r.data);

export const getUserById = (id: number) =>
  client.get<User>(`/users/${id}`).then((r) => r.data);

export const getUserByEmail = (email: string) =>
  client.get<User>(`/users/email/${email}`).then((r) => r.data);

export const listUsers = () =>
  client.get<User[]>('/users').then((r) => r.data);

// ─── Projects ─────────────────────────────────────────────────────────────────
export const createProject = (body: CreateProjectRequest) =>
  client.post<Project>('/projects', body).then((r) => r.data);

export const getProjectById = (id: number) =>
  client.get<Project>(`/projects/${id}`).then((r) => r.data);

export const getProjectsByUser = (userId: number) =>
  client.get<Project[]>(`/projects/user/${userId}`).then((r) => r.data);

// ─── Snapshots ────────────────────────────────────────────────────────────────
export const saveSnapshot = (body: SaveSnapshotRequest) =>
  client.post<CodeSnapshot>('/projects/snapshots', body).then((r) => r.data);

export const getSnapshots = (projectId: number) =>
  client.get<CodeSnapshot[]>(`/projects/${projectId}/snapshots`).then((r) => r.data);

export const getLatestSnapshot = (projectId: number) =>
  client.get<CodeSnapshot>(`/projects/${projectId}/snapshots/latest`).then((r) => r.data);

// ─── Code / AI ────────────────────────────────────────────────────────────────
export const analyzeCode = (body: AnalyzeCodeRequest) =>
  client.post<AnalysisHistory>('/code/analyze', body).then((r) => r.data);

// Guide expects plain text body
export const generateGuide = (description: string) =>
  client.post<string>('/code/guide', description, {
    headers: { 'Content-Type': 'text/plain' },
  }).then((r) => r.data);

export const getAnalysisHistory = (projectId: number) =>
  client.get<AnalysisHistory[]>(`/code/history/${projectId}`).then((r) => r.data);

export const getRecentAnalysis = (projectId: number) =>
  client.get<AnalysisHistory[]>(`/code/history/${projectId}/recent`).then((r) => r.data);
