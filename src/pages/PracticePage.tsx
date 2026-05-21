import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { FolderPlus, Bot, Send } from 'lucide-react';
import {
  sendChatMessage, analyzeCodePedagogical, runCode,
  createProject, saveSnapshot, getProjectsByUser, loadEditor,
  getErrorMessage, explainCode,
} from '../services/api';
import type { Language, ExerciseContext, Project as BackendProject } from '../types';
import type { VNode, VFile } from '../types/vfs';
import { uid, detectLang } from '../types/vfs';
import { ExerciseContextPanel } from '../components/practice/ExerciseContextPanel';
import { NewProjectModal } from '../components/editor/NewProjectModal';
import { DeleteProjectModal } from '../components/editor/DeleteProjectModal';
import { SaveIndicatorBar } from '../components/editor/SaveIndicatorBar';
import { useEditorPersistence } from '../hooks/useEditorPersistence';

interface StoredUser { id: number; username: string; email: string; }

interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  content: string;
  quality?: { structure: number; readability: number };
  suggestions?: string[];
  timestamp: number;
}

const FS_STORAGE_KEY = 'codetutor-fs-nodes';
const ACTIVE_PROJECT_KEY = 'codetutor-active-project';

const FILE_EXT_COLORS: Record<string, string> = {
  py: '#3B82F6', java: '#F59E0B', js: '#EAB308',
  ts: '#6366F1', tsx: '#6366F1', jsx: '#EAB308',
  cpp: '#9CA3AF', cs: '#9CA3AF',
};

const LANG_DISPLAY: Record<string, { lang: string; ver: string }> = {
  python: { lang: 'Python', ver: '3.11' },
  java: { lang: 'Java', ver: '17' },
  javascript: { lang: 'JavaScript', ver: 'Node 20' },
  typescript: { lang: 'TypeScript', ver: '5.4' },
  cpp: { lang: 'C++', ver: '20' },
};

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

function getFileExt(filename: string): string {
  return filename.includes('.') ? filename.split('.').pop() ?? '' : '';
}

function getFileDotColor(filename: string): string {
  return FILE_EXT_COLORS[getFileExt(filename)] ?? '#D1D5DB';
}

