import client from './apiClient';
import type { AnalysisHistory, AnalyzeCodeRequest } from '../types';

export const aiService = {
    analyzeCode: (body: AnalyzeCodeRequest) =>
        client.post<AnalysisHistory>('/code/analyze', body).then(r => r.data),

    generateGuide: (description: string) =>
        client.post<string>('/code/guide', description, {
            headers: { 'Content-Type': 'text/plain' },
        }).then(r => r.data),

    sendChatMessage: (body: { message: string; history: { role: 'user' | 'ai'; content: string }[]; currentCode?: string; language?: string }) =>
        client.post<{ message: string }>('/chat', body).then(r => r.data),

    explainCode: (body: { selectedText: string; language: string; context: string }) =>
        client.post<{ explanation: string }>('/editor/explain', body).then(r => r.data),

    runCode: (body: { code: string; language: string; stdin?: string }) =>
        client.post<{ stdout: string; stderr: string; exitCode: number }>('/terminal/run', body).then(r => r.data),
};
