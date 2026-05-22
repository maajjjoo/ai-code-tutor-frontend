import { useState, useRef, useEffect, Fragment } from 'react';
import { Send, Bot } from 'lucide-react';
import { sendChatMessage, getErrorMessage } from '../../services/api';
import type { EditorData } from '../../types';

// ─── Chat message structure ───────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

// ─── Code block renderer ──────────────────────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="my-2 rounded-lg overflow-hidden border border-[#E5E7EB]">
      {language && (
        <div className="bg-[#1E1E2E] text-[#A0A0B0] text-[10px] px-3 py-1 font-mono border-b border-[#333]">
          {language}
        </div>
      )}
      <pre className="bg-[#1E1E2E] text-[#E0E0E0] p-3 overflow-x-auto text-[11px] leading-relaxed font-mono m-0 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Parse AI response into segments ─────────────────────────────────────────
// Splits text on ``` blocks so we can render code blocks differently
type Segment = { type: 'text' | 'code'; content: string; language?: string };

function parseResponse(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', content: match[2].trim(), language: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', content: text }];
}

// Render inline code (text between single backticks)
function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-[#EEEDFE] text-[#534AB7] px-1 rounded text-[11px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const segments = isUser ? [] : parseResponse(msg.content);

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed break-words
        ${isUser
          ? 'bg-[#534AB7] text-white rounded-tr-sm'
          : 'bg-[#F8F9FA] text-[#111827] border border-[#E5E7EB] rounded-tl-sm'}`}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          segments.map((seg, i) =>
            seg.type === 'code' ? (
              <CodeBlock key={i} code={seg.content} language={seg.language} />
            ) : (
              <span key={i} className="whitespace-pre-wrap">{renderInlineCode(seg.content)}</span>
            )
          )
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator (three dots) ───────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
      </div>
      <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg rounded-tl-none px-3 py-2 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
interface Props { editorData: EditorData | null; code: string; exerciseContext: { statement: string; code: string } | null; onAiResponse?: (msg: string) => void; width?: number; }

export function AIPanel({ editorData, code, exerciseContext, onAiResponse, width = 288 }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevExerciseRef = useRef<string | null>(null);

  // When a new exercise arrives, automatically inject the help message
  useEffect(() => {
    if (!exerciseContext) return;
    const key = exerciseContext.statement;
    if (prevExerciseRef.current === key) return;
    prevExerciseRef.current = key;

    const helpMessage = `Necesito ayuda con este ejercicio:\n\n${exerciseContext.statement}\n\nMi código actual:\n\`\`\`\n${exerciseContext.code || '(vacío)'}\n\`\`\``;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: helpMessage, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    sendChatMessage({
      message: helpMessage,
      history: updated.map(m => ({ role: m.role, content: m.content })),
      currentCode: exerciseContext.code,
      language: editorData?.language,
    }).then(res => {
      addMessage('ai', res.message);
    }).catch(err => {
      addMessage('ai', `Error: ${getErrorMessage(err)}`);
    }).finally(() => setLoading(false));
  }, [exerciseContext]);

  // Auto-scroll to last message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = (role: 'user' | 'ai', content: string) => {
    setMessages(prev => [...prev, { id: uid(), role, content, timestamp: new Date() }]);
    if (role === 'ai') onAiResponse?.(content);
  };

  // Build history to send to backend
  const buildHistory = (msgs: ChatMessage[]) =>
    msgs.map(m => ({ role: m.role, content: m.content }));

  // Analyze the current editor code
  const handleAnalyze = async () => {
    if (!editorData || !code.trim() || loading) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: 'Analizando código actual...', timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await sendChatMessage({
        message: 'Analiza el código en mi editor y explícame qué hace y cómo puedo mejorarlo',
        history: buildHistory(updated),
        currentCode: code,
        language: editorData.language,
      });
      addMessage('ai', res.message);
    } catch (err) {
      addMessage('ai', `Error: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Send user message
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
      addMessage('ai', res.message);
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
    <div className="flex flex-col bg-white border-l border-[#E5E7EB] shrink-0" style={{ width }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] shrink-0 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
        <span className="text-xs font-semibold text-[#111827] tracking-wide">AI Tutor</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEDFE] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#534AB7]" />
            </div>
            <div>
              <p className="text-sm text-[#111827] font-medium">Hola, soy tu tutor IA</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Escribe un mensaje o analiza tu código.</p>
            </div>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-[#E5E7EB] flex flex-col gap-2 shrink-0">
        <button
          onClick={handleAnalyze}
          disabled={loading || !editorData}
          className="self-start text-[10px] px-2.5 py-1 rounded-full border border-[#534AB7]/30 bg-[#EEEDFE] text-[#534AB7] hover:bg-[#534AB7]/20 disabled:opacity-40 transition-colors cursor-pointer font-medium"
        >
          Analizar código
        </button>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={2}
            className="flex-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#111827] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#534AB7] transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-[#534AB7] hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
