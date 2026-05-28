import { useState, useCallback, useRef, useEffect } from 'react';
import type * as Monaco from 'monaco-editor';
import { sendChatMessage } from '../services/api';
import type { Project as BackendProject, ExerciseContext } from '../types';
import type { useVirtualFileSystem } from './useVirtualFileSystem';
import { useConversations } from './useConversations';

interface Params {
  vfs: ReturnType<typeof useVirtualFileSystem>;
  activeProject: BackendProject | null;
  editorRef: React.MutableRefObject<Monaco.editor.IStandaloneCodeEditor | null>;
  monacoRef: React.MutableRefObject<typeof Monaco | null>;
  exerciseContext: ExerciseContext | null;
}

export function useAIChat({ vfs, activeProject }: Params) {
  const projectId = String(activeProject?.id ?? '');
  const {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    addMessage,
    deleteConversation,
    selectConversation,
    clearConversation,
  } = useConversations(projectId || null);

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || aiLoading) return;
    setAiLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      const newConv = createConversation();
      convId = newConv.id;
    }

    // Build history from messages BEFORE the current one
    const history = (activeConversation?.messages ?? [])
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    addMessage(convId, { role: 'user', content, timestamp: new Date() });

    try {
      const res = await sendChatMessage({
        message: content,
        history,
        currentCode: vfs.code,
        language: vfs.openFile?.language,
      });

      const cleanMsg = res.message
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/gu, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      addMessage(convId, { role: 'assistant', content: cleanMsg, timestamp: new Date() });
    } catch {
      addMessage(convId, { role: 'assistant', content: 'Lo siento, ocurrió un error. Intenta de nuevo.', timestamp: new Date() });
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, activeConversationId, activeConversation, createConversation, addMessage, vfs.code, vfs.openFile?.language]);

  const sendCodeAsMessage = useCallback(() => {
    sendMessage('Analiza mi código');
  }, [sendMessage]);

  const handleAiSend = useCallback(async () => {
    if (!aiInput.trim() || aiLoading) return;
    const text = aiInput.trim();
    setAiInput('');
    await sendMessage(text);
  }, [aiInput, aiLoading, sendMessage]);

  const handleAnalyze = useCallback(() => {
    sendMessage('Analiza mi código');
  }, [sendMessage]);

  return {
    aiMessages: messages,
    messages,
    aiInput, setAiInput,
    aiLoading,
    showHistory, setShowHistory,
    aiBottomRef,
    handleAiSend,
    sendCodeAsMessage,
    handleAnalyze,
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    deleteConversation,
    selectConversation,
    clearConversation,
  };
}
