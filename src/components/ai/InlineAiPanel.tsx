import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { sendChatMessage, getErrorMessage } from '../../services/api';
import type { Language } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

function generateMessageId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function renderInlineCode(text: string): string {
  return text.replace(
    /`(.*?)`/g,
    '<code style="background:#313244;color:#a6e3a1;font-family:monospace;padding:1px 4px;border-radius:3px;font-size:11px">$1</code>'
  );
}

interface Props {
  currentCode: string;
  language: Language;
}

const MINIMUM_PANEL_HEIGHT = 80;
const MAXIMUM_PANEL_HEIGHT = 600;
const DEFAULT_COLLAPSED_HEIGHT = 130;
const DEFAULT_EXPANDED_HEIGHT = 300;

export function InlineAiPanel({ currentCode, language }: Props) {
  const [panelHeight, setPanelHeight] = useState(DEFAULT_COLLAPSED_HEIGHT);
  const [isExpanded, setIsExpanded]   = useState(false);
  const [isDragging, setIsDragging]   = useState(false);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [inputText, setInputText]     = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const messagesEndRef                = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLTextAreaElement>(null);
  const dragStartYRef                 = useRef(0);
  const dragStartHeightRef            = useRef(0);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleResizerMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = event.clientY;
    dragStartHeightRef.current = panelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = dragStartYRef.current - moveEvent.clientY;
      const newHeight = Math.max(MINIMUM_PANEL_HEIGHT, Math.min(MAXIMUM_PANEL_HEIGHT, dragStartHeightRef.current + delta));
      setPanelHeight(newHeight);
      setIsExpanded(newHeight > DEFAULT_COLLAPSED_HEIGHT);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelHeight]);

  const toggleExpanded = () => {
    if (isExpanded) {
      setPanelHeight(DEFAULT_COLLAPSED_HEIGHT);
      setIsExpanded(false);
    } else {
      setPanelHeight(DEFAULT_EXPANDED_HEIGHT);
      setIsExpanded(true);
    }
  };

  const addMessage = (role: 'user' | 'ai', content: string) => {
    setMessages(previous => [...previous, { id: generateMessageId(), role, content }]);
  };

  const handleSendMessage = async (messageText: string) => {
    const trimmedText = messageText.trim();
    if (!trimmedText || isLoading) return;
    setInputText('');
    addMessage('user', trimmedText);
    setIsLoading(true);
    try {
      const response = await sendChatMessage({
        message: trimmedText,
        history: messages.map(message => ({ role: message.role, content: message.content })),
        currentCode,
        language,
      });
      addMessage('ai', response.message);
    } catch (err) {
      addMessage('ai', `Error: ${getErrorMessage(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const lastTwoMessages = messages.slice(-2);

  return (
    <div
      role="complementary"
      aria-label="Tutor CodeTutor"
      className="shrink-0 border-t border-[#1e1e2e] bg-[#080810] flex flex-col overflow-hidden"
      style={{ height: panelHeight }}
    >
      {/* Drag resizer — top edge */}
      <div
        onMouseDown={handleResizerMouseDown}
        className="h-1 w-full shrink-0 cursor-row-resize"
        style={{ background: isDragging ? 'rgba(137,180,250,0.4)' : 'transparent' }}
        onMouseEnter={event => { event.currentTarget.style.background = 'rgba(137,180,250,0.25)'; }}
        onMouseLeave={event => { if (!isDragging) event.currentTarget.style.background = 'transparent'; }}
        aria-label="Redimensionar panel del tutor"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e1e2e] shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" style={{ animation: 'pulse-opacity 2s ease-in-out infinite' }} />
        <span className="text-[11px] font-semibold text-[#a6adc8]">CodeTutor</span>
        <div className="ml-auto">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-[10px] text-[#585b70] hover:text-[#a6adc8] cursor-pointer transition-colors px-1.5 py-0.5 rounded"
            aria-label={isExpanded ? 'Colapsar tutor' : 'Expandir tutor'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            {isExpanded ? 'Colapsar' : 'Expandir'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-[11px] text-[#45475a] text-center py-2">Pregúntame sobre el ejercicio o pide una pista.</p>
        )}
        {(isExpanded ? messages : lastTwoMessages).map(message => (
          <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${message.role === 'ai' ? 'bg-[#89b4fa]/20 text-[#89b4fa]' : 'bg-[#313244] text-[#6c7086]'}`}>
              {message.role === 'ai' ? 'AI' : 'Tú'}
            </div>
            <div
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${message.role === 'user' ? 'bg-[#1e1e2e] text-[#6c7086]' : 'bg-[#0d0d14] border border-[#1e1e2e] text-[#a6adc8]'}`}
              dangerouslySetInnerHTML={{ __html: renderInlineCode(message.content) }}
            />
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-[#89b4fa]/20 flex items-center justify-center shrink-0">
              <Loader2 className="w-3 h-3 text-[#89b4fa] animate-spin" />
            </div>
            <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg px-2.5 py-1.5 flex items-center gap-1">
              {[0, 1, 2].map(index => (
                <span key={index} className="w-1 h-1 bg-[#585b70] rounded-full" style={{ animation: `bounce 1s ease-in-out ${index * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-2 border-t border-[#1e1e2e] shrink-0">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={event => setInputText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta al tutor..."
          rows={1}
          className="flex-1 bg-[#1e1e2e] border border-[#313244] rounded-md px-2.5 py-1.5 text-[11px] text-[#cdd6f4] placeholder-[#45475a] resize-none focus:outline-none focus:border-[#89b4fa]/50 transition-colors"
          style={{ maxHeight: 60 }}
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
          className="p-1.5 rounded-md bg-[#89b4fa] hover:bg-[#7aa2e8] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
          aria-label="Enviar mensaje al tutor"
        >
          <Send className="w-3.5 h-3.5 text-[#1e1e2e]" />
        </button>
      </div>

      <style>{`
        @keyframes pulse-opacity { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      `}</style>
    </div>
  );
}
