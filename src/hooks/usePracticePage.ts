import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type * as Monaco from 'monaco-editor';
import { explainCode } from '../services/api';
import type { Project as BackendProject } from '../types';
import { useEditorPersistence } from './useEditorPersistence';
import { useVirtualFileSystem } from './useVirtualFileSystem';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from './usePageTitle';
import { useProjectManagement } from './useProjectManagement';
import { useCodeExecution } from './useCodeExecution';
import { useAIChat } from './useAIChat';
import { storage } from '../utils/storage';



const ACTIVE_PROJECT_KEY = 'codetutor-active-project';

export function usePracticePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  const vfs = useVirtualFileSystem();

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const [activeProject, setActiveProject] = useState<BackendProject | null>(() => {
    try { return JSON.parse(storage.get(ACTIVE_PROJECT_KEY) ?? 'null'); } catch { return null; }
  });

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
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

  const [selectedText, setSelectedText] = useState('');
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipLoading, setTooltipLoading] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const handleExplainRef = useRef<() => void>(() => {});

  const { hasUnsavedChanges, saveIndicatorState, saveManually } = useEditorPersistence({
    projectId: activeProject?.id ?? 0,
    fileName: vfs.openFile?.name ?? 'untitled',
    currentContent: vfs.code,
  });

  usePageTitle(activeProject?.name ?? 'Practice');

  const exec = useCodeExecution({ vfs, editorRef, monacoRef });

  const project = useProjectManagement({
    vfs, userId, editorRef, monacoRef,
    activeProject, setActiveProject,
    hasUnsavedChanges, saveManually,
    setTermLines: exec.setTermLines,
  });

  const ai = useAIChat({
    vfs, editorRef, monacoRef,
    activeProject,
    exerciseContext: project.exerciseContext,
  });

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
      if (!(e.target as HTMLElement).closest('.code-tooltip')) {
        setTooltipPos(null); setSelectedText(''); setTooltipContent(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setTooltipPos(null); setSelectedText(''); setTooltipContent(null); }
    };
    const id = setTimeout(() => { document.addEventListener('click', handleClick); document.addEventListener('keydown', handleKey); }, 0);
    return () => { clearTimeout(id); document.removeEventListener('click', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [tooltipPos]);

  const saveRef = useRef(project.saveCurrentProject);
  saveRef.current = project.saveCurrentProject;
  const runRef = useRef(exec.handleRunCode);
  runRef.current = exec.handleRunCode;
  const analyzeRef = useRef(ai.handleAnalyze);
  analyzeRef.current = ai.handleAnalyze;

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); await saveRef.current(); }
      if (ctrl && e.key === 'Enter') { e.preventDefault(); runRef.current(); }
      if (ctrl && e.shiftKey && e.key === 'A') { e.preventDefault(); analyzeRef.current(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleEditorMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addAction({ id: 'explain-code', label: 'Explain Code', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK], run: () => handleExplainRef.current() });
    editor.onDidChangeCursorSelection(() => {
      const sel = editor.getSelection();
      if (sel && !sel.isEmpty()) {
        const txt = editor.getModel()?.getValueInRange(sel) ?? '';
        setSelectedText(txt);
        const pos = editor.getScrolledVisiblePosition(sel.getPosition());
        if (pos) {
          const rect = editor.getDomNode()?.getBoundingClientRect();
          if (rect) setTooltipPos({ top: rect.top + pos.top - 40, left: rect.left + pos.left + 20 });
        }
        setTooltipContent(null);
        setTooltipLoading(false);
      } else {
        setSelectedText(''); setTooltipPos(null); setTooltipContent(null); setTooltipLoading(false);
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tsLanguageService = (monaco.languages as any).typescript;
    if (tsLanguageService?.javascriptDefaults) {
      tsLanguageService.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    }
  }, []);

  return {
    navigate,
    activeProject,
    ...project,
    ...exec,
    ...ai,
    isPanelCollapsed, setIsPanelCollapsed,
    sidebarWidth, setSidebarWidth,
    aiPanelWidth, setAiPanelWidth,
    resizing, resizeStartX, resizeStartWidth,
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
    hasUnsavedChanges, saveIndicatorState,
    handleEditorMount, handleExplainCode,
    fsNodes: vfs.fsNodes, setFsNodes: vfs.setFsNodes,
    fsActiveId: vfs.fsActiveId, setFsActiveId: vfs.setFsActiveId,
    openFile: vfs.openFile, setOpenFile: vfs.setOpenFile,
    code: vfs.code, setCode: vfs.setCode,
    fileContentsRef: vfs.fileContentsRef,
    firstFolder: vfs.firstFolder, filesList: vfs.filesList,
    switchToFile: vfs.switchToFile, handleCodeChange: vfs.handleCodeChange,
    handleNewFile: vfs.handleNewFile, handleRenameFile: vfs.handleRenameFile,
    handleDeleteFile: vfs.handleDeleteFile,
  };
}
