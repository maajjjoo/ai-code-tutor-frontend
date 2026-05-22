import client from './apiClient';
import type { LearnTopic, LearnCategory, Exercise, ExerciseEvaluation, UserProgress, ExerciseVerifyResponse } from '../types';

export const lessonService = {
    getTopics: (category: LearnCategory) =>
        client.get<LearnTopic[]>(`/topics/category/${category}`).then(r => r.data),

    generateExercise: (body: { topicId: number; language: string; userId?: number }) =>
        client.post<Exercise>('/exercises/generate', body).then(r => r.data),

    getHint: (exerciseId: number) =>
        client.get<string>(`/exercises/${exerciseId}/hint`).then(r => r.data),

    evaluateSolution: (body: { exerciseId: number; userId: number; userCode: string; language: string }) =>
        client.post<ExerciseEvaluation>('/exercises/evaluate', body).then(r => r.data),

    getProgress: (userId: number) =>
        client.get<UserProgress[]>(`/progress/${userId}`).then(r => r.data),

    verifyExercise: (body: { code: string; language: string; exercisePrompt: string; lessonTitle: string; level: string }) =>
        client.post<ExerciseVerifyResponse>('/lessons/exercise/verify', body).then(r => r.data),
};
