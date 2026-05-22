import { useState, useRef, useEffect } from 'react';
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

// Strip emojis from AI responses
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-[#534AB7]" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words
        ${isUser
          ? 'bg-[#534AB7] text-white rounded-tr-sm'
          : 'bg-[#F8F9FA] text-[#111827] border border-[#E5E7EB] rounded-tl-sm'}`}>
        {msg.content}
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

    const helpMessage = `I need help with this exercise:\n\n${exerciseContext.statement}\n\nMy current code:\n\`\`\`\n${exerciseContext.code || '(empty)'}\n\`\`\``;
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
      addMessage('ai', stripEmojis(res.message));
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
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: 'Analyzing current code...', timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await sendChatMessage({
        message: 'Analyze the code in my editor and explain what it does and how I can improve it',
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
              <p className="text-sm text-[#111827] font-medium">Hi, I'm your AI tutor</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Type a message or analyze your code.</p>
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
          Analyze code
        </button>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
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
