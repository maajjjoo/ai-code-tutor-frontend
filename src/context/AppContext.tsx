import { createContext, useContext, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ProjectData, GuideStep, FunctionExplanation, Language, EditorAction, ChatMessage, FSNode, FileNode, FolderNode } from '../types';
import { Stack, Queue, LinkedList, HashMap } from '../dataStructures';
import { generateGuide as apiGenerateGuide, analyzeCode as apiAnalyzeCode, sendChatMessage as apiSendChatMessage } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function detectLanguage(name: string): Language {
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.cpp') || name.endsWith('.cc') || name.endsWith('.h')) return 'cpp';
  return 'javascript';
}

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  currentProject: ProjectData | null;
  code: string;
  language: Language;
  guideSteps: GuideStep[];
  explanations: FunctionExplanation[];
  suggestions: string[];
  isAnalyzing: boolean;
  isGeneratingGuide: boolean;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  // Virtual file system
  fsNodes: FSNode[];
  activeFileId: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_GUIDE_STEPS'; payload: GuideStep[] }
  | { type: 'SET_PROJECT_TITLE'; payload: string }
  | { type: 'TOGGLE_STEP'; payload: string }
  | { type: 'SET_ANALYSIS'; payload: { explanations: FunctionExplanation[]; suggestions: string[] } }
  | { type: 'DISMISS_SUGGESTION'; payload: number }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_GENERATING_GUIDE'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'FS_ADD_NODE'; payload: FSNode }
  | { type: 'FS_IMPORT_FILE'; payload: FileNode }
  | { type: 'FS_DELETE_NODE'; payload: string }
  | { type: 'FS_RENAME_NODE'; payload: { id: string; name: string } }
  | { type: 'FS_TOGGLE_FOLDER'; payload: string }
  | { type: 'FS_SET_ACTIVE'; payload: string }
  | { type: 'FS_UPDATE_FILE_CONTENT'; payload: { id: string; content: string } }
  | { type: 'NEW_PROJECT' };

const initialState: AppState = {
  currentProject: null,
  code: '',
  language: 'javascript',
  guideSteps: [],
  explanations: [],
  suggestions: [],
  isAnalyzing: false,
  isGeneratingGuide: false,
  chatMessages: [],
  isChatLoading: false,
  fsNodes: [],
  activeFileId: null,
};