function AiMessageBubble({ msg }: { msg: ChatMsg }) {
  const isAi = msg.role === 'ai';
  const hasQuality = msg.quality && msg.quality.structure !== undefined;
  const hasSuggestions = msg.suggestions && msg.suggestions.length > 0;

  if (isAi && (hasQuality || hasSuggestions)) {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-[8px]">
          <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
          </div>
          <span className="text-[12px] font-medium text-[#534AB7]">AI Tutor</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] p-[12px_14px] space-y-[10px]">
          {hasQuality && msg.quality && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Code quality</p>
              <div className="flex items-center gap-[10px]">
                <span className="text-[12px] text-[#6B7280] min-w-[80px]">Structure</span>
                <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#534AB7]" style={{ width: `${msg.quality.structure}%` }} />
                </div>
                <span className="text-[12px] font-semibold min-w-[32px] text-right text-[#534AB7]">{msg.quality.structure}%</span>
              </div>
              <div className="flex items-center gap-[10px] mt-[6px]">
                <span className="text-[12px] text-[#6B7280] min-w-[80px]">Readability</span>
                <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${msg.quality.readability}%`, backgroundColor: msg.quality.readability < 70 ? '#F59E0B' : '#534AB7' }} />
                </div>
                <span className="text-[12px] font-semibold min-w-[32px] text-right" style={{ color: msg.quality.readability < 70 ? '#F59E0B' : '#534AB7' }}>{msg.quality.readability}%</span>
              </div>
            </div>
          )}
          {hasQuality && <div className="h-[0.5px] bg-[#F3F4F6]" />}
          {msg.content && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">What your code does</p>
              <p className="text-[12px] text-[#4B5563] leading-relaxed whitespace-pre-wrap">
                {msg.content.split(/(`[^`]+`)/).map((part, i) =>
                  part.startsWith('`') && part.endsWith('`')
                    ? <code key={i} className="bg-[#EEEDFE] text-[#3C3489] rounded-[4px] px-[6px] py-[1px] text-[11px] font-mono">{part.slice(1, -1)}</code>
                    : <span key={i}>{part}</span>
                )}
              </p>
            </div>
          )}
          {hasSuggestions && msg.suggestions && <div className="h-[0.5px] bg-[#F3F4F6]" />}
          {hasSuggestions && msg.suggestions && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Suggestions</p>
              {msg.suggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-[8px] py-[6px] ${i < msg.suggestions!.length - 1 ? 'border-b border-[#F9FAFB]' : ''}`}>
                  <div className="w-[20px] h-[20px] bg-[#534AB7] text-white text-[11px] font-semibold rounded-full flex items-center justify-center shrink-0 mt-[1px]">
                    {i + 1}
                  </div>
                  <span className="text-[12px] text-[#4B5563] leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isAi) {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-[8px]">
          <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
          </div>
          <span className="text-[12px] font-medium text-[#534AB7]">AI Tutor</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] p-[12px_14px]">
          <p className="text-[12px] text-[#4B5563] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-5">
      <div className={`${msg.content === 'Analyzing your code...' ? 'bg-[#F9FAFB] border border-[#E5E7EB] text-[#9CA3AF] text-[11px] rounded-[10px] px-[12px] py-[6px]' : 'bg-[#534AB7] text-white rounded-tl-[10px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-none px-[14px] py-[10px] max-w-[85%] text-[12px]'}`}>
        {msg.content}
      </div>
    </div>
  );
}

export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // VFS
  const [fsNodes, setFsNodes] = useState<VNode[]>(() => {
    try { return JSON.parse(localStorage.getItem(FS_STORAGE_KEY) ?? '[]'); } catch { return []; }
  });
  const [fsActiveId, setFsActiveId] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<{ name: string; content: string; language: Language } | null>(null);
  const [code, setCode] = useState('');
  const fileContentsRef = useRef<Record<string, string>>({});

  // Panel resize
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [aiPanelWidth, setAiPanelWidth] = useState(320);
  const resizing = useRef<'sidebar' | 'ai' | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Inline file create
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [creatingFileName, setCreatingFileName] = useState('');
  const creatingInputRef = useRef<HTMLInputElement>(null);

  // Inline file rename
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Monaco refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Tooltip for code explanation
  const [selectedText, setSelectedText] = useState('');
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipLoading, setTooltipLoading] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const handleExplainRef = useRef<() => void>(() => {});

  // Projects
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

  // Terminal
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'Terminal' | 'Output' | 'Problems'>('Terminal');
  const [termLines, setTermLines] = useState<{ text: string; type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' | 'input' }[]>([]);
  const [, setTerminalRunning] = useState(false);

  // AI Chat
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const projectId = activeProject?.id ?? 0;
  const fileName = openFile?.name ?? 'untitled';

  const {
    hasUnsavedChanges,
    saveIndicatorState,
    saveManually,
  } = useEditorPersistence({ projectId, fileName, currentContent: code });

  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, aiLoading]);

  // Load saved projects
  useEffect(() => {
    if (user.id) {
      getProjectsByUser(user.id).then(setSavedProjects).catch(() => {});
    }
  }, [user.id]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Create exercise project from query params
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
      const folderId = uid();
      const lang = ctx.language.toLowerCase() as Language;
      const fileName = `main.${lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'cpp' ? 'cpp' : lang === 'typescript' ? 'ts' : 'js'}`;
      const content = `// Exercise: ${ctx.exercisePrompt}\n\n`;
      fileContentsRef.current = {};
      const nodes: VNode[] = [
        { id: folderId, type: 'folder', name: project.name, parentId: null, open: true },
        { id: uid(), type: 'file', name: fileName, content, language: lang, parentId: folderId },
      ];
      setFsNodes(nodes);
      localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(nodes));
      setActiveProject(project);
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
      setOpenFile({ name: fileName, content, language: lang });
      setCode(content);
      setFsActiveId(nodes[1].id);
      try { await saveSnapshot({ content, versionLabel: 'Initial exercise code', projectId: project.id }); } catch {}
      try {
        const projects = await getProjectsByUser(user.id);
        setSavedProjects(projects);
      } catch {}
    } catch (err) {
      console.error('Auto-create exercise project failed:', err);
    } finally {
      setIsCreatingProject(false);
    }
  }, [user.id]);

  useEffect(() => {
    const raw = searchParams.get('exercise');
    if (!raw) return;
    try {
      const ctx = JSON.parse(decodeURIComponent(raw)) as ExerciseContext;
      setExerciseContext(ctx);
      autoCreateExerciseProject(ctx);
    } catch {}
  }, []);

  // File ops
  const switchToFile = useCallback((fileId: string) => {
    if (fsActiveId) {
      fileContentsRef.current[fsActiveId] = code;
    }
    const node = fsNodes.find(n => n.id === fileId);
    if (node && node.type === 'file') {
      const cached = fileContentsRef.current[fileId];
      const content = cached !== undefined ? cached : node.content;
      setOpenFile({ name: node.name, content, language: node.language });
      setCode(content);
    }
    setFsActiveId(fileId);
  }, [fsActiveId, code, fsNodes]);

  // Save
  const saveCurrentProject = useCallback(async () => {
    if (!activeProject || backupSaving) return;
    await saveManually();
    setBackupSaving(true);
    try {
      if (fsActiveId) {
        fileContentsRef.current[fsActiveId] = code;
      }
      const updatedNodes = fsNodes.map(n =>
        n.id === fsActiveId && n.type === 'file' ? { ...n, content: code } : n
      );
      setFsNodes(updatedNodes);
      localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(updatedNodes));
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
  }, [activeProject, backupSaving, saveManually, fsNodes, fsActiveId, code]);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        await saveCurrentProject();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveCurrentProject]);

  // Create project
  const handleCreateProject = async (name: string, projectLanguage: string) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (activeProject && hasUnsavedChanges) {
        await saveCurrentProject();
      }
      fileContentsRef.current = {};
      const newProject = await createProject({
        name, description: name, programmingLanguage: projectLanguage as Language, userId: user.id,
      });
      setOpenFile(null);
      setCode('');
      setFsActiveId(null);
      setTermLines([]);
      const folderId = uid();
      const newNodes: VNode[] = [{ id: folderId, type: 'folder', name, parentId: null, open: true }];
      setFsNodes(newNodes);
      localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(newNodes));
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

  // Load project
  const handleLoadSavedProject = async (project: BackendProject) => {
    if (activeProject && hasUnsavedChanges) {
      await saveCurrentProject();
    }
    fileContentsRef.current = {};
    setOpenFile(null);
    setCode('');
    setFsActiveId(null);
    setTermLines([]);
    setLoadingProject(true);
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
    setFsNodes(projectNodes);
    localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(projectNodes));
    setActiveProject(project);
    localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
    setLoadingProject(false);
    setToast('Project loaded');
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    localStorage.removeItem(`codetutor-project-${deleteTarget.id}-nodes`);
    setSavedProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast('Project deleted');
  };

  // Try to parse AI response as structured JSON
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

  // Analysis
  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) return;
    const now = Date.now();
    setAiMessages(prev => [...prev, { id: uid(), role: 'user', content: 'Analyzing your code...', timestamp: now }]);
    setAiLoading(true);
    try {
      const result = await analyzeCodePedagogical({
        code, language: openFile?.language ?? 'python', projectDescription: activeProject?.name ?? 'Project',
        exerciseContext: exerciseContext ? { prompt: exerciseContext.exercisePrompt, lessonTitle: exerciseContext.lessonTitle, level: exerciseContext.level } : undefined,
      });
      let fullContent = result.summary;
      if (result.hasErrors && result.errorHint) {
        fullContent += `\n\nError detected: ${result.errorHint}`;
      }
      const structured = parseStructuredResponse(fullContent);
      const aiMsg: ChatMsg = {
        id: uid(), role: 'ai', content: structured.content, timestamp: Date.now(),
        quality: structured.quality || result.quality,
        suggestions: structured.suggestions || result.suggestions.map(s => `${s.title}: ${s.description}`),
      };
      setAiMessages(prev => [...prev, aiMsg]);
      if (result.hasErrors && editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelMarkers(model, 'syntax', []);
          const markers: any[] = [];
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
              const totalLines = (code.match(/\n/g) || []).length + 1;
              markers.push({
                startLineNumber: 1, startColumn: 1, endLineNumber: totalLines, endColumn: 1000,
                message: result.errorHint,
                severity: monacoRef.current.MarkerSeverity.Error,
              });
            }
          }
          monacoRef.current.editor.setModelMarkers(model, 'syntax', markers);
        }
      }
    } catch {
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Could not analyze your code right now. Please try again.', timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  }, [code, openFile, activeProject, exerciseContext]);

  // AI send
  const handleAiSend = useCallback(async () => {
    if (!aiInput.trim() || aiLoading) return;
    const text = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { id: uid(), role: 'user', content: text, timestamp: Date.now() }]);
    setAiLoading(true);
    try {
      const history = aiMessages.slice(-10).map(m => ({ role: m.role === 'ai' ? 'ai' as const : 'user' as const, content: m.content }));
      const res = await sendChatMessage({ message: text, history, currentCode: code, language: openFile?.language });
      const cleanMsg = res.message.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: cleanMsg, timestamp: Date.now() }]);
    } catch {
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Connection error. Please try again.', timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMessages, code, openFile]);

  // Run code
  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;
    setConsoleOpen(true);
    setConsoleTab('Output');
    setTermLines(prev => [...prev, { text: `> Ejecutando...`, type: 'info' }]);
    setTerminalRunning(true);
    try {
      const res = await runCode({ code, language: openFile?.language ?? 'python' });
      const next = [...termLines, { text: `> Ejecutando...`, type: 'info' as const }];
      if (res.stdout) { res.stdout.split('\n').filter(Boolean).forEach(l => next.push({ text: l, type: 'output' as const })); }
      if (res.stderr) {
        res.stderr.split('\n').filter(Boolean).forEach(l => next.push({ text: l, type: 'error' as const }));
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            const markers: any[] = [];
            res.stderr.split('\n').forEach(line => {
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
          }
        }
      }
      if (!res.stdout && !res.stderr) { next.push({ text: '(no output)', type: 'output' as const }); }
      next.push({ text: res.exitCode === 0 ? 'Process finished with exit code 0' : `Process finished with exit code ${res.exitCode}`, type: res.exitCode === 0 ? 'output' as const : 'error' as const });
      setTermLines(next);
    } catch {
      setTermLines(prev => [...prev, { text: 'Error executing code', type: 'error' as const }]);
    } finally {
      setTerminalRunning(false);
    }
  }, [code, openFile, termLines]);

  // Explain code via tooltip
  const handleExplainCode = useCallback(async () => {
    const text = selectedText;
    if (!text || !openFile) return;
    setTooltipLoading(true);
    try {
      const res = await explainCode({ selectedText: text, language: openFile.language, context: code });
      setTooltipContent(res.explanation);
    } catch {
      setTooltipContent('Failed to get explanation.');
    } finally {
      setTooltipLoading(false);
    }
  }, [selectedText, openFile, code]);

  useEffect(() => { handleExplainRef.current = handleExplainCode; }, [handleExplainCode]);

  const handleNewCode = useCallback((val: string | undefined) => {
    const newVal = val ?? '';
    setCode(newVal);
    if (fsActiveId) {
      fileContentsRef.current[fsActiveId] = newVal;
    }
  }, [fsActiveId]);

  const disp = LANG_DISPLAY[openFile?.language ?? 'python'] ?? { lang: 'Python', ver: '' };

  // Save fsNodes to localStorage when they change
  // Tooltip: click outside or Escape to dismiss
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

  useEffect(() => { localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(fsNodes)); }, [fsNodes]);

  // Update openFile when fsActiveId changes (uses cached content)
  useEffect(() => {
    if (!fsActiveId) { setOpenFile(null); return; }
    const node = fsNodes.find(n => n.id === fsActiveId);
    if (node && node.type === 'file') {
      const cached = fileContentsRef.current[fsActiveId];
      const content = cached !== undefined ? cached : node.content;
      setOpenFile({ name: node.name, content, language: node.language });
      setCode(content);
    }
  }, [fsActiveId, fsNodes]);

  const firstFolder = fsNodes.find(n => n.type === 'folder' && n.parentId === null);
  const filesList = fsNodes.filter(n => n.type === 'file' && n.parentId === firstFolder?.id) as VFile[];

  return (
    <div className="h-screen w-screen grid overflow-hidden bg-white" style={{ gridTemplateColumns: `${sidebarWidth}px 1fr ${aiPanelWidth}px` }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[200] bg-[#111827] text-white text-[12px] px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <NewProjectModal
        open={isNewProjectModalOpen}
        onClose={() => { setIsNewProjectModalOpen(false); setModalError(null); }}
        onCreate={handleCreateProject}
        loading={modalLoading}
        error={modalError}
      />

      <DeleteProjectModal
        open={!!deleteTarget}
        projectName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProject}
      />

      {/* ═══ COLUMN 1 — SIDEBAR ═══ */}
      <div className="bg-white border-r border-[#E5E7EB] flex flex-col overflow-hidden p-3 relative">
        <div onClick={() => navigate('/')} className="flex items-center gap-[8px] px-[12px] pt-[12px] pb-[8px] cursor-pointer border-b border-[#E5E7EB] mb-[8px] hover:opacity-85 transition-opacity">
          <div className="w-[24px] h-[24px] bg-[#534AB7] rounded-[6px] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span className="text-[13px] font-medium">
            <span className="text-[#111827]">AI</span>
            <span className="text-[#534AB7]">Code</span>
            <span className="text-[#111827]">Tutor</span>
          </span>
        </div>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="w-full flex items-center gap-[10px] bg-white border border-[#E5E7EB] rounded-[10px] px-[14px] py-[10px] text-[13px] font-medium text-[#111827] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New project
        </button>

        <div className="flex-1 overflow-y-auto mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Current</p>

          {activeProject && (
            <div className="flex items-center gap-[8px] bg-[#EEEDFE] rounded-[8px] px-[10px] py-[8px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[13px] font-medium text-[#3C3489] truncate">{activeProject.name}</span>
            </div>
          )}

          {!activeProject && (
            <div className="text-center py-6">
              <FolderPlus className="w-8 h-8 text-[#E5E7EB] mx-auto mb-2" />
              <p className="text-xs text-[#9CA3AF]">Create a project to start</p>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-[#534AB7] text-white text-xs rounded-lg hover:opacity-90 cursor-pointer"
              >
                + New Project
              </button>
            </div>
          )}

          <div className="mt-[4px]">
            {filesList.map((f) => {
              const isActive = fsActiveId === f.id;
              const isRenaming = renamingFileId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    if (!isRenaming) {
                      switchToFile(f.id);
                    }
                  }}
                  onDoubleClick={() => {
                    setRenamingFileId(f.id);
                    setRenamingFileName(f.name);
                  }}
                  className={`flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] ${isRenaming ? '' : 'cursor-pointer'} transition-colors ${isActive ? 'bg-[#EEEDFE]' : 'hover:bg-[#F9FAFB]'}`}
                  style={{ paddingLeft: '22px' }}
                >
                  <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(isRenaming ? renamingFileName : f.name) }} />
                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renamingFileName}
                      onChange={e => setRenamingFileName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const name = renamingFileName.trim();
                          if (name) {
                            setFsNodes(prev => prev.map(n =>
                              n.id === renamingFileId && n.type === 'file'
                                ? { ...n, name, language: detectLang(name) }
                                : n
                            ));
                            if (fsActiveId === renamingFileId && openFile) {
                              setOpenFile(prev => prev ? { ...prev, name, language: detectLang(name) } : null);
                            }
                          }
                          setRenamingFileId(null);
                          setRenamingFileName('');
                        } else if (e.key === 'Escape') {
                          setRenamingFileId(null);
                          setRenamingFileName('');
                        }
                      }}
                      onBlur={() => {
                        const name = renamingFileName.trim();
                        if (name && renamingFileId) {
                          setFsNodes(prev => prev.map(n =>
                            n.id === renamingFileId && n.type === 'file'
                              ? { ...n, name, language: detectLang(name) }
                              : n
                          ));
                          if (fsActiveId === renamingFileId && openFile) {
                            setOpenFile(prev => prev ? { ...prev, name, language: detectLang(name) } : null);
                          }
                        }
                        setRenamingFileId(null);
                        setRenamingFileName('');
                      }}
                      className="flex-1 bg-transparent text-[13px] text-[#111827] outline-none border-b border-[#534AB7]"
                    />
                  ) : (
                    <span className={`text-[13px] truncate ${isActive ? 'font-medium text-[#111827]' : 'text-[#9CA3AF]'}`}>{f.name}</span>
                  )}
                </div>
              );
            })}
            {isCreatingFile && (
              <div className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px]" style={{ paddingLeft: '22px' }}>
                <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(creatingFileName) || '#D1D5DB' }} />
                <input
                  ref={creatingInputRef}
                  value={creatingFileName}
                  onChange={e => setCreatingFileName(e.target.value)}
                  placeholder="filename.py"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const name = creatingFileName.trim();
                      if (name) {
                        const lang = detectLang(name);
                        const node: VFile = { id: uid(), type: 'file', name, content: '', language: lang, parentId: firstFolder?.id ?? null };
                        setFsNodes(prev => [...prev, node]);
                        fileContentsRef.current[node.id] = '';
                        setFsActiveId(node.id);
                        switchToFile(node.id);
                      }
                      setIsCreatingFile(false);
                      setCreatingFileName('');
                    } else if (e.key === 'Escape') {
                      setIsCreatingFile(false);
                      setCreatingFileName('');
                    }
                  }}
                  onBlur={() => {
                    const name = creatingFileName.trim();
                    if (name) {
                      const lang = detectLang(name);
                      const node: VFile = { id: uid(), type: 'file', name, content: '', language: lang, parentId: firstFolder?.id ?? null };
                      setFsNodes(prev => [...prev, node]);
                      fileContentsRef.current[node.id] = '';
                      setFsActiveId(node.id);
                      switchToFile(node.id);
                    }
                    setIsCreatingFile(false);
                    setCreatingFileName('');
                  }}
                  className="flex-1 bg-transparent text-[13px] text-[#111827] outline-none border-b border-[#534AB7]"
                />
              </div>
            )}
          </div>

          {/* Inline create file */}
          {activeProject && (
            <div
              onClick={() => {
                setIsCreatingFile(true);
                setCreatingFileName('');
                setTimeout(() => creatingInputRef.current?.focus(), 20);
              }}
              className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] cursor-pointer hover:bg-[#F9FAFB] transition-colors mt-1"
              style={{ paddingLeft: '22px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="text-[12px] text-[#9CA3AF]">New file</span>
            </div>
          )}
        </div>

        <div className="h-[0.5px] bg-[#E5E7EB] my-3" />

        <div className="overflow-y-auto max-h-[180px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">Saved projects</p>
          {savedProjects.length === 0 && <p className="text-[11px] text-[#9CA3AF] px-1 py-1">No saved projects yet</p>}
          {savedProjects.map((p) => {
            const isActive = activeProject?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => !isActive && handleLoadSavedProject(p)}
                className={`flex items-center gap-[8px] px-[8px] py-[6px] rounded-[4px] cursor-pointer transition-colors ${isActive ? 'bg-[#EEEDFE]' : 'hover:bg-[#F9FAFB]'}`}
              >
                <div className={`w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 ${isActive ? 'bg-[#534AB7] border border-[#534AB7]' : 'bg-white border border-[#D1D5DB]'}`}>
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>
                <span className={`text-[13px] truncate ${isActive ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}>{p.name}</span>
                {!isActive && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}
                    className="ml-auto text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div
          onMouseDown={e => {
            e.preventDefault();
            resizing.current = 'sidebar';
            resizeStartX.current = e.clientX;
            resizeStartWidth.current = sidebarWidth;
            const onMove = (ev: MouseEvent) => {
              if (resizing.current !== 'sidebar') return;
              const w = Math.max(160, Math.min(360, resizeStartWidth.current + ev.clientX - resizeStartX.current));
              setSidebarWidth(w);
            };
            const onUp = () => {
              resizing.current = null;
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
          className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#534AB7]/30 transition-colors z-10"
        />
      </div>

      {/* ═══ COLUMN 2 — EDITOR ═══ */}
      <div className="flex flex-col overflow-hidden bg-white">
        {exerciseContext && !isCreatingProject && (
          <ExerciseContextPanel context={exerciseContext} onDismiss={() => { setExerciseContext(null); setIsPanelCollapsed(false); }} isCollapsed={isPanelCollapsed} onToggleCollapse={() => setIsPanelCollapsed(p => !p)} />
        )}

        {/* Tab bar */}
        <div className="h-[40px] bg-white border-b border-[#E5E7EB] flex items-center shrink-0 px-3">
          <div className="flex items-center h-full flex-1 overflow-x-auto">
            {filesList.map((f) => {
              const isActive = fsActiveId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => { switchToFile(f.id); }}
                  className={`flex items-center gap-[6px] px-[14px] h-full text-[12px] cursor-pointer transition-colors shrink-0 ${
                    isActive ? 'bg-white border-b-2 border-[#534AB7] text-[#111827] font-medium' : 'text-[#9CA3AF] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(f.name) }} />
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  {hasUnsavedChanges && isActive && <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B] shrink-0" />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-[8px] ml-auto shrink-0">
            <div className="flex items-center gap-[6px] bg-[#EEEDFE] text-[#3C3489] rounded-[6px] px-[10px] py-[3px]">
              <span className="text-[11px] font-medium">{disp.lang}</span>
              <svg width="1" height="12" viewBox="0 0 1 12" fill="#3C3489" opacity="0.3"><rect width="1" height="12" rx="0.5"/></svg>
              <span className="text-[11px] text-[#9CA3AF]">{disp.ver}</span>
            </div>
            <button onClick={handleRunCode} className="flex items-center gap-[6px] bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] rounded-[8px] px-[14px] py-[5px] text-[12px] font-medium cursor-pointer hover:bg-[#D1FAE5] transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#0F6E56"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run
            </button>
          </div>
        </div>

        {/* Save indicator bar */}
        <SaveIndicatorBar state={saveIndicatorState} />

        {/* Editor body */}
        <div className="flex-1 flex overflow-hidden relative">
          {loadingProject && (
            <div className="absolute inset-0 z-10 bg-white/80 flex flex-col items-center justify-center">
              <svg className="w-8 h-8 animate-spin text-[#534AB7] mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              <p className="text-[13px] text-[#4B5563]">Loading project...</p>
            </div>
          )}
          {!openFile ? (
            <div className="flex-1 flex items-center justify-center bg-white select-none">
              <div className="text-center">
                <p className="text-5xl mb-4 opacity-20 text-[#9CA3AF]">{'</>'}</p>
                <p className="text-sm text-[#9CA3AF]">Open a file from the explorer to start</p>
                <p className="text-xs mt-2 text-[#C4C4C4]">Ctrl+S to save</p>
              </div>
            </div>
          ) : (
            <MonacoEditor
              height="100%"
              width="100%"
              language={LANG_MAP[openFile.language] ?? 'plaintext'}
              value={code}
              onChange={handleNewCode}
              onMount={(editor, monaco) => {
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
              }}
              theme="vs"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.7,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
                lineNumbers: 'on',
                padding: { top: 14 },
                wordWrap: 'on',
                glyphMargin: false,
                folding: false,
                lineNumbersMinChars: 3,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          )}
          {tooltipPos && selectedText && (
            <div
              ref={tooltipRef}
              className="code-tooltip fixed z-[1000] bg-[#1E1E2E] text-white rounded-[8px] px-[12px] py-[8px] max-w-[280px] text-[12px] leading-relaxed shadow-lg"
              style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateX(-50%)' }}
            >
              {tooltipLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  <span className="text-[11px] text-[#9CA3AF]">Explaining...</span>
                </div>
              ) : tooltipContent !== null ? (
                <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{tooltipContent}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#9CA3AF]">Press </span>
                  <kbd className="bg-white/10 rounded-[3px] px-[5px] py-[1px] text-[10px] font-mono">Ctrl+K</kbd>
                  <span className="text-[11px] text-[#9CA3AF]"> to explain</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="h-[22px] bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center px-3 text-[11px] text-[#9CA3AF] gap-4 shrink-0">
          <span className="flex items-center gap-[4px] text-[#0F6E56]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#5DCAA5]" />
            Connected
          </span>
          {hasUnsavedChanges ? (
            <span className="text-[#F59E0B] font-medium">● Unsaved</span>
          ) : (
            <span className="text-[#0F6E56] font-medium">✓ Saved</span>
          )}
          <span className="capitalize">{openFile?.language ?? 'plaintext'}</span>
          <div className="ml-auto flex items-center gap-3">
            <span>UTF-8</span>
            <button
              onClick={saveCurrentProject}
              disabled={!hasUnsavedChanges || backupSaving}
              className="flex items-center gap-1 bg-[#534AB7] text-white rounded-[6px] px-[10px] py-[2px] text-[10px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed border-none"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save
            </button>
          </div>
        </div>

        {/* Console */}
        {consoleOpen && (
          <div className="h-[150px] bg-[#FAFAFA] border-t border-[#E5E7EB] flex flex-col shrink-0">
            <div className="h-[32px] bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center px-[14px] gap-4 shrink-0">
              <button onClick={() => setConsoleTab('Terminal')} className={`text-[12px] cursor-pointer ${consoleTab === 'Terminal' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Terminal</button>
              <button onClick={() => setConsoleTab('Output')} className={`text-[12px] cursor-pointer ${consoleTab === 'Output' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Output</button>
              <button onClick={() => setConsoleTab('Problems')} className={`text-[12px] cursor-pointer ${consoleTab === 'Problems' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Problems</button>
              <span className="text-[11px] text-[#9CA3AF] ml-auto flex items-center gap-1 cursor-pointer hover:text-[#6B7280]" onClick={() => setTermLines([])}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                Clear
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-[14px] py-[10px] font-mono text-[12px] leading-relaxed">
              {termLines.length === 0 && consoleTab !== 'Problems' && <span className="text-[#9CA3AF]">Run your code to see output here...</span>}
              {consoleTab === 'Problems' && <span className="text-[#9CA3AF]">No problems detected</span>}
              {consoleTab !== 'Problems' && termLines.map((line, i) => (
                <div key={i} className={
                  line.type === 'error' ? 'text-[#DC2626]'
                  : line.type === 'info' ? 'text-[#534AB7]'
                  : line.type === 'stdout' ? 'text-[#059669]'
                  : line.type === 'output' ? 'text-[#059669]'
                  : 'text-[#9CA3AF]'
                }>{line.type === 'output' || line.type === 'stdout' ? `  ${line.text}` : line.text}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ COLUMN 3 — AI PANEL ═══ */}
      <div className="bg-white border-l border-[#E5E7EB] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="h-[44px] border-b border-[#E5E7EB] flex items-center px-[14px] shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-[8px] h-[8px] rounded-full bg-[#5DCAA5]" />
            <span className="text-[13px] font-medium text-[#111827]">AI Tutor</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className={`flex items-center gap-1 border ${showHistory ? 'bg-[#EEEDFE] border-[#534AB7] text-[#534AB7]' : 'border-[#E5E7EB] bg-transparent text-[#6B7280]'} rounded-[8px] px-[12px] py-[5px] text-[12px] font-medium cursor-pointer hover:bg-[#F9FAFB]`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {showHistory ? 'Chat' : 'History'}
            </button>
            <button onClick={handleAnalyze} disabled={!code.trim()} className="flex items-center gap-1 bg-[#534AB7] text-white rounded-[8px] px-[12px] py-[5px] text-[12px] font-medium cursor-pointer hover:opacity-90 border-none disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
              Analyze
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-[14px] py-[14px]">
          {showHistory && (
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-[#111827]">Conversation history</p>
              {aiMessages.length === 0 && <p className="text-[11px] text-[#9CA3AF]">No previous conversations.</p>}
              {aiMessages.map(msg => (
                <div key={msg.id} className={`p-2 rounded-lg text-[11px] ${msg.role === 'ai' ? 'bg-[#F9FAFB] border border-[#E5E7EB]' : 'bg-[#EEEDFE]'}`}>
                  <span className="font-medium text-[#534AB7]">{msg.role === 'ai' ? 'AI' : 'You'}: </span>
                  <span className="text-[#4B5563]">{msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content}</span>
                </div>
              ))}
            </div>
          )}
          {!showHistory && (
            <>
              {aiMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEEDFE] flex items-center justify-center">
                    <Bot className="w-6 h-6 text-[#534AB7]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#111827] font-medium">Hi, I'm your AI tutor</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Ask a question or analyze your code.</p>
                  </div>
                </div>
              )}
              {aiMessages.map(msg => <AiMessageBubble key={msg.id} msg={msg} />)}
              {aiLoading && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-[8px]">
                    <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
                    </div>
                    <span className="text-[12px] font-medium text-[#534AB7]">AI Tutor</span>
                  </div>
                  <div className="bg-white border border-[#E5E7EB] rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] px-[14px] py-[10px] flex gap-[4px]">
                    <span className="w-[6px] h-[6px] bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-[6px] h-[6px] bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-[6px] h-[6px] bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={aiBottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        {!showHistory && (
          <>
            <div className="px-3 pb-2 pt-1">
              <div className="flex flex-wrap gap-[6px] mb-[10px]">
                <button onClick={() => setAiInput('What should I do next?')} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">
                  Next step?
                </button>
                <button onClick={() => setAiInput('Explain what my code does')} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">
                  Explain this
                </button>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] px-3 py-3">
              <div className="flex items-center gap-[8px]">
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
                  placeholder="Ask about your code..."
                  rows={1}
                  className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] px-[12px] py-[8px] text-[12px] text-[#111827] placeholder-[#9CA3AF] outline-none resize-none min-h-[36px] max-h-[100px] focus:border-[#534AB7] focus:bg-white"
                />
                <button
                  onClick={handleAiSend}
                  disabled={!aiInput.trim() || aiLoading}
                  className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 cursor-pointer border-none ${
                    aiInput.trim() ? 'bg-[#534AB7] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
        <div
          onMouseDown={e => {
            e.preventDefault();
            resizing.current = 'ai';
            resizeStartX.current = e.clientX;
            resizeStartWidth.current = aiPanelWidth;
            const onMove = (ev: MouseEvent) => {
              if (resizing.current !== 'ai') return;
              const w = Math.max(240, Math.min(480, resizeStartWidth.current - (ev.clientX - resizeStartX.current)));
              setAiPanelWidth(w);
            };
            const onUp = () => {
              resizing.current = null;
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
          className="absolute left-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#534AB7]/30 transition-colors z-10"
        />
      </div>

      {/* Loading overlay */}
      {isCreatingProject && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 gap-3">
          <svg className="animate-spin h-6 w-6 text-[#534AB7]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          <p className="text-[#534AB7] text-sm font-medium">Preparing your exercise...</p>
        </div>
      )}

      {/* Mobile warning */}
      <div className="md:hidden fixed inset-0 bg-white z-[100] flex items-center justify-center p-8">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto mb-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <p className="text-[15px] font-medium text-[#111827]">Desktop required</p>
          <p className="text-[13px] text-[#4B5563] mt-2">Please use a desktop browser for the code editor.</p>
        </div>
      </div>
    </div>
  );
}
