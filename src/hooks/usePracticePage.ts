import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import {
  sendChatMessage, analyzeCodePedagogical, runCode,
  createProject, saveSnapshot, getProjectsByUser, loadEditor,
  getErrorMessage, explainCode,
} from '../services/api';
import type { Language, ExerciseContext, Project as BackendProject, CodeAnalysisResponse } from '../types';
import type { VNode } from '../types/vfs';
import { uid } from '../types/vfs';
import { useEditorPersistence } from './useEditorPersistence';
import { useVirtualFileSystem } from './useVirtualFileSystem';

interface StoredUser { id: number; username: string; email: string; }

export interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  content: string;
  quality?: { structure: number; readability: number };
  suggestions?: string[];
  timestamp: number;
}

interface MonacoMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
}

const ACTIVE_PROJECT_KEY = 'codetutor-active-project';

function buildFileName(language: Language): string {
  const lang = language.toLowerCase() as Language;
  return `main.${lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'cpp' ? 'cpp' : lang === 'typescript' ? 'ts' : 'js'}`;
}

export function usePracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  const vfs = useVirtualFileSystem();

  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [aiPanelWidth, setAiPanelWidth] = useState(320);
  const resizing = useRef<'sidebar' | 'ai' | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [creatingFileName, setCreatingFileName] = useState('');
  const creatingInputRef = useRef<HTMLInputElement>(null);

  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof MonacoEditor>['onMount']>>[0] | null>(null);
  const monacoRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof MonacoEditor>['onMount']>>[1] | null>(null);

  const [selectedText, setSelectedText] = useState('');
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipLoading, setTooltipLoading] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const handleExplainRef = useRef<() => void>(() => {});

  const [activeProject, setActiveProject] = useState<BackendProject | null>(() => {
    try { return JSON.parse(localStorage.getItem(ACTIVE_PROJECT_KEY) ?? 'null'); } catch { return null; }
  });
  const [savedProjects, setSavedProjects] = useState<BackendProject[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [backupSaving, setBackupSaving] = useState(false);

  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'Terminal' | 'Output' | 'Problems'>('Terminal');
  const [termLines, setTermLines] = useState<{ text: string; type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' | 'input' }[]>([]);
  const [, setTerminalRunning] = useState(false);

  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const projectId = activeProject?.id ?? 0;
  const fileName = vfs.openFile?.name ?? 'untitled';

  const {
    hasUnsavedChanges,
    saveIndicatorState,
    saveManually,
  } = useEditorPersistence({ projectId, fileName, currentContent: vfs.code });

  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, aiLoading]);

  useEffect(() => {
    if (user.id) {
      getProjectsByUser(user.id).then(setSavedProjects).catch(() => {});
    }
  }, [user.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const createExerciseNodes = useCallback((project: BackendProject, folderId: string, fileName: string, content: string, lang: Language): VNode[] => {
    return [
      { id: folderId, type: 'folder', name: project.name, parentId: null, open: true },
      { id: uid(), type: 'file', name: fileName, content, language: lang, parentId: folderId },
    ];
  }, []);

  const persistProject = useCallback((project: BackendProject, nodes: VNode[], fileName: string, content: string, lang: Language) => {
    vfs.setFsNodes(nodes);
    localStorage.setItem('codetutor-fs-nodes', JSON.stringify(nodes));
    setActiveProject(project);
    localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
    vfs.setOpenFile({ name: fileName, content, language: lang });
    vfs.setCode(content);
    vfs.setFsActiveId(nodes[1]?.id ?? null);
  }, [vfs]);

  const autoCreateExerciseProject = useCallback(async (ctx: ExerciseContext) => {
    setIsCreatingProject(true);
    try {
      if (!user.id) throw new Error('No user found');
      const project = await createProject({
        name: `${ctx.lessonTitle} — ${ctx.language}`,
        description: ctx.exercisePrompt,
        programmingLanguage: ctx.language.toLowerCase() as Language,
        userId: user.id,
      });
      const fileName = buildFileName(ctx.language as Language);
      const content = `// Exercise: ${ctx.exercisePrompt}\n\n`;
      vfs.fileContentsRef.current = {};
      const folderId = uid();
      const lang = ctx.language.toLowerCase() as Language;
      const nodes = createExerciseNodes(project, folderId, fileName, content, lang);
      persistProject(project, nodes, fileName, content, lang);
      try { await saveSnapshot({ content, versionLabel: 'Initial exercise code', projectId: project.id }); } catch {}
      try { const projects = await getProjectsByUser(user.id); setSavedProjects(projects); } catch {}
    } catch (err) {
      console.error('Auto-create exercise project failed:', err);
    } finally {
      setIsCreatingProject(false);
    }
  }, [user.id, createExerciseNodes, persistProject]);

  useEffect(() => {
    const raw = searchParams?.get('exercise');
    if (!raw || exerciseContext) return;
    try {
      const ctx = JSON.parse(decodeURIComponent(raw)) as ExerciseContext;
      setExerciseContext(ctx);
      autoCreateExerciseProject(ctx);
    } catch {}
  }, [autoCreateExerciseProject, exerciseContext, searchParams]);

  const saveCurrentProject = useCallback(async () => {
    if (!activeProject || backupSaving) return;
    await saveManually();
    setBackupSaving(true);
    try {
      if (vfs.fsActiveId) {
        vfs.fileContentsRef.current[vfs.fsActiveId] = vfs.code;
      }
      const updatedNodes = vfs.fsNodes.map(n =>
        n.id === vfs.fsActiveId && n.type === 'file' ? { ...n, content: vfs.code } : n
      );
      vfs.setFsNodes(updatedNodes);
      localStorage.setItem('codetutor-fs-nodes', JSON.stringify(updatedNodes));
      await saveSnapshot({ content: JSON.stringify({ nodes: updatedNodes }), projectId: activeProject.id });
      localStorage.setItem(`codetutor-project-${activeProject.id}-nodes`, JSON.stringify(updatedNodes));
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelMarkers(model, 'syntax', []);
          monacoRef.current.editor.setModelMarkers(model, 'runtime', []);
        }
      }
      setToast('Project saved');
    } catch (err) {
      console.error('Save error:', getErrorMessage(err));
    } finally {
      setBackupSaving(false);
    }
  }, [activeProject, backupSaving, saveManually, vfs.fsNodes, vfs.fsActiveId, vfs.code, vfs.setFsNodes, vfs.fileContentsRef]);

  const saveRef = useRef(saveCurrentProject);
  saveRef.current = saveCurrentProject;

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        await saveRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCreateProject = async (name: string) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (activeProject && hasUnsavedChanges) {
        await saveCurrentProject();
      }
      vfs.fileContentsRef.current = {};
      const newProject = await createProject({
        name, description: name, programmingLanguage: 'javascript' as Language, userId: user.id,
      });
      vfs.setOpenFile(null);
      vfs.setCode('');
      vfs.setFsActiveId(null);
      setTermLines([]);
      const folderId = uid();
      const newNodes: VNode[] = [{ id: folderId, type: 'folder', name, parentId: null, open: true }];
      vfs.setFsNodes(newNodes);
      localStorage.setItem('codetutor-fs-nodes', JSON.stringify(newNodes));
      setActiveProject(newProject);
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(newProject));
      const projects = await getProjectsByUser(user.id);
      setSavedProjects(projects);
      setIsNewProjectModalOpen(false);
    } catch {
      setModalError('Error creating project. Check your connection.');
    } finally {
      setModalLoading(false);
    }
  };

  const loadProjectNodes = useCallback(async (project: BackendProject): Promise<VNode[]> => {
    let projectNodes: VNode[] = [];
    const localNodes = localStorage.getItem(`codetutor-project-${project.id}-nodes`);
    if (localNodes) {
      try { const parsed = JSON.parse(localNodes); if (Array.isArray(parsed) && parsed.length > 0) projectNodes = parsed; } catch {}
    }
    if (projectNodes.length === 0) {
      try {
        const data = await loadEditor(project.id);
        try { const parsed = JSON.parse(data.currentCode ?? ''); if (parsed.nodes && Array.isArray(parsed.nodes)) projectNodes = parsed.nodes; } catch {}
      } catch {}
    }
    if (projectNodes.length === 0) {
      const folderId = uid();
      projectNodes = [{ id: folderId, type: 'folder', name: project.name, parentId: null, open: true }];
    }
    return projectNodes;
  }, []);

  const handleLoadSavedProject = async (project: BackendProject) => {
    if (activeProject && hasUnsavedChanges) {
      await saveCurrentProject();
    }
    vfs.fileContentsRef.current = {};
    vfs.setOpenFile(null);
    vfs.setCode('');
    vfs.setFsActiveId(null);
    setTermLines([]);
    setLoadingProject(true);
    const projectNodes = await loadProjectNodes(project);
    vfs.setFsNodes(projectNodes);
    localStorage.setItem('codetutor-fs-nodes', JSON.stringify(projectNodes));
    setActiveProject(project);
    localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
    setLoadingProject(false);
    setToast('Project loaded');
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    localStorage.removeItem(`codetutor-project-${deleteTarget.id}-nodes`);
    setSavedProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast('Project deleted');
  };

  const parseStructuredResponse = (text: string): { content: string; quality?: { structure: number; readability: number }; suggestions?: string[] } => {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        return {
          content: parsed.whatItDoes || parsed.summary || '',
          quality: parsed.quality,
          suggestions: parsed.suggestions,
        };
      }
    } catch {}
    return { content: text };
  };

  const parseAndSetAiResponse = useCallback((result: CodeAnalysisResponse): ChatMsg => {
    let fullContent = result.summary;
    if (result.hasErrors && result.errorHint) {
      fullContent += `\n\nError detected: ${result.errorHint}`;
    }
    const structured = parseStructuredResponse(fullContent);
    return {
      id: uid(), role: 'ai', content: structured.content, timestamp: Date.now(),
      quality: structured.quality || result.quality,
      suggestions: structured.suggestions || result.suggestions.map(s => `${s.title}: ${s.description}`),
    };
  }, []);

  const setEditorMarkers = useCallback((result: CodeAnalysisResponse) => {
    if (!result.hasErrors || !editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    monacoRef.current.editor.setModelMarkers(model, 'syntax', []);
    const markers: MonacoMarker[] = [];
    if (result.errorHint) {
      const lineMatch = result.errorHint.match(/line\s*(\d+)/i) || result.errorHint.match(/Line\s*(\d+)/i);
      if (lineMatch) {
        markers.push({
          startLineNumber: parseInt(lineMatch[1]),
          startColumn: 1,
          endLineNumber: parseInt(lineMatch[1]),
          endColumn: 1000,
          message: result.errorHint,
          severity: monacoRef.current.MarkerSeverity.Error,
        });
      } else {
        const totalLines = (vfs.code.match(/\n/g) || []).length + 1;
        markers.push({
          startLineNumber: 1, startColumn: 1, endLineNumber: totalLines, endColumn: 1000,
          message: result.errorHint,
          severity: monacoRef.current.MarkerSeverity.Error,
        });
      }
    }
    monacoRef.current.editor.setModelMarkers(model, 'syntax', markers);
  }, [vfs.code, editorRef, monacoRef]);

  const handleAnalyze = useCallback(async () => {
    if (!vfs.code.trim()) return;
    const now = Date.now();
    setAiMessages(prev => [...prev, { id: uid(), role: 'user', content: 'Analyzing your code...', timestamp: now }]);
    setAiLoading(true);
    try {
      const result = await analyzeCodePedagogical({
        code: vfs.code, language: vfs.openFile?.language ?? 'python', projectDescription: activeProject?.name ?? 'Project',
        exerciseContext: exerciseContext ? { prompt: exerciseContext.exercisePrompt, lessonTitle: exerciseContext.lessonTitle, level: exerciseContext.level } : undefined,
      });
      setAiMessages(prev => [...prev, parseAndSetAiResponse(result)]);
      setEditorMarkers(result);
    } catch {
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Could not analyze your code right now. Please try again.', timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  }, [vfs.code, vfs.openFile, activeProject, exerciseContext, parseAndSetAiResponse, setEditorMarkers]);

  const handleAiSend = useCallback(async () => {
    if (!aiInput.trim() || aiLoading) return;
    const text = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { id: uid(), role: 'user', content: text, timestamp: Date.now() }]);
    setAiLoading(true);
    try {
      const history = aiMessages.slice(-10).map(m => ({ role: m.role === 'ai' ? 'ai' as const : 'user' as const, content: m.content }));
      const res = await sendChatMessage({ message: text, history, currentCode: vfs.code, language: vfs.openFile?.language });
      const cleanMsg = res.message.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: cleanMsg, timestamp: Date.now() }]);
    } catch {
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Connection error. Please try again.', timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMessages, vfs.code, vfs.openFile]);

  const setRunStderrMarkers = useCallback((stderr: string) => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const markers: MonacoMarker[] = [];
    stderr.split('\n').forEach(line => {
      const match = line.match(/line\s*(\d+)/i) || line.match(/Line\s*(\d+)/i);
      if (match) {
        markers.push({
          startLineNumber: parseInt(match[1]),
          startColumn: 1,
          endLineNumber: parseInt(match[1]),
          endColumn: 1000,
          message: line.trim(),
          severity: monacoRef.current.MarkerSeverity.Error,
        });
      }
    });
    monacoRef.current.editor.setModelMarkers(model, 'runtime', markers);
  }, [editorRef, monacoRef]);

  const buildRunOutputLines = useCallback((res: { stdout: string; stderr: string; exitCode: number }): { text: string; type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' }[] => {
    const next: { text: string; type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' }[] = [];
    if (res.stdout) { res.stdout.split('\n').filter(Boolean).forEach(l => next.push({ text: l, type: 'output' })); }
    if (res.stderr) { res.stderr.split('\n').filter(Boolean).forEach(l => next.push({ text: l, type: 'error' })); }
    if (!res.stdout && !res.stderr) { next.push({ text: '(no output)', type: 'output' }); }
    next.push({ text: res.exitCode === 0 ? 'Process finished with exit code 0' : `Process finished with exit code ${res.exitCode}`, type: res.exitCode === 0 ? 'output' : 'error' });
    return next;
  }, []);

  const handleRunCode = useCallback(async () => {
    if (!vfs.code.trim()) return;
    setConsoleOpen(true);
    setConsoleTab('Output');
    setTermLines(prev => [...prev, { text: `> Running...`, type: 'info' }]);
    setTerminalRunning(true);
    try {
      const res = await runCode({ code: vfs.code, language: vfs.openFile?.language ?? 'python' });
      const next = [{ text: `> Running...`, type: 'info' as const }, ...buildRunOutputLines(res)];
      if (res.stderr) { setRunStderrMarkers(res.stderr); }
      setTermLines(next);
    } catch {
      setTermLines(prev => [...prev, { text: 'Error executing code', type: 'error' }]);
    } finally {
      setTerminalRunning(false);
    }
  }, [vfs.code, vfs.openFile, buildRunOutputLines, setRunStderrMarkers]);

  const handleExplainCode = useCallback(async () => {
    const text = selectedText;
    if (!text || !vfs.openFile) return;
    setTooltipLoading(true);
    try {
      const res = await explainCode({ selectedText: text, language: vfs.openFile.language, context: vfs.code });
      setTooltipContent(res.explanation);
    } catch {
      setTooltipContent('Failed to get explanation.');
    } finally {
      setTooltipLoading(false);
    }
  }, [selectedText, vfs.openFile, vfs.code]);

  useEffect(() => { handleExplainRef.current = handleExplainCode; }, [handleExplainCode]);

  useEffect(() => {
    if (!tooltipPos) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.code-tooltip')) {
        setTooltipPos(null);
        setSelectedText('');
        setTooltipContent(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTooltipPos(null);
        setSelectedText('');
        setTooltipContent(null);
      }
    };
    const id = setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKey);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [tooltipPos]);

  const handleEditorMount: NonNullable<React.ComponentProps<typeof MonacoEditor>['onMount']> = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addAction({
      id: 'explain-code',
      label: 'Explain Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => handleExplainRef.current(),
    });
    editor.onDidChangeCursorSelection(() => {
      const sel = editor.getSelection();
      if (sel && !sel.isEmpty()) {
        const txt = editor.getModel()?.getValueInRange(sel) ?? '';
        setSelectedText(txt);
        const pos = editor.getScrolledVisiblePosition(sel.getPosition());
        if (pos) {
          const domNode = editor.getDomNode();
          if (domNode) {
            const rect = domNode.getBoundingClientRect();
            setTooltipPos({ top: rect.top + pos.top - 40, left: rect.left + pos.left + 20 });
          }
        }
        setTooltipContent(null);
        setTooltipLoading(false);
      } else {
        setSelectedText('');
        setTooltipPos(null);
        setTooltipContent(null);
        setTooltipLoading(false);
      }
    });
    if (monaco.languages.typescript?.javascriptDefaults) {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
    }
  }, []);

  return {
    navigate,
    exerciseContext, setExerciseContext,
    isPanelCollapsed, setIsPanelCollapsed,
    isCreatingProject,
    sidebarWidth, setSidebarWidth, aiPanelWidth, setAiPanelWidth, resizing, resizeStartX, resizeStartWidth,
    isCreatingFile, setIsCreatingFile,
    creatingFileName, setCreatingFileName,
    creatingInputRef,
    renamingFileId, setRenamingFileId,
    renamingFileName, setRenamingFileName,
    renameInputRef,
    editorRef, monacoRef,
    selectedText, setSelectedText,
    tooltipPos, setTooltipPos,
    tooltipContent, setTooltipContent,
    tooltipLoading, setTooltipLoading,
    tooltipRef,
    activeProject, savedProjects,
    isNewProjectModalOpen, setIsNewProjectModalOpen,
    modalLoading, modalError, setModalError,
    deleteTarget, setDeleteTarget,
    loadingProject, toast, backupSaving,
    setToast,
    handleAnalyze, handleAiSend, handleRunCode, handleExplainCode,
    handleCreateProject, handleLoadSavedProject, handleDeleteProject,
    saveCurrentProject,
    consoleOpen, setConsoleOpen,
    consoleTab, setConsoleTab,
    termLines, setTermLines,
    aiMessages, aiInput, setAiInput,
    aiLoading, showHistory, setShowHistory,
    aiBottomRef,
    hasUnsavedChanges, saveIndicatorState,
    handleEditorMount,
    fsNodes: vfs.fsNodes,
    setFsNodes: vfs.setFsNodes,
    fsActiveId: vfs.fsActiveId,
    setFsActiveId: vfs.setFsActiveId,
    openFile: vfs.openFile,
    setOpenFile: vfs.setOpenFile,
    code: vfs.code,
    setCode: vfs.setCode,
    fileContentsRef: vfs.fileContentsRef,
    firstFolder: vfs.firstFolder,
    filesList: vfs.filesList,
    switchToFile: vfs.switchToFile,
    handleCodeChange: vfs.handleCodeChange,
    handleNewFile: vfs.handleNewFile,
    handleRenameFile: vfs.handleRenameFile,
    handleDeleteFile: vfs.handleDeleteFile,
  };
}
