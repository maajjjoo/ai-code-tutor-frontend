import { useState } from 'react';
import type { GenerationStatus, GenerateLessonDto, GeneratedLesson } from '../types/generatedLesson.types';
import apiClient from '../services/apiClient';

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
            const { data } = await apiClient.post<GeneratedLesson>('/lessons/generated', dto);
            setGeneratedLesson(data);
            await loadStatus();
            return data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Error al generar la lección. Intenta de nuevo.';
            setError(message);
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
            const message = err.response?.data?.message || 'Error al eliminar la lecci\u00f3n';
            alert(message);
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
