import { Bot, Send } from 'lucide-react';
import { UI } from '../../constants/ui.strings';
import { MessageRenderer } from '../ai/MessageRenderer';
import { AnalysisResult } from '../ai/AnalysisResult';

interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  analysisResult?: import('../../types').CodeAnalysisResponse;
}

export type { ChatMsg };

function AiMessageBubble({ msg }: { msg: ChatMsg }) {
  if (msg.role === 'ai') {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-[8px]">
          <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
          </div>
          <span className="text-[12px] font-medium text-[#534AB7]">{UI.AI_TUTOR}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] p-[12px_14px]">
          {msg.analysisResult ? (
            <AnalysisResult result={msg.analysisResult} />
          ) : (
            <MessageRenderer content={msg.content} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-5">
      <div className={`${msg.content === 'Analizando tu código...' ? 'bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 text-[#9CA3AF] dark:text-gray-500 text-[11px] rounded-[10px] px-[12px] py-[6px]' : 'bg-[#534AB7] text-white rounded-tl-[10px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-none px-[14px] py-[10px] max-w-[85%] text-[12px]'}`}>
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

interface Props {
  aiMessages: ChatMsg[];
  aiInput: string;
  aiLoading: boolean;
  showHistory: boolean;
  code: string;
  aiBottomRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onAnalyze: () => void;
  onToggleHistory: () => void;
}

export function AiChatPanel({ aiMessages, aiInput, aiLoading, showHistory, code, aiBottomRef, onInputChange, onSend, onAnalyze, onToggleHistory }: Props) {
  return (
    <>
      <div className="h-[44px] border-b border-[#E5E7EB] dark:border-gray-700 flex items-center px-[14px] shrink-0 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          <span className="w-[8px] h-[8px] rounded-full bg-[#5DCAA5]" />
          <span className="text-[13px] font-medium text-[#111827] dark:text-gray-100">{UI.AI_TUTOR}</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            onClick={onToggleHistory}
            className={`flex items-center gap-1 border ${showHistory ? 'bg-[#EEEDFE] border-[#534AB7] text-[#534AB7]' : 'border-[#E5E7EB] dark:border-gray-700 bg-transparent text-[#6B7280]'} rounded-[8px] px-[12px] py-[5px] text-[12px] font-medium cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-gray-700`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {showHistory ? UI.CHAT : UI.HISTORY}
          </button>
          <button onClick={onAnalyze} disabled={!code.trim() || aiLoading} className="flex items-center gap-1 bg-[#534AB7] text-white rounded-[8px] px-[12px] py-[5px] text-[12px] font-medium cursor-pointer hover:opacity-90 border-none disabled:opacity-40 disabled:cursor-not-allowed">
            {aiLoading ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
            )}
            {aiLoading ? UI.ANALYZING : UI.ANALYZE_CODE}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[14px] py-[14px] transition-colors">
        {showHistory && (
          <div className="space-y-3">
            <p className="text-[12px] font-medium text-[#111827] dark:text-gray-100">Historial de conversaciones</p>
            {aiMessages.length === 0 && <p className="text-[11px] text-[#9CA3AF]">{UI.NO_CONVERSATIONS}</p>}
            {aiMessages.map(msg => (
              <div key={msg.id} className={`p-2 rounded-lg text-[11px] ${msg.role === 'ai' ? 'bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700' : 'bg-[#EEEDFE] dark:bg-indigo-900/30'}`}>
                <span className="font-medium text-[#534AB7]">{msg.role === 'ai' ? 'AI' : 'You'}: </span>
                <span className="text-[#4B5563] dark:text-gray-400">{msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content}</span>
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
                  <p className="text-sm text-[#111827] dark:text-gray-100 font-medium">{UI.AI_WELCOME}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{UI.AI_SUBTITLE}</p>
                </div>
              </div>
            )}
            {aiMessages.map(msg => <AiMessageBubble key={msg.id} msg={msg} />)}
            {aiLoading && <LoadingSkeleton />}
            <div ref={aiBottomRef} />
          </>
        )}
      </div>

      {!showHistory && (
        <>
          <div className="px-3 pb-2 pt-1">
            <div className="flex flex-wrap gap-[6px] mb-[10px]">
              <button onClick={() => onInputChange(UI.NEXT_STEP_QUESTION)} className="bg-[#EEEDFE] dark:bg-indigo-900/30 text-[#3C3489] dark:text-indigo-300 border border-[#AFA9EC] dark:border-[#534AB7] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] dark:hover:bg-indigo-900/50 transition-colors">
                {UI.NEXT_STEP_QUESTION}
              </button>
              <button onClick={() => onInputChange(UI.EXPLAIN_THIS)} className="bg-[#EEEDFE] dark:bg-indigo-900/30 text-[#3C3489] dark:text-indigo-300 border border-[#AFA9EC] dark:border-[#534AB7] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] dark:hover:bg-indigo-900/50 transition-colors">
                {UI.EXPLAIN_THIS}
              </button>
            </div>
          </div>

          <div className="border-t border-[#E5E7EB] dark:border-gray-700 px-3 py-3 transition-colors">
            <div className="flex items-center gap-[8px]">
              <textarea
                value={aiInput}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder={UI.ASK_PLACEHOLDER}
                rows={1}
                className="flex-1 bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[10px] px-[12px] py-[8px] text-[12px] text-[#111827] dark:text-gray-100 placeholder-[#9CA3AF] outline-none resize-none min-h-[36px] max-h-[100px] focus:border-[#534AB7] focus:bg-white dark:focus:bg-gray-900"
              />
              <button
                onClick={onSend}
                disabled={!aiInput.trim() || aiLoading}
                className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 cursor-pointer border-none ${
                  aiInput.trim() ? 'bg-[#534AB7] text-white' : 'bg-[#E5E7EB] dark:bg-gray-700 text-[#9CA3AF]'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
