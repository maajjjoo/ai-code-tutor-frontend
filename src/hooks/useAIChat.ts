import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import type { Project as BackendProject } from '../types';
import type { useVirtualFileSystem } from './useVirtualFileSystem';
import { useConversations } from './useConversations';

interface Params {
  vfs: ReturnType<typeof useVirtualFileSystem>;
  activeProject: BackendProject | null;
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

    addMessage(convId, { role: 'user', content, timestamp: new Date() });

    try {
      const history = (activeConversation?.messages ?? [])
        .slice(-10)
        .map(m => ({ role: m.role === 'assistant' ? 'ai' as const : 'user' as const, content: m.content }));

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
    if (!vfs.code.trim()) {
      addMessage(activeConversationId ?? '', { role: 'assistant', content: 'No hay código en el editor.', timestamp: new Date() });
      return;
    }
    sendMessage('¿Puedes analizar mi código?');
  }, [vfs.code, sendMessage, activeConversationId, addMessage]);

  const handleAiSend = useCallback(async () => {
    if (!aiInput.trim() || aiLoading) return;
    const text = aiInput.trim();
    setAiInput('');
    await sendMessage(text);
  }, [aiInput, aiLoading, sendMessage]);

  return {
    aiMessages: messages,
    messages,
    aiInput, setAiInput,
    aiLoading,
    showHistory, setShowHistory,
    aiBottomRef,
    handleAiSend,
    sendCodeAsMessage,
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    deleteConversation,
    selectConversation,
    clearConversation,
  };
}
