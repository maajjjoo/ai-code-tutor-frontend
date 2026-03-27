import { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Project, AnalysisHistory, CodeSnapshot, GuideStep, ChatMessage, EditorAction, FSNode, FileNode, FolderNode, Language } from '../types';
import { Stack, Queue, LinkedList, HashMap, DoublyLinkedList, CircularLinkedList, Graph, NaryTree, NaryNode } from '../dataStructures';
import { analyzeCode as apiAnalyzeCode, generateGuide as apiGenerateGuide, saveSnapshot as apiSaveSnapshot, getLatestSnapshot, getRecentAnalysis } from '../services/api';

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  currentProject: Project | null;
  code: string;
  guideSteps: GuideStep[];
  recentAnalysis: AnalysisHistory[];
  snapshots: CodeSnapshot[];
  isAnalyzing: boolean;
  isGeneratingGuide: boolean;
  isSaving: boolean;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  fsNodes: FSNode[];
  activeFileId: string | null;
}

type Action =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_GUIDE_STEPS'; payload: GuideStep[] }
  | { type: 'TOGGLE_STEP'; payload: string }
  | { type: 'SET_RECENT_ANALYSIS'; payload: AnalysisHistory[] }
  | { type: 'ADD_ANALYSIS'; payload: AnalysisHistory }
  | { type: 'SET_SNAPSHOTS'; payload: CodeSnapshot[] }
  | { type: 'ADD_SNAPSHOT'; payload: CodeSnapshot }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_GENERATING_GUIDE'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'FS_ADD_NODE'; payload: FSNode }
  | { type: 'FS_IMPORT_FILE'; payload: FileNode }
  | { type: 'FS_DELETE_NODE'; payload: string }
  | { type: 'FS_RENAME_NODE'; payload: { id: string; name: string } }
  | { type: 'FS_TOGGLE_FOLDER'; payload: string }
  | { type: 'FS_SET_ACTIVE'; payload: string }
  | { type: 'RESET' };

