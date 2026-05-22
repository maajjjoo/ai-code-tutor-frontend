import client from './apiClient';

export const registerUser = (body: import('../types').RegisterRequest) =>
  client.post<import('../types').LoginResponse>('/users', body).then(r => r.data);

export const loginUser = (body: import('../types').LoginRequest) =>
  client.post<import('../types').LoginResponse>('/users/login', body).then(r => r.data);

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
  return 'Unexpected error. Please try again.';
}

// Legacy exports — kept for backward compatibility
import { projectService } from './projectService';
import { lessonService } from './lessonService';
import { aiService } from './aiService';

export const createProject = projectService.create;
export const getProjectsByUser = projectService.getAll;
export const loadEditor = projectService.loadEditor;
export const saveSnapshot = projectService.saveSnapshot;
export const analyzeCodePedagogical = projectService.analyzePedagogical;

export const getTopicsByCategory = lessonService.getTopics;
export const generateExercise = lessonService.generateExercise;
export const getHint = lessonService.getHint;
export const evaluateSolution = lessonService.evaluateSolution;
export const getProgress = lessonService.getProgress;
export const verifyExercise = lessonService.verifyExercise;

export const analyzeCode = aiService.analyzeCode;
export const generateGuide = aiService.generateGuide;
export const sendChatMessage = aiService.sendChatMessage;
export const explainCode = aiService.explainCode;
export const runCode = aiService.runCode;
