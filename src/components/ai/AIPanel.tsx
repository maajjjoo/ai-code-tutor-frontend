import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { sendChatMessage, getErrorMessage } from '../../services/api';
import type { EditorData } from '../../types';

// ─── Estructura de mensaje de chat ────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

// Elimina emojis de las respuestas de la IA
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-[#0e639c] flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words
        ${isUser
          ? 'bg-[#0e639c] text-white rounded-tr-none'
          : 'bg-[#2d2d2d] text-[#cccccc] border border-[#3c3c3c] rounded-tl-none'}`}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Indicador de escritura (tres puntos) ─────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-[#0e639c] flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg rounded-tl-none px-3 py-2 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-[#858585] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────
interface Props { editorData: EditorData | null; code: string; }

export function AIPanel({ editorData, code }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = (role: 'user' | 'ai', content: string) => {
    setMessages(prev => [...prev, { id: uid(), role, content, timestamp: new Date() }]);
  };

  // Construye el historial para enviar al backend
  const buildHistory = (msgs: ChatMessage[]) =>
    msgs.map(m => ({ role: m.role, content: m.content }));

  // Analizar el código actual del editor
  const handleAnalyze = async () => {
    if (!editorData || !code.trim() || loading) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: 'Analizando código actual...', timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await sendChatMessage({
        message: 'Analiza el código que tengo en el editor y explícame qué hace y cómo puedo mejorarlo',
        history: buildHistory(updated),
        currentCode: code,
        language: editorData.language,
      });
      addMessage('ai', stripEmojis(res.message));
    } catch (err) {
      addMessage('ai', `Error: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensaje libre del usuario
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await sendChatMessage({
        message: text,
        history: buildHistory(updated),
        currentCode: code,
        language: editorData?.language,
      });
      addMessage('ai', stripEmojis(res.message));
    } catch (err) {
      addMessage('ai', `Error: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col w-72 bg-[#252526] border-l border-[#1e1e1e] shrink-0">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e1e1e] shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#bbbbbb]">AI Tutor</span>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#555] gap-2 py-10">
            <Bot className="w-8 h-8 opacity-30" />
            <p className="text-xs">Escribe un mensaje o analiza tu código.</p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-[#1e1e1e] flex flex-col gap-2 shrink-0">
        {/* Botón analizar código — pequeño y discreto */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !editorData}
          className="self-start text-[10px] px-2 py-0.5 rounded border border-[#3c3c3c] bg-[#2d2d2d] text-[#858585] hover:text-[#cccccc] hover:border-[#555] disabled:opacity-40 transition-colors cursor-pointer"
        >
          Analizar código
        </button>

        {/* Input + send */}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            rows={2}
            className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1.5 text-xs text-[#cccccc] placeholder-[#555] resize-none focus:outline-none focus:border-[#569cd6]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded bg-[#0e639c] hover:bg-[#1177bb] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            aria-label="Enviar"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
