import { createContext, useContext, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ProjectData, GuideStep, FunctionExplanation, Language, EditorAction } from '../types';
import { Stack, Queue, LinkedList, HashMap } from '../dataStructures';
import { generateGuide as apiGenerateGuide, analyzeCode as apiAnalyzeCode } from '../services/api';

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
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload };
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
      return {
        ...state,
        guideSteps: state.guideSteps.map((s) =>
          s.id === action.payload ? { ...s, completed: !s.completed } : s
        ),
      };
    case 'SET_ANALYSIS':
      return { ...state, explanations: action.payload.explanations, suggestions: action.payload.suggestions };
    case 'DISMISS_SUGGESTION':
      return { ...state, suggestions: state.suggestions.filter((_, i) => i !== action.payload) };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_GENERATING_GUIDE':
      return { ...state, isGeneratingGuide: action.payload };
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
  // Data structure refs exposed for debugging / advanced use
  explanationMap: HashMap<string, FunctionExplanation>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persistent data structure instances (refs so they survive re-renders)
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
          // Store in HashMap keyed by function name
          explanationMap.current.clear();
          result.explanations.forEach((exp) => explanationMap.current.set(exp.functionName, exp));
          dispatch({ type: 'SET_ANALYSIS', payload: { explanations: result.explanations, suggestions: result.suggestions } });
        } catch {
          // silently ignore failed analysis
        }
      }
    }

    isProcessingQueue.current = false;
    dispatch({ type: 'SET_ANALYZING', payload: false });
  };

  const triggerAnalysis = async (code: string) => {
    analysisQueue.current.enqueue(code);
    const description = state.currentProject?.description ?? '';
    await processAnalysisQueue(state.language, description);
  };

  const toggleStepComplete = (stepId: string) => {
    actionStack.current.push({ type: 'STEP_TOGGLE', payload: stepId, timestamp: Date.now() });
    dispatch({ type: 'TOGGLE_STEP', payload: stepId });
  };

  const dismissSuggestion = (index: number) => {
    actionStack.current.push({ type: 'SUGGESTION_DISMISS', payload: index, timestamp: Date.now() });
    dispatch({ type: 'DISMISS_SUGGESTION', payload: index });
  };

  const saveSnapshot = () => {
    codeHistory.current.append(state.code);
  };

  const undoLastAction = () => {
    const last = actionStack.current.pop();
    if (!last) return;
    if (last.type === 'STEP_TOGGLE') {
      dispatch({ type: 'TOGGLE_STEP', payload: last.payload as string });
    }
  };

  const newProject = () => {
    codeHistory.current = new LinkedList<string>();
    actionStack.current = new Stack<EditorAction>();
    explanationMap.current = new HashMap<string, FunctionExplanation>();
    analysisQueue.current = new Queue<string>();
    dispatch({ type: 'NEW_PROJECT' });
  };

  return (
    <AppContext.Provider value={{
      state,
      setCode,
      setLanguage,
      generateGuide,
      triggerAnalysis,
      toggleStepComplete,
      dismissSuggestion,
      saveSnapshot,
      undoLastAction,
      newProject,
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
