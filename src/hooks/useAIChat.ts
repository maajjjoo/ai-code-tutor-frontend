import { useState, useCallback, useRef, useEffect } from 'react';
import type * as Monaco from 'monaco-editor';
import { sendChatMessage, analyzeCodePedagogical } from '../services/api';
import type { CodeAnalysisResponse, ExerciseContext, Project as BackendProject } from '../types';
import type { useVirtualFileSystem } from './useVirtualFileSystem';
import { uid } from '../types/vfs';

interface MonacoMarker {
  startLineNumber: number; startColumn: number;
  endLineNumber: number; endColumn: number;
  message: string; severity: number;
}

export interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  analysisResult?: CodeAnalysisResponse;
}

interface Params {
  vfs: ReturnType<typeof useVirtualFileSystem>;
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
  monacoRef: React.RefObject<typeof Monaco | null>;
  activeProject: BackendProject | null;
  exerciseContext: ExerciseContext | null;
}

export function useAIChat({ vfs, editorRef, monacoRef, activeProject, exerciseContext }: Params) {
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, aiLoading]);

  const buildAnalysisMsg = useCallback((result: CodeAnalysisResponse): ChatMsg => {
    return {
      id: uid(), role: 'ai',
      content: result.whatItDoes || result.summary || '',
      timestamp: Date.now(),
      analysisResult: result,
    };
  }, []);

  const setEditorMarkers = useCallback((result: CodeAnalysisResponse) => {
    if (!result.hasErrors || !result.errors?.length || !editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    monacoRef.current.editor.setModelMarkers(model, 'syntax', []);
    const markers: MonacoMarker[] = [];
    for (const error of result.errors) {
      if (error.line) {
        markers.push({
          startLineNumber: error.line,
          startColumn: 1,
          endLineNumber: error.line,
          endColumn: 1000,
          message: error.message,
          severity: monacoRef.current.MarkerSeverity.Error,
        });
      }
    }
    if (markers.length === 0) {
      const totalLines = (vfs.code.match(/\n/g) || []).length + 1;
      markers.push({
        startLineNumber: 1, startColumn: 1,
        endLineNumber: totalLines, endColumn: 1000,
        message: result.errors[0]?.message || 'Syntax error detected',
        severity: monacoRef.current.MarkerSeverity.Error,
      });
    }
    monacoRef.current.editor.setModelMarkers(model, 'syntax', markers);
  }, [vfs.code, editorRef, monacoRef]);

  const handleAnalyze = useCallback(async () => {
    if (!vfs.code.trim()) return;
    setAiMessages(prev => [...prev, { id: uid(), role: 'user', content: 'Analizando tu código...', timestamp: Date.now() }]);
    setAiLoading(true);
    try {
      const result = await analyzeCodePedagogical({
        code: vfs.code, language: vfs.openFile?.language ?? 'python', projectDescription: activeProject?.name ?? 'Project',
        exerciseContext: exerciseContext ? { prompt: exerciseContext.exercisePrompt, lessonTitle: exerciseContext.lessonTitle, level: exerciseContext.level } : undefined,
      });
      setAiMessages(prev => [...prev, buildAnalysisMsg(result)]);
      setEditorMarkers(result);
    } catch {
      setAiMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Could not analyze your code right now. Please try again.', timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  }, [vfs.code, vfs.openFile, activeProject, exerciseContext, buildAnalysisMsg, setEditorMarkers]);

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

  return {
    aiMessages, aiInput, setAiInput,
    aiLoading, showHistory, setShowHistory,
    aiBottomRef, handleAnalyze, handleAiSend,
  };
}
