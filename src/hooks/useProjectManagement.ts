import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type * as Monaco from 'monaco-editor';
import { createProject, saveSnapshot, getProjectsByUser, loadEditor, getErrorMessage, deleteProject } from '../services/api';
import type { Language, ExerciseContext, Project as BackendProject } from '../types';
import type { VNode } from '../types/vfs';
import { uid } from '../types/vfs';
import type { useVirtualFileSystem } from './useVirtualFileSystem';
import { useToast } from '../context/ToastContext';
import { storage } from '../utils/storage';

const ACTIVE_PROJECT_KEY = 'codetutor-active-project';

function buildFileName(language: Language): string {
  const lang = language.toLowerCase() as Language;
  return `main.${lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'cpp' ? 'cpp' : lang === 'typescript' ? 'ts' : 'js'}`;
}

interface Params {
  vfs: ReturnType<typeof useVirtualFileSystem>;
  userId: number;
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
  monacoRef: React.RefObject<typeof Monaco | null>;
  activeProject: BackendProject | null;
  setActiveProject: React.Dispatch<React.SetStateAction<BackendProject | null>>;
  hasUnsavedChanges: boolean;
  saveManually: () => Promise<void>;
  setTermLines: React.Dispatch<React.SetStateAction<{ text: string; type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' | 'input' }[]>>;
}

export function useProjectManagement({ vfs, userId, editorRef, monacoRef, activeProject, setActiveProject, hasUnsavedChanges, saveManually, setTermLines }: Params) {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [savedProjects, setSavedProjects] = useState<BackendProject[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [backupSaving, setBackupSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      getProjectsByUser(userId).then(setSavedProjects).catch((err) => {
        console.error('Failed to load projects:', err);
        showToast('Failed to load saved projects', 'error');
      });
    }
  }, [userId]);

  const createExerciseNodes = useCallback((project: BackendProject, folderId: string, fileName: string, content: string, lang: Language): VNode[] => [
    { id: folderId, type: 'folder', name: project.name, parentId: null, open: true },
    { id: uid(), type: 'file', name: fileName, content, language: lang, parentId: folderId },
  ], []);

  const persistProject = useCallback((project: BackendProject, nodes: VNode[], fileName: string, content: string, lang: Language) => {
    vfs.setFsNodes(nodes);
    storage.set('codetutor-fs-nodes', JSON.stringify(nodes));
    setActiveProject(project);
    storage.set(ACTIVE_PROJECT_KEY, JSON.stringify({ id: project.id, name: project.name, programmingLanguage: project.programmingLanguage }));
    vfs.setOpenFile({ name: fileName, content, language: lang });
    vfs.setCode(content);
    vfs.setFsActiveId(nodes[1]?.id ?? null);
  }, [vfs, setActiveProject]);

