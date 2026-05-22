import client from './apiClient';
import type { Project, CreateProjectRequest, SaveSnapshotRequest, CodeSnapshot, EditorData, CodeAnalysisResponse, AnalyzeCodePedagogicalRequest } from '../types';

export const projectService = {
    getAll: (userId: number) =>
        client.get<Project[]>(`/projects/user/${userId}`).then(r => r.data),

    getById: (id: number) =>
        client.get<Project>(`/projects/${id}`).then(r => r.data),

    create: (data: CreateProjectRequest) =>
        client.post<Project>('/projects', data).then(r => r.data),

    loadEditor: (projectId: number) =>
        client.get<EditorData>(`/projects/${projectId}/editor`).then(r => r.data),

    saveSnapshot: (body: SaveSnapshotRequest) =>
        client.post<CodeSnapshot>('/projects/snapshots', body).then(r => r.data),

    analyzePedagogical: (body: AnalyzeCodePedagogicalRequest) =>
        client.post<CodeAnalysisResponse>('/projects/analyze', body).then(r => r.data),
};
