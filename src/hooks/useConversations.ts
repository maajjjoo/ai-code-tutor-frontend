import { useState, useEffect, useCallback } from 'react';
import type { Conversation, ConversationMessage } from '../types/conversation.types';
import { storage } from '../utils/storage';
import { uid } from '../types/vfs';

const MAX_CONVERSATIONS = 20;
const STORAGE_KEY = 'conversations';

function loadConversations(): Conversation[] {
  return storage.getArray<Conversation>(STORAGE_KEY).map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    messages: c.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }));
}

export function useConversations(projectId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const lastId = storage.get(`active_conversation_${projectId ?? 'general'}`);
    return lastId;
  });

  useEffect(() => {
    storage.set(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;

  const createConversation = useCallback((): Conversation => {
    const newConv: Conversation = {
      id: uid(),
      title: 'Nueva conversación',
      projectId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prev => {
      const updated = [newConv, ...prev];
      return updated.slice(0, MAX_CONVERSATIONS);
    });

    setActiveConversationId(newConv.id);
    storage.set(`active_conversation_${projectId ?? 'general'}`, newConv.id);

    return newConv;
  }, [projectId]);

  const addMessage = useCallback((
    conversationId: string,
    message: Omit<ConversationMessage, 'id'>,
  ): ConversationMessage => {
    const newMessage: ConversationMessage = { ...message, id: uid() };

    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;

      const title = conv.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
        : conv.title;

      return {
        ...conv,
        title,
        messages: [...conv.messages, newMessage],
        updatedAt: new Date(),
      };
    }));

    return newMessage;
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== conversationId);
      if (activeConversationId === conversationId) {
        setActiveConversationId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  }, [activeConversationId]);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    storage.set(`active_conversation_${projectId ?? 'general'}`, conversationId);
  }, [projectId]);

  const clearConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: [], updatedAt: new Date() }
        : conv
    ));
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    addMessage,
    deleteConversation,
    selectConversation,
    clearConversation,
  };
}