const initialState: AppState = {
  currentProject: null,
  code: '',
  guideSteps: [],
  recentAnalysis: [],
  snapshots: [],
  isAnalyzing: false,
  isGeneratingGuide: false,
  isSaving: false,
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
    case 'SET_PROJECT':
      return { ...initialState, currentProject: action.payload };
    case 'SET_CODE': {
      const updated = state.activeFileId
        ? state.fsNodes.map((n) => n.id === state.activeFileId && n.type === 'file' ? { ...n, content: action.payload } : n)
        : state.fsNodes;
      return { ...state, code: action.payload, fsNodes: updated };
    }
    case 'SET_GUIDE_STEPS':
      return { ...state, guideSteps: action.payload };
    case 'TOGGLE_STEP':
      return { ...state, guideSteps: state.guideSteps.map((s) => s.id === action.payload ? { ...s, completed: !s.completed } : s) };
    case 'SET_RECENT_ANALYSIS':
      return { ...state, recentAnalysis: action.payload };
    case 'ADD_ANALYSIS':
      return { ...state, recentAnalysis: [action.payload, ...state.recentAnalysis].slice(0, 5) };
    case 'SET_SNAPSHOTS':
      return { ...state, snapshots: action.payload };
    case 'ADD_SNAPSHOT':
      return { ...state, snapshots: [action.payload, ...state.snapshots] };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_GENERATING_GUIDE':
      return { ...state, isGeneratingGuide: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CHAT_LOADING':
      return { ...state, isChatLoading: action.payload };
    case 'FS_ADD_NODE':
      return { ...state, fsNodes: [...state.fsNodes, action.payload] };
    case 'FS_IMPORT_FILE': {
      const node = action.payload;
      return { ...state, fsNodes: [...state.fsNodes, node], activeFileId: node.id, code: node.content };
    }
    case 'FS_DELETE_NODE': {
      const remaining = deleteNodeAndChildren(state.fsNodes, action.payload);
      const stillActive = remaining.some((n) => n.id === state.activeFileId);
      return { ...state, fsNodes: remaining, activeFileId: stillActive ? state.activeFileId : null, code: stillActive ? state.code : '' };
    }
    case 'FS_RENAME_NODE':
      return { ...state, fsNodes: state.fsNodes.map((n) => n.id === action.payload.id ? { ...n, name: action.payload.name } : n) };
    case 'FS_TOGGLE_FOLDER':
      return { ...state, fsNodes: state.fsNodes.map((n) => n.id === action.payload && n.type === 'folder' ? { ...n, isOpen: !(n as FolderNode).isOpen } : n) };
    case 'FS_SET_ACTIVE': {
      const file = state.fsNodes.find((n) => n.id === action.payload && n.type === 'file') as FileNode | undefined;
      if (!file) return state;
      return { ...state, activeFileId: action.payload, code: file.content };
    }
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Context value ────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  loadProject: (project: Project) => Promise<void>;
  setCode: (code: string) => void;
  triggerAnalysis: () => Promise<void>;
  generateGuide: () => Promise<void>;
  saveVersion: (label?: string) => Promise<void>;
  toggleStepComplete: (stepId: string) => void;
  sendChatMessage: (message: string) => Promise<void>;
  createFile: (name: string, parentId: string | null) => void;
  createFolder: (name: string, parentId: string | null) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  toggleFolder: (id: string) => void;
  openFile: (id: string) => void;
  importFile: (node: FileNode) => void;
  importFolder: (node: FolderNode) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
function uid() { return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function detectLanguage(name: string): Language {
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.cpp') || name.endsWith('.cc') || name.endsWith('.h')) return 'cpp';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
  return 'javascript';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Pila (Stack): historial de acciones del editor para deshacer (undo)
  const actionStack = useRef(new Stack<EditorAction>());

  // Cola (Queue): solicitudes de análisis pendientes al backend
  const analysisQueue = useRef(new Queue<string>());

  // Lista simple enlazada: historial de versiones del código en memoria
  const codeHistory = useRef(new LinkedList<string>());

  // Lista doblemente enlazada: historial de análisis navegable (adelante/atrás)
  const analysisHistory = useRef(new DoublyLinkedList<AnalysisHistory>());

  // Lista circular: rotación de sugerencias de IA disponibles
  const suggestionCycle = useRef(new CircularLinkedList<string>());

  // HashMap: explicaciones de funciones detectadas, keyed por nombre de función
  const explanationMap = useRef(new HashMap<string, string>());

  // Grafo dirigido: mapa de dependencias entre archivos del proyecto
  const fileDependencyGraph = useRef(new Graph<string>(true));

  // Árbol N-ario: estructura de carpetas del explorador de archivos virtual
  const folderTree = useRef(new NaryTree<string>());

  const isProcessingQueue = useRef(false);

  const loadProject = useCallback(async (project: Project) => {
    dispatch({ type: 'SET_PROJECT', payload: project });

    // Reiniciar todas las estructuras de datos al cargar un nuevo proyecto
    codeHistory.current = new LinkedList<string>();
    actionStack.current = new Stack<EditorAction>();
    explanationMap.current = new HashMap<string, string>();
    analysisHistory.current = new DoublyLinkedList<AnalysisHistory>();
    suggestionCycle.current = new CircularLinkedList<string>();
    fileDependencyGraph.current = new Graph<string>(true);
    folderTree.current = new NaryTree<string>();

    // Inicializar el árbol N-ario con la raíz del proyecto
    folderTree.current.root = new NaryNode<string>(project.name);

    // Cargar el último snapshot guardado
    try {
      const snapshot = await getLatestSnapshot(project.id);
      dispatch({ type: 'SET_CODE', payload: snapshot.content });
      // Agregar el snapshot inicial al historial de versiones (lista simple)
      codeHistory.current.append(snapshot.content);
    } catch { /* sin snapshot aún */ }

    // Cargar historial reciente de análisis
    try {
      const recent = await getRecentAnalysis(project.id);
      dispatch({ type: 'SET_RECENT_ANALYSIS', payload: recent });
      // Poblar la lista doblemente enlazada con el historial de análisis
      recent.forEach((a) => analysisHistory.current.append(a));
    } catch { /* ignorar */ }
  }, []);

  const setCode = (code: string) => dispatch({ type: 'SET_CODE', payload: code });

  const triggerAnalysis = useCallback(async () => {
    const { currentProject, code } = stateRef.current;
    if (!currentProject || !code.trim()) return;

    // Encolar el código actual para análisis (Cola FIFO)
    analysisQueue.current.enqueue(code);
    if (isProcessingQueue.current) return;

    isProcessingQueue.current = true;
    dispatch({ type: 'SET_ANALYZING', payload: true });

    while (!analysisQueue.current.isEmpty()) {
      const snap = analysisQueue.current.dequeue();
      if (snap !== undefined) {
        try {
          const result = await apiAnalyzeCode({
            code: snap,
            language: currentProject.programmingLanguage,
            projectId: currentProject.id,
          });
          dispatch({ type: 'ADD_ANALYSIS', payload: result });

          // Guardar en la lista doblemente enlazada para navegación adelante/atrás
          analysisHistory.current.append(result);

          // Guardar snapshot del código en la lista simple (historial de versiones)
          codeHistory.current.append(snap);

          // Guardar explicación en el HashMap keyed por projectId+timestamp
          explanationMap.current.set(`${currentProject.id}_${Date.now()}`, result.explanation);

          // Poblar la lista circular con las sugerencias para rotación
          if (result.suggestions) {
            result.suggestions.split('\n').filter(Boolean).forEach((s) => {
              suggestionCycle.current.append(s);
            });
          }
        } catch { /* ignorar errores de análisis */ }
      }
    }

    isProcessingQueue.current = false;
    dispatch({ type: 'SET_ANALYZING', payload: false });
  }, []);

  const generateGuide = useCallback(async () => {
    const { currentProject } = stateRef.current;
    if (!currentProject?.description) return;
    dispatch({ type: 'SET_GENERATING_GUIDE', payload: true });
    try {
      const raw = await apiGenerateGuide(currentProject.description);
      // Parse numbered list from plain text response
      const lines = raw.split('\n').filter((l) => l.trim());
      const steps: GuideStep[] = lines.map((line, i) => ({
        id: `step_${i}`,
        stepNumber: i + 1,
        title: line.replace(/^\d+[\.\)]\s*/, '').trim(),
        description: '',
        completed: false,
      }));
      dispatch({ type: 'SET_GUIDE_STEPS', payload: steps });
    } finally {
      dispatch({ type: 'SET_GENERATING_GUIDE', payload: false });
    }
  }, []);

  const saveVersion = useCallback(async (label?: string) => {
    const { currentProject, code } = stateRef.current;
    if (!currentProject || !code.trim()) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const snapshot = await apiSaveSnapshot({ content: code, versionLabel: label, projectId: currentProject.id });
      dispatch({ type: 'ADD_SNAPSHOT', payload: snapshot });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, []);

  const toggleStepComplete = (stepId: string) => {
    actionStack.current.push({ type: 'STEP_TOGGLE', payload: stepId, timestamp: Date.now() });
    dispatch({ type: 'TOGGLE_STEP', payload: stepId });
  };

  const sendChatMessage = useCallback(async (message: string) => {
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: message, timestamp: Date.now() };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_CHAT_LOADING', payload: true });
    // Chat is mock until backend provides endpoint
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    const { code, currentProject } = stateRef.current;
    const lang = currentProject?.programmingLanguage ?? 'code';
    const replies = [
      `Looking at your ${lang} code — you're on the right track. Keep going!`,
      `Good question. In ${lang}, this pattern is common. Consider also handling edge cases.`,
      `The logic looks solid. Think about what happens with unexpected input.`,
      `Nice structure. You could make this more reusable by extracting it into a helper function.`,
    ];
    const reply = code.trim()
      ? replies[Math.floor(Math.random() * replies.length)]
      : `Start writing some ${lang} code and I'll help you understand it as you go.`;
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { id: uid(), role: 'assistant', content: reply, timestamp: Date.now() } });
    dispatch({ type: 'SET_CHAT_LOADING', payload: false });
  }, []);

  // ─── File system ────────────────────────────────────────────────────────────
  const createFile = (name: string, parentId: string | null) => {
    const lang = detectLanguage(name);
    const node: FileNode = { id: uid(), type: 'file', name, content: '', language: lang, parentId };
    dispatch({ type: 'FS_IMPORT_FILE', payload: node });
  };

  const createFolder = (name: string, parentId: string | null) => {
    dispatch({ type: 'FS_ADD_NODE', payload: { id: uid(), type: 'folder', name, parentId, isOpen: true } as FolderNode });
  };

  const deleteNode = (id: string) => dispatch({ type: 'FS_DELETE_NODE', payload: id });
  const renameNode = (id: string, name: string) => dispatch({ type: 'FS_RENAME_NODE', payload: { id, name } });
  const toggleFolder = (id: string) => dispatch({ type: 'FS_TOGGLE_FOLDER', payload: id });
  const openFile = (id: string) => dispatch({ type: 'FS_SET_ACTIVE', payload: id });
  const importFile = (node: FileNode) => dispatch({ type: 'FS_IMPORT_FILE', payload: node });
  const importFolder = (node: FolderNode) => dispatch({ type: 'FS_ADD_NODE', payload: node });
  const reset = () => {
    // Limpiar todas las estructuras de datos al resetear el proyecto
    codeHistory.current = new LinkedList<string>();
    actionStack.current = new Stack<EditorAction>();
    explanationMap.current = new HashMap<string, string>();
    analysisQueue.current = new Queue<string>();
    analysisHistory.current = new DoublyLinkedList<AnalysisHistory>();
    suggestionCycle.current = new CircularLinkedList<string>();
    fileDependencyGraph.current = new Graph<string>(true);
    folderTree.current = new NaryTree<string>();
    dispatch({ type: 'RESET' });
  };

  return (
    <AppContext.Provider value={{
      state, loadProject, setCode, triggerAnalysis, generateGuide, saveVersion,
      toggleStepComplete, sendChatMessage,
      createFile, createFolder, deleteNode, renameNode, toggleFolder, openFile,
      importFile, importFolder, reset,
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
