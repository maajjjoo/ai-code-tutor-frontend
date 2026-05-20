import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { sendChatMessage, analyzeCodePedagogical, runCode, createProject, saveSnapshot } from '../services/api';
import type { Language, ExerciseContext } from '../types';
import { ExerciseContextPanel } from '../components/practice/ExerciseContextPanel';

interface StoredUser { id: number; username: string; email: string; }
interface ChatMsg { id: string; role: 'user' | 'ai'; content: string; }
interface TermLine { type: 'input' | 'output' | 'error'; text: string; }

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

const getStarterContent = (language: string, prompt: string): string => {
  const truncated = prompt.length > 80 ? prompt.substring(0, 80) + '...' : prompt;
  switch (language.toLowerCase()) {
    case 'python':
      return [
        `# Exercise: ${truncated}`,
        `# Write your solution below`,
        `#`,
        `# Hint: Think about the problem before writing any code.`,
        ``,
        `def main():`,
        `    # Your code here`,
        `    pass`,
        ``,
        `if __name__ == "__main__":`,
        `    main()`,
      ].join('\n');
    case 'java':
      return [
        `// Exercise: ${truncated}`,
        `// Write your solution below`,
        ``,
        `public class Main {`,
        `    public static void main(String[] args) {`,
        `        // Your code here`,
        `    }`,
        `}`,
      ].join('\n');
    case 'javascript':
      return [
        `// Exercise: ${truncated}`,
        `// Write your solution below`,
        ``,
        `function main() {`,
        `    // Your code here`,
        `}`,
        ``,
        `main();`,
      ].join('\n');
    case 'typescript':
      return [
        `// Exercise: ${truncated}`,
        `// Write your solution below`,
        ``,
        `function main(): void {`,
        `    // Your code here`,
        `}`,
        ``,
        `main();`,
      ].join('\n');
    default:
      return `# Exercise: ${truncated}\n# Write your solution below\n`;
  }
};

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  // Exercise context from lesson
  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const autoCreateExerciseProject = useCallback(async (ctx: ExerciseContext) => {
    setIsCreatingProject(true);
    try {
      const userData: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');
      if (!userData.id) throw new Error('No user found');

      const project = await createProject({
        name: `${ctx.lessonTitle} — ${ctx.language}`,
        description: ctx.exercisePrompt,
        programmingLanguage: ctx.language.toLowerCase() as Language,
        userId: userData.id,
      });

      setProjectName(project.name);
      setLanguage(ctx.language.toLowerCase() as Language);

      const fileContent = getStarterContent(ctx.language, ctx.exercisePrompt);
      setCode(fileContent);

      try {
        await saveSnapshot({
          content: fileContent,
          versionLabel: 'Initial exercise code',
          projectId: project.id,
        });
      } catch {
        // snapshot save is non-critical
      }
    } catch (err) {
      console.error('Auto-create exercise project failed:', err);
    } finally {
      setIsCreatingProject(false);
    }
  }, []);

  useEffect(() => {
    const raw = searchParams.get('exercise');
    if (!raw) return;
    try {
      const ctx = JSON.parse(decodeURIComponent(raw)) as ExerciseContext;
      setExerciseContext(ctx);
      autoCreateExerciseProject(ctx);
    } catch {
      // no exercise context, open normally
    }
  }, []);

  // Editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [projectName, setProjectName] = useState('My Project');
  const [isEditingName, setIsEditingName] = useState(false);

  // Panels
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'welcome', role: 'ai', content: 'Hola, soy tu tutor IA. Escribe un mensaje o analiza tu código para comenzar.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Console
  const [termLines, setTermLines] = useState<TermLine[]>([]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) return;
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: '📊 Analizar código actual' };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const result = await analyzeCodePedagogical({
        code,
        language,
        projectDescription: projectName,
        exerciseContext: exerciseContext
          ? {
              prompt: exerciseContext.exercisePrompt,
              lessonTitle: exerciseContext.lessonTitle,
              level: exerciseContext.level,
            }
          : undefined,
      });
      let response = `**Resumen:** ${result.summary}\n\n`;
      response += `**Calidad:** ${result.codeQuality.score}/5 — ${result.codeQuality.feedback}\n\n`;
      if (result.suggestions.length > 0) {
        response += '**Sugerencias:**\n';
        result.suggestions.forEach(s => { response += `${s.order}. **${s.title}** — ${s.description}\n`; });
      }
      if (result.hasErrors && result.errorHint) {
        response += `\n⚠️ **Error detectado:** ${result.errorHint}`;
      }
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: response }]);
    } catch {
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Error al analizar el código. Intenta de nuevo.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [code, language, projectName, exerciseContext]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === 'ai' ? 'ai' as const : 'user' as const, content: m.content }));
      const res = await sendChatMessage({ message: text, history, currentCode: code, language });
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: res.message }]);
    } catch {
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Error de conexión con el tutor.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, messages, code, language]);

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;
    setTermLines(prev => [...prev, { type: 'input', text: `> Running ${language}...` }]);
    try {
      const res = await runCode({ code, language });
      if (res.stdout) setTermLines(prev => [...prev, { type: 'output', text: res.stdout }]);
      if (res.stderr) setTermLines(prev => [...prev, { type: 'error', text: res.stderr }]);
      if (!res.stdout && !res.stderr) setTermLines(prev => [...prev, { type: 'output', text: '(no output)' }]);
    } catch {
      setTermLines(prev => [...prev, { type: 'error', text: 'Error executing code' }]);
    }
  }, [code, language]);

  const handleSave = useCallback(() => {
    const key = `practice-save-${user.id}`;
    localStorage.setItem(key, JSON.stringify({ code, language, projectName, savedAt: new Date().toISOString() }));
  }, [code, language, projectName, user.id]);

  // Load saved on mount
  useEffect(() => {
    const key = `practice-save-${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.code) setCode(parsed.code);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.projectName) setProjectName(parsed.projectName);
      } catch { /* ignore */ }
    }
  }, [user.id]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F8F9FA]">
      {/* ═══ TOP BAR ═══ */}
      <div className="h-12 bg-white border-b border-[#E5E7EB] flex items-center px-3 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 bg-[#534AB7] rounded-[6px] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <span className="text-[13px] font-medium text-[#111827] hidden sm:inline">AICodeTutor</span>
          </div>
          <div className="w-px h-5 bg-[#E5E7EB]" />
          {isEditingName ? (
            <input
              autoFocus
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
              className="text-[13px] font-medium text-[#111827] bg-white border border-[#534AB7] rounded px-2 py-0.5 outline-none w-36"
            />
          ) : (
            <span className="text-[13px] font-medium text-[#111827] cursor-pointer hover:text-[#534AB7]" onClick={() => setIsEditingName(true)}>
              {projectName}
            </span>
          )}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            className="bg-[#EEEDFE] text-[#3C3489] text-[11px] font-medium rounded-full px-[10px] py-[2px] border-none outline-none cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleRunCode} className="flex items-center gap-1.5 bg-[#059669] text-white px-3 py-[6px] rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run
          </button>
          <button onClick={handleAnalyze} className="flex items-center gap-1.5 bg-[#534AB7] text-white px-3 py-[6px] rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Analyze
          </button>
          <button onClick={handleSave} className="border border-[#E5E7EB] text-[#111827] px-3 py-[6px] rounded-lg text-[12px] font-medium hover:bg-gray-50 transition-colors">
            Save
          </button>
          <div className="w-8 h-8 bg-[#534AB7] rounded-full flex items-center justify-center text-white text-[12px] font-medium">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <div className="w-14 bg-[#F0F1F3] border-r border-[#E5E7EB] flex flex-col items-center py-2 gap-1 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${sidebarOpen ? 'bg-[#EEEDFE]' : 'hover:bg-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={sidebarOpen ? '#534AB7' : '#9CA3AF'} strokeWidth="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </button>
          <button
            onClick={() => setConsoleOpen(!consoleOpen)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${consoleOpen ? 'bg-[#EEEDFE]' : 'hover:bg-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={consoleOpen ? '#534AB7' : '#9CA3AF'} strokeWidth="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          </button>
          <div className="mt-auto">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>

        {/* FILE EXPLORER (collapsible) */}
        {sidebarOpen && (
          <div className="w-[220px] bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">Explorer</p>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-[13px] text-[#9CA3AF] text-center">Open or create a file to start.</p>
            </div>
          </div>
        )}

        {/* CENTER: Editor + Console */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* EXERCISE CONTEXT PANEL */}
          {exerciseContext && !isCreatingProject && (
            <ExerciseContextPanel
              context={exerciseContext}
              onDismiss={() => {
                setExerciseContext(null);
                setIsPanelCollapsed(false);
              }}
              isCollapsed={isPanelCollapsed}
              onToggleCollapse={() => setIsPanelCollapsed(p => !p)}
            />
          )}
          {/* EDITOR */}
          <div className="flex-1 overflow-hidden">
            {code || true ? (
              <MonacoEditor
                height="100%"
                language={LANG_MAP[language] ?? 'plaintext'}
                value={code}
                onChange={val => setCode(val ?? '')}
                theme="vs"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineHeight: 1.6,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'line',
                  lineNumbers: 'on',
                  padding: { top: 12 },
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                <p className="text-[14px] text-[#9CA3AF] mt-4">Open a file from the explorer to start</p>
                <p className="text-[12px] text-[#C4C4C4] mt-1">Ctrl+S to save</p>
              </div>
            )}
          </div>

          {/* STATUS BAR */}
          <div className="h-6 bg-[#534AB7] flex items-center px-3 text-white text-[11px] shrink-0">
            <span>{language}</span>
            <span className="mx-3">UTF-8</span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
              Conectado
            </span>
          </div>

          {/* CONSOLE */}
          {consoleOpen && (
            <div className="h-[200px] bg-[#1E1E2E] border-t border-[#E5E7EB] flex flex-col shrink-0">
              <div className="h-8 bg-[#2A2A3E] flex items-center px-3 shrink-0">
                <span className="text-[12px] text-white font-medium">{'>_'} Console</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setTermLines([])} className="text-[#9CA3AF] hover:text-white text-[11px]">Clear</button>
                  <button onClick={() => setConsoleOpen(false)} className="text-[#9CA3AF] hover:text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[13px]">
                {termLines.length === 0 && <p className="text-[#6B7280]">Run your code to see output here...</p>}
                {termLines.map((line, i) => (
                  <div key={i} className={line.type === 'error' ? 'text-red-400' : line.type === 'input' ? 'text-[#6B7280]' : 'text-[#A6E3A1]'}>
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI PANEL */}
        {aiPanelOpen && (
          <div className="w-[320px] bg-white border-l border-[#E5E7EB] flex flex-col shrink-0">
            {/* Header */}
            <div className="h-12 border-b border-[#E5E7EB] flex items-center px-4 shrink-0">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full mr-2" />
              <span className="text-[13px] font-medium text-[#111827]">AI Tutor</span>
              <button onClick={() => setAiPanelOpen(false)} className="ml-auto text-[#9CA3AF] hover:text-[#111827]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-9 h-9 bg-[#EEEDFE] rounded-full flex items-center justify-center mr-2 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#534AB7] text-white rounded-tr-none'
                      : 'bg-[#F8F9FA] border border-[#E5E7EB] text-[#111827] rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-9 h-9 bg-[#EEEDFE] rounded-full flex items-center justify-center mr-2 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </div>
                  <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl rounded-tl-none px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-4 py-2 border-t border-[#E5E7EB] flex flex-wrap gap-[6px]">
              <button
                onClick={handleAnalyze}
                className="bg-[#F0F1F3] text-[#4B5563] border border-[#E5E7EB] rounded-full px-3 py-1 text-[11px] font-medium hover:bg-[#EEEDFE] hover:text-[#534AB7] hover:border-[#CECBF6] transition-colors"
              >
                Analizar código
              </button>
              <button
                onClick={() => { setChatInput('¿Qué debería hacer ahora?'); }}
                className="bg-[#F0F1F3] text-[#4B5563] border border-[#E5E7EB] rounded-full px-3 py-1 text-[11px] font-medium hover:bg-[#EEEDFE] hover:text-[#534AB7] hover:border-[#CECBF6] transition-colors"
              >
                Sugerir siguiente paso
              </button>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#E5E7EB]">
              <div className="relative">
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-[10px] px-3 py-[10px] pr-11 text-[13px] text-[#111827] placeholder-[#9CA3AF] resize-none outline-none focus:border-[#534AB7] min-h-[44px] max-h-[120px]"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    chatInput.trim() ? 'bg-[#534AB7] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Panel toggle (when closed) */}
        {!aiPanelOpen && (
          <button
            onClick={() => setAiPanelOpen(true)}
            className="w-10 bg-white border-l border-[#E5E7EB] flex items-center justify-center hover:bg-[#F8F9FA] transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}

        {/* Loading overlay while creating project */}
        {isCreatingProject && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 gap-3">
            <svg className="animate-spin h-6 w-6 text-[#534AB7]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-[#534AB7] text-sm font-medium">Preparing your exercise...</p>
          </div>
        )}
      </div>

      {/* Mobile warning */}
      <div className="md:hidden fixed inset-0 bg-white z-[100] flex items-center justify-center p-8">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto mb-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <p className="text-[15px] font-medium text-[#111827]">Desktop required</p>
          <p className="text-[13px] text-[#4B5563] mt-2">Please use a desktop browser for the code editor.</p>
        </div>
      </div>
    </div>
  );
}