  const saveCurrentProject = useCallback(async () => {
    if (!activeProject || backupSaving) return;
    await saveManually();
    setBackupSaving(true);
    try {
      if (vfs.fsActiveId) vfs.fileContentsRef.current[vfs.fsActiveId] = vfs.code;
      const updatedNodes = vfs.fsNodes.map(n =>
        n.id === vfs.fsActiveId && n.type === 'file' ? { ...n, content: vfs.code } : n
      );
      vfs.setFsNodes(updatedNodes);
      storage.set('codetutor-fs-nodes', JSON.stringify(updatedNodes));
      await saveSnapshot({ content: JSON.stringify({ nodes: updatedNodes }), projectId: activeProject.id });
      storage.set(`codetutor-project-${activeProject.id}-nodes`, JSON.stringify(updatedNodes));
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelMarkers(model, 'syntax', []);
          monacoRef.current.editor.setModelMarkers(model, 'runtime', []);
        }
      }
      showToast('Project saved', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBackupSaving(false);
    }
  }, [activeProject, backupSaving, saveManually, vfs, editorRef, monacoRef, showToast]);

  const autoCreateExerciseProject = useCallback(async (ctx: ExerciseContext) => {
    setIsCreatingProject(true);
    try {
      if (!userId) throw new Error('No user found');
      const project = await createProject({
        name: `${ctx.lessonTitle} — ${ctx.language}`,
        description: ctx.exercisePrompt,
        programmingLanguage: ctx.language.toLowerCase() as Language,
        userId,
      });
      const fileName = buildFileName(ctx.language as Language);
      const content = `// Exercise: ${ctx.exercisePrompt}\n\n`;
      vfs.fileContentsRef.current = {};
      const folderId = uid();
      const lang = ctx.language.toLowerCase() as Language;
      persistProject(project, createExerciseNodes(project, folderId, fileName, content, lang), fileName, content, lang);
      try { await saveSnapshot({ content, versionLabel: 'Initial exercise code', projectId: project.id }); } catch (err) { console.error('Failed to save initial snapshot:', err); }
      try { if (userId) setSavedProjects(await getProjectsByUser(userId)); } catch (err) { console.error('Failed to refresh projects list:', err); }
    } catch (err) {
      console.error('Auto-create exercise project failed:', err);
    } finally {
      setIsCreatingProject(false);
    }
  }, [userId, createExerciseNodes, persistProject, vfs]);

  useEffect(() => {
    const raw = searchParams?.get('exercise');
    if (!raw || exerciseContext) return;
    try {
      const ctx = JSON.parse(decodeURIComponent(raw)) as ExerciseContext;
      setExerciseContext(ctx);
      autoCreateExerciseProject(ctx);
    } catch {}
  }, [autoCreateExerciseProject, exerciseContext, searchParams]);

  const handleCreateProject = async (name: string) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (activeProject && hasUnsavedChanges) await saveCurrentProject();
      vfs.fileContentsRef.current = {};
      const newProject = await createProject({ name, description: name, programmingLanguage: 'javascript' as Language, userId });
      vfs.setOpenFile(null);
      vfs.setCode('');
      vfs.setFsActiveId(null);
      setTermLines([]);
      const folderId = uid();
      const newNodes: VNode[] = [{ id: folderId, type: 'folder', name, parentId: null, open: true }];
      vfs.setFsNodes(newNodes);
      storage.set('codetutor-fs-nodes', JSON.stringify(newNodes));
      setActiveProject(newProject);
      storage.set(ACTIVE_PROJECT_KEY, JSON.stringify({ id: newProject.id, name: newProject.name, programmingLanguage: newProject.programmingLanguage }));
      setSavedProjects(await getProjectsByUser(userId));
      setIsNewProjectModalOpen(false);
    } catch {
      setModalError('Error creating project. Check your connection.');
    } finally {
      setModalLoading(false);
    }
  };

  const loadProjectNodes = useCallback(async (project: BackendProject): Promise<VNode[]> => {
    let nodes: VNode[] = [];
    const local = storage.get(`codetutor-project-${project.id}-nodes`);
    if (local) { try { const p = JSON.parse(local); if (Array.isArray(p) && p.length > 0) nodes = p; } catch {} }
    if (nodes.length === 0) {
      try { const data = await loadEditor(project.id); try { const p = JSON.parse(data.currentCode ?? ''); if (p.nodes && Array.isArray(p.nodes)) nodes = p.nodes; } catch {} } catch {}
    }
    if (nodes.length === 0) { const folderId = uid(); nodes = [{ id: folderId, type: 'folder', name: project.name, parentId: null, open: true }]; }
    return nodes;
  }, []);

  const handleLoadSavedProject = async (project: BackendProject) => {
    if (activeProject && hasUnsavedChanges) await saveCurrentProject();
    vfs.fileContentsRef.current = {};
    vfs.setOpenFile(null);
    vfs.setCode('');
    vfs.setFsActiveId(null);
    setTermLines([]);
    setLoadingProject(true);
    const projectNodes = await loadProjectNodes(project);
    vfs.setFsNodes(projectNodes);
    storage.set('codetutor-fs-nodes', JSON.stringify(projectNodes));
    setActiveProject(project);
    storage.set(ACTIVE_PROJECT_KEY, JSON.stringify({ id: project.id, name: project.name, programmingLanguage: project.programmingLanguage }));
    setLoadingProject(false);
    showToast('Project loaded', 'success');
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      storage.remove(`codetutor-project-${deleteTarget.id}-nodes`);
      storage.remove(`active_project`);
      setSavedProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('Project deleted', 'warning');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(getErrorMessage(err), 'error');
    }
  };

  return {
    exerciseContext, setExerciseContext,
    isCreatingProject,
    savedProjects,
    isNewProjectModalOpen, setIsNewProjectModalOpen,
    modalLoading, modalError, setModalError,
    deleteTarget, setDeleteTarget,
    loadingProject, backupSaving,
    saveCurrentProject,
    handleCreateProject, handleLoadSavedProject, handleDeleteProject,
  };
}