function deleteNodeAndChildren(nodes: FSNode[], id: string): FSNode[] {
  const toDelete = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach((n) => {
      if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
        toDelete.add(n.id);
        changed = true;
      }
    });
  }
  return nodes.filter((n) => !toDelete.has(n.id));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CODE': {
      // Also sync content into the active file node
      const updated = state.activeFileId
        ? state.fsNodes.map((n) => n.id === state.activeFileId && n.type === 'file' ? { ...n, content: action.payload } : n)
        : state.fsNodes;
      return { ...state, code: action.payload, fsNodes: updated };
    }
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_GUIDE_STEPS':
      return { ...state, guideSteps: action.payload };
    case 'SET_PROJECT_TITLE':
      return {
        ...state,
        currentProject: state.currentProject
          ? { ...state.currentProject, name: action.payload }
          : { name: action.payload, description: '', language: state.language, code: state.code, guideSteps: state.guideSteps },
      };
    case 'TOGGLE_STEP':
      return { ...state, guideSteps: state.guideSteps.map((s) => s.id === action.payload ? { ...s, completed: !s.completed } : s) };
    case 'SET_ANALYSIS':
      return { ...state, explanations: action.payload.explanations, suggestions: action.payload.suggestions };
    case 'DISMISS_SUGGESTION':
      return { ...state, suggestions: state.suggestions.filter((_, i) => i !== action.payload) };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_GENERATING_GUIDE':
      return { ...state, isGeneratingGuide: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CHAT_LOADING':
      return { ...state, isChatLoading: action.payload };
    case 'FS_ADD_NODE':
      return { ...state, fsNodes: [...state.fsNodes, action.payload] };
    case 'FS_IMPORT_FILE': {
      const node = action.payload;
      return {
        ...state,
        fsNodes: [...state.fsNodes, node],
        activeFileId: node.id,
        code: node.content,
        language: node.language,
      };
    }
    case 'FS_DELETE_NODE': {
      const remaining = deleteNodeAndChildren(state.fsNodes, action.payload);
      const activeStillExists = remaining.some((n) => n.id === state.activeFileId);
      return { ...state, fsNodes: remaining, activeFileId: activeStillExists ? state.activeFileId : null, code: activeStillExists ? state.code : '' };
    }
    case 'FS_RENAME_NODE':
      return { ...state, fsNodes: state.fsNodes.map((n) => n.id === action.payload.id ? { ...n, name: action.payload.name } : n) };
    case 'FS_TOGGLE_FOLDER':
      return { ...state, fsNodes: state.fsNodes.map((n) => n.id === action.payload && n.type === 'folder' ? { ...n, isOpen: !(n as FolderNode).isOpen } : n) };
    case 'FS_SET_ACTIVE': {
      const file = state.fsNodes.find((n) => n.id === action.payload && n.type === 'file') as FileNode | undefined;
      if (!file) return state;
      return { ...state, activeFileId: action.payload, code: file.content, language: file.language };
    }
    case 'FS_UPDATE_FILE_CONTENT':
      return { ...state, fsNodes: state.fsNodes.map((n) => n.id === action.payload.id && n.type === 'file' ? { ...n, content: action.payload.content } : n) };
    case 'NEW_PROJECT':
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  setCode: (code: string) => void;
  setLanguage: (lang: Language) => void;
  generateGuide: (description: string) => Promise<void>;
  triggerAnalysis: (code: string) => Promise<void>;
  toggleStepComplete: (stepId: string) => void;
  dismissSuggestion: (index: number) => void;
  saveSnapshot: () => void;
  undoLastAction: () => void;
  newProject: () => void;
  sendChatMessage: (message: string) => Promise<void>;
  // File system actions
  createFile: (name: string, parentId: string | null) => void;
  createFolder: (name: string, parentId: string | null) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  toggleFolder: (id: string) => void;
  openFile: (id: string) => void;
  importFile: (node: FileNode) => void;
  importFolder: (node: FolderNode) => void;
  explanationMap: HashMap<string, FunctionExplanation>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const analysisQueue = useRef(new Queue<string>());
  const codeHistory = useRef(new LinkedList<string>());
  const actionStack = useRef(new Stack<EditorAction>());
  const explanationMap = useRef(new HashMap<string, FunctionExplanation>());
  const isProcessingQueue = useRef(false);

  const setCode = (code: string) => dispatch({ type: 'SET_CODE', payload: code });
  const setLanguage = (lang: Language) => dispatch({ type: 'SET_LANGUAGE', payload: lang });

  const generateGuide = async (description: string) => {
    dispatch({ type: 'SET_GENERATING_GUIDE', payload: true });
    try {
      const response = await apiGenerateGuide(description, state.language);
      dispatch({ type: 'SET_GUIDE_STEPS', payload: response.steps });
      dispatch({ type: 'SET_PROJECT_TITLE', payload: response.projectTitle });
    } finally {
      dispatch({ type: 'SET_GENERATING_GUIDE', payload: false });
    }
  };

  const processAnalysisQueue = async (language: Language, description: string) => {
    if (isProcessingQueue.current) return;
    isProcessingQueue.current = true;
    dispatch({ type: 'SET_ANALYZING', payload: true });
    while (!analysisQueue.current.isEmpty()) {
      const code = analysisQueue.current.dequeue();
      if (code !== undefined) {
        try {
          const result = await apiAnalyzeCode(code, language, description);
          explanationMap.current.clear();
          result.explanations.forEach((exp) => explanationMap.current.set(exp.functionName, exp));
          dispatch({ type: 'SET_ANALYSIS', payload: { explanations: result.explanations, suggestions: result.suggestions } });
        } catch { /* ignore */ }
      }
    }
    isProcessingQueue.current = false;
    dispatch({ type: 'SET_ANALYZING', payload: false });
  };

  const triggerAnalysis = async (code: string) => {
    analysisQueue.current.enqueue(code);
    await processAnalysisQueue(state.language, state.currentProject?.description ?? '');
  };

  const toggleStepComplete = (stepId: string) => {
    actionStack.current.push({ type: 'STEP_TOGGLE', payload: stepId, timestamp: Date.now() });
    dispatch({ type: 'TOGGLE_STEP', payload: stepId });
  };

  const dismissSuggestion = (index: number) => {
    actionStack.current.push({ type: 'SUGGESTION_DISMISS', payload: index, timestamp: Date.now() });
    dispatch({ type: 'DISMISS_SUGGESTION', payload: index });
  };

  const saveSnapshot = () => { codeHistory.current.append(state.code); };

  const undoLastAction = () => {
    const last = actionStack.current.pop();
    if (last?.type === 'STEP_TOGGLE') dispatch({ type: 'TOGGLE_STEP', payload: last.payload as string });
  };

  const newProject = () => {
    codeHistory.current = new LinkedList<string>();
    actionStack.current = new Stack<EditorAction>();
    explanationMap.current = new HashMap<string, FunctionExplanation>();
    analysisQueue.current = new Queue<string>();
    dispatch({ type: 'NEW_PROJECT' });
  };

  const sendChatMessage = async (message: string) => {
    const userMsg: ChatMessage = { id: `msg_${Date.now()}`, role: 'user', content: message, timestamp: Date.now() };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_CHAT_LOADING', payload: true });
    try {
      const reply = await apiSendChatMessage(message, state.code, state.language);
      const assistantMsg: ChatMessage = { id: `msg_${Date.now() + 1}`, role: 'assistant', content: reply, timestamp: Date.now() };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMsg });
    } finally {
      dispatch({ type: 'SET_CHAT_LOADING', payload: false });
    }
  };

  // ─── File system actions ───────────────────────────────────────────────────
  const createFile = (name: string, parentId: string | null) => {
    const lang = detectLanguage(name);
    const node: FileNode = { id: uid(), type: 'file', name, content: '', language: lang, parentId };
    dispatch({ type: 'FS_ADD_NODE', payload: node });
    dispatch({ type: 'FS_SET_ACTIVE', payload: node.id });
    // Immediately open the new file — need to set code/language manually since node isn't in state yet
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
    dispatch({ type: 'SET_CODE', payload: '' });
  };

  const createFolder = (name: string, parentId: string | null) => {
    const node: FolderNode = { id: uid(), type: 'folder', name, parentId, isOpen: true };
    dispatch({ type: 'FS_ADD_NODE', payload: node });
  };

  const deleteNode = (id: string) => dispatch({ type: 'FS_DELETE_NODE', payload: id });

  const renameNode = (id: string, name: string) => dispatch({ type: 'FS_RENAME_NODE', payload: { id, name } });

  const toggleFolder = (id: string) => dispatch({ type: 'FS_TOGGLE_FOLDER', payload: id });

  const openFile = (id: string) => dispatch({ type: 'FS_SET_ACTIVE', payload: id });

  const importFile = (node: FileNode) => dispatch({ type: 'FS_IMPORT_FILE', payload: node });

  const importFolder = (node: FolderNode) => dispatch({ type: 'FS_ADD_NODE', payload: node });

  return (
    <AppContext.Provider value={{
      state, setCode, setLanguage, generateGuide, triggerAnalysis,
      toggleStepComplete, dismissSuggestion, saveSnapshot, undoLastAction,
      newProject, sendChatMessage,
      createFile, createFolder, deleteNode, renameNode, toggleFolder, openFile,
      importFile, importFolder,
      explanationMap: explanationMap.current,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
