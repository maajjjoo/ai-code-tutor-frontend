import { Bot, Send, Trash2, X } from 'lucide-react';
import { UI } from '../../constants/ui.strings';
import { MessageRenderer } from '../ai/MessageRenderer';
import type { Conversation, ConversationMessage } from '../../types/conversation.types';

export type { ConversationMessage };

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function AiMessageBubble({ msg }: { msg: ConversationMessage }) {
  if (msg.role === 'assistant') {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-[8px]">
          <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
          </div>
          <span className="text-[12px] font-medium text-[#534AB7]">{UI.AI_TUTOR}</span>
        </div>
        <div className="bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[0_10px_10px_10px] p-2.5">
          <MessageRenderer content={msg.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-5">
      <div className="bg-[#534AB7] text-white rounded-[10px_10px_0_10px] p-2.5 text-xs max-w-[85%]">
        {msg.content}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-[8px]">
        <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
          <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
        </div>
        <span className="text-[12px] font-medium text-[#534AB7]">{UI.AI_TUTOR}</span>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] p-[12px_14px] space-y-3 animate-pulse">
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

interface HistoryPanelProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

function HistoryPanel({ conversations, activeConversationId, onSelect, onDelete, onNew, onClose }: HistoryPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5E7EB] dark:border-gray-700 shrink-0">
        <span className="text-[13px] font-medium text-[#111827] dark:text-gray-100">Conversaciones</span>
        <div className="flex items-center gap-1.5">
          <button onClick={onNew} className="text-[11px] px-2.5 py-1 rounded-lg bg-[#534AB7] text-white font-medium hover:opacity-90 transition-opacity cursor-pointer">
            + Nueva
          </button>
          <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="w-8 h-8 text-[#D1D5DB] mb-2" />
            <p className="text-[12px] text-[#9CA3AF]">No hay conversaciones aún</p>
            <p className="text-[11px] text-[#D1D5DB] mt-1">Empieza escribiendo un mensaje</p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            const userMsgCount = conv.messages.filter(m => m.role === 'user').length;
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex items-start gap-2 px-3 py-2.5 border-b border-[#F3F4F6] dark:border-gray-700 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#EEEDFE] dark:bg-[#2a2550]' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] truncate ${isActive ? 'text-[#534AB7] font-medium' : 'text-[#111827] dark:text-gray-100'}`}>
                    {conv.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {userMsgCount} mensaje{userMsgCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">{timeAgo(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                  className="p-1 text-[#9CA3AF] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface Props {
  messages: ConversationMessage[];
  aiInput: string;
  aiLoading: boolean;
  showHistory: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  aiBottomRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onSendCode: () => void;
  onToggleHistory: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function AiChatPanel({
  messages, aiInput, aiLoading, showHistory,
  conversations, activeConversationId,
  aiBottomRef, onInputChange, onSend, onSendCode,
  onToggleHistory, onNewConversation, onSelectConversation, onDeleteConversation,
}: Props) {
  return (
    <>
      <div className="h-[44px] border-b border-[#E5E7EB] dark:border-gray-700 flex items-center px-[14px] shrink-0 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-[8px] h-[8px] rounded-full bg-[#5DCAA5] shrink-0" />
          <span className="text-[13px] font-medium text-[#111827] dark:text-gray-100">{UI.AI_TUTOR}</span>
          <span className="text-[11px] text-[#9CA3AF] truncate">
            {activeConversationId ? conversations.find(c => c.id === activeConversationId)?.title ?? '' : ''}
          </span>
        </div>
        <div className="flex items-center gap-[8px]">

        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {showHistory ? (
          <div className="h-full">
            <HistoryPanel
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={id => { onSelectConversation(id); onToggleHistory(); }}
              onDelete={onDeleteConversation}
              onNew={onNewConversation}
              onClose={onToggleHistory}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-[14px] py-[14px]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEEDFE] flex items-center justify-center">
                    <Bot className="w-6 h-6 text-[#534AB7]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#111827] dark:text-gray-100 font-medium">{UI.AI_WELCOME}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{UI.AI_SUBTITLE}</p>
                  </div>
                </div>
              )}
              {messages.map(msg => <AiMessageBubble key={msg.id} msg={msg} />)}
              {aiLoading && <LoadingSkeleton />}
              <div ref={aiBottomRef} />
            </div>

            <div className="p-2.5 border-t border-[#E5E7EB] dark:border-gray-700 bg-[#FAFAFA] dark:bg-gray-900 shrink-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button onClick={e => { e.stopPropagation(); onSendCode(); }} className="px-2.5 py-[3px] rounded-full text-[10px] font-medium bg-[#EEEDFE] dark:bg-[#2a2550] text-[#3C3489] dark:text-[#a09de8] border border-[#AFA9EC] dark:border-[#534AB7] cursor-pointer hover:bg-[#CECBF6] dark:hover:bg-indigo-900/50 whitespace-nowrap transition-colors">
                  Analizar mi código
                </button>
                <button onClick={e => { e.stopPropagation(); onInputChange('¿Qué debería hacer a continuación?'); }} className="px-2.5 py-[3px] rounded-full text-[10px] font-medium bg-[#EEEDFE] dark:bg-[#2a2550] text-[#3C3489] dark:text-[#a09de8] border border-[#AFA9EC] dark:border-[#534AB7] cursor-pointer hover:bg-[#CECBF6] dark:hover:bg-indigo-900/50 whitespace-nowrap transition-colors">
                  {UI.NEXT_STEP_QUESTION}
                </button>
                <button onClick={e => { e.stopPropagation(); onInputChange('Explícame mi código'); }} className="px-2.5 py-[3px] rounded-full text-[10px] font-medium bg-[#EEEDFE] dark:bg-[#2a2550] text-[#3C3489] dark:text-[#a09de8] border border-[#AFA9EC] dark:border-[#534AB7] cursor-pointer hover:bg-[#CECBF6] dark:hover:bg-indigo-900/50 whitespace-nowrap transition-colors">
                  {UI.EXPLAIN_THIS}
                </button>
              </div>

              <div className="flex items-center gap-[8px]">
                <textarea
                  value={aiInput}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  placeholder={UI.ASK_PLACEHOLDER}
                  rows={1}
                  className="flex-1 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] px-2.5 py-1.5 text-xs text-[#111827] dark:text-gray-100 bg-white dark:bg-gray-800 outline-none h-8 focus:border-[#534AB7] placeholder:text-[#9CA3AF]"
                />
                <button
                  onClick={onSend}
                  disabled={!aiInput.trim() || aiLoading}
                  className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 cursor-pointer border-none ${
                    aiInput.trim() ? 'bg-[#534AB7] text-white' : 'bg-[#E5E7EB] dark:bg-gray-700 text-[#9CA3AF]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
