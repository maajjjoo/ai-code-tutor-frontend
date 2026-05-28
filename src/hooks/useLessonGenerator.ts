import { useState } from 'react';
import type { GenerationStatus, GenerateLessonDto, GeneratedLesson } from '../types/generatedLesson.types';
import apiClient from '../services/apiClient';
import { getErrorMessage } from '../utils/errorMessages';

export function useLessonGenerator() {
    const [status, setStatus] = useState<GenerationStatus | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);

    const loadStatus = async () => {
        setIsLoadingStatus(true);
        try {
            const { data } = await apiClient.get<GenerationStatus>('/lessons/generated/status');
            setStatus(data);
        } catch (err) {
            console.error('Failed to load status:', err);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const generate = async (dto: GenerateLessonDto) => {
        setIsGenerating(true);
        setError(null);
        setGeneratedLesson(null);
        try {
            const { data } = await apiClient.post<GeneratedLesson>('/lessons/generated', dto, { timeout: 120000 });
            setGeneratedLesson(data);
            await loadStatus();
            return data;
        } catch (err: any) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;
            const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.response?.status === 504 || err.response?.status === 503;
            if (status === 500 || err.code === 'ECONNABORTED') {
                setError(
                    'La IA tuvo dificultades generando la lección. Esto pasa ocasionalmente. ' +
                    'Presiona "Generar" nuevamente para reintentar.'
                );
            } else if (isTimeout) {
                setError('La generación tardó demasiado. El tema puede ser muy complejo. Intenta con un tema más específico o vuelve a intentarlo.');
            } else {
                setError(getErrorMessage(err));
            }
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const saveLesson = async (lessonId: number) => {
        try {
            await apiClient.put(`/lessons/generated/${lessonId}/save`);
            await loadStatus();
        } catch (err) {
            console.error('Failed to save lesson:', err);
        }
    };

    const deleteLesson = async (lessonId: number) => {
        try {
            await apiClient.delete(`/lessons/generated/${lessonId}`);
            await loadStatus();
            if (generatedLesson?.id === lessonId) {
                setGeneratedLesson(null);
            }
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert(getErrorMessage(err));
        }
    };

    const openLesson = async (lessonId: number) => {
        try {
            const { data } = await apiClient.get<GeneratedLesson>(`/lessons/generated/${lessonId}`);
            setGeneratedLesson(data);
            return data;
        } catch (err) {
            console.error('Failed to open lesson:', err);
            return null;
        }
    };

    return {
        status,
        isGenerating,
        isLoadingStatus,
        error,
        generatedLesson,
        loadStatus,
        generate,
        saveLesson,
        deleteLesson,
        openLesson,
        setError,
        setGeneratedLesson,
    };
}
