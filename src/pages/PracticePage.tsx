import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { sendChatMessage, analyzeCodePedagogical, runCode, createProject, saveSnapshot } from '../services/api';
import type { Language, ExerciseContext, CodeAnalysisResponse } from '../types';
import { ExerciseContextPanel } from '../components/practice/ExerciseContextPanel';

interface StoredUser { id: number; username: string; email: string; }
interface ChatMsg { id: string; role: 'user' | 'ai'; content: string; quality?: { structure: number; readability: number }; }
interface TermLine { type: 'input' | 'output' | 'error'; text: string; }

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

const FILE_EXT_COLORS: Record<string, string> = {
  py: '#3B82F6', java: '#F59E0B', js: '#EAB308',
  ts: '#6366F1', tsx: '#6366F1', jsx: '#EAB308',
  cpp: '#9CA3AF', cs: '#9CA3AF',
};

const LANG_VERSION: Record<string, string> = {
  python: 'Python 3.11', java: 'Java 17',
  javascript: 'Node 20', typescript: 'TypeScript 5.4',
  cpp: 'C++20',
};

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

const DEFAULT_FILES: Record<string, { name: string; content: string }[]> = {
  python: [
    { name: 'main.py', content: 'def main():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    main()\n' },
  ],
  java: [
    { name: 'Main.java', content: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n' },
  ],
  javascript: [
    { name: 'index.js', content: 'function main() {\n    // Your code here\n}\n\nmain();\n' },
  ],
  typescript: [
    { name: 'index.ts', content: 'function main(): void {\n    // Your code here\n}\n\nmain();\n' },
  ],
  cpp: [
    { name: 'main.cpp', content: '#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}\n' },
  ],
};

const getStarterContent = (language: string, prompt: string): string => {
  const truncated = prompt.length > 80 ? prompt.substring(0, 80) + '...' : prompt;
  switch (language.toLowerCase()) {
    case 'python':
      return `# Exercise: ${truncated}\n# Write your solution below\n\ndef main():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    main()\n`;
    case 'java':
      return `// Exercise: ${truncated}\n// Write your solution below\n\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n`;
    case 'javascript':
      return `// Exercise: ${truncated}\n// Write your solution below\n\nfunction main() {\n    // Your code here\n}\n\nmain();\n`;
    case 'typescript':
      return `// Exercise: ${truncated}\n// Write your solution below\n\nfunction main(): void {\n    // Your code here\n}\n\nmain();\n`;
    default:
      return `// Exercise: ${truncated}\n// Write your solution below\n`;
  }
};

function getFileExt(filename: string): string {
  return filename.includes('.') ? filename.split('.').pop() ?? '' : '';
}

function getFileDotColor(filename: string): string {
  return FILE_EXT_COLORS[getFileExt(filename)] ?? '#9CA3AF';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function QualityBar({ label, score }: { label: string; score: number }) {
  const color = label === 'Readability' && score < 70 ? '#F59E0B' : '#534AB7';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#6B7280] min-w-[68px]">{label}</span>
      <div className="flex-1 h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-medium min-w-[26px] text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

function ConsoleTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`text-[11px] cursor-pointer ${active ? 'text-[#111827] font-medium' : 'text-[#9CA3AF]'}`}>
      {label}
    </button>
  );
}

function AiMessageBubble({ msg }: { msg: ChatMsg }) {
  const isAi = msg.role === 'ai';
  if (isAi) {
    const hasQuality = msg.quality && msg.quality.structure !== undefined;
    return (
      <div className="flex items-start gap-2 mb-4">
        <div className="w-6 h-6 bg-[#EEEDFE] rounded-md flex items-center justify-center shrink-0 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-medium text-[#534AB7]">AI Tutor</span>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-tr-md rounded-br-md rounded-bl-md p-2.5 space-y-2.5">
            {hasQuality && msg.quality && (
              <div>
                <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide mb-1">Code quality</p>
                <QualityBar label="Structure" score={msg.quality.structure} />
                <QualityBar label="Readability" score={msg.quality.readability} />
              </div>
            )}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide mb-1">What your code does</p>
              <p className="text-[11px] text-[#4B5563] leading-relaxed whitespace-pre-wrap">
                {msg.content.split(/(`[^`]+`)/).map((part, i) =>
                  part.startsWith('`') && part.endsWith('`')
                    ? <code key={i} className="bg-[#EEEDFE] text-[#3C3489] px-1 py-0.5 rounded-sm text-[10px] font-mono">{part.slice(1, -1)}</code>
                    : <span key={i}>{part}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-[#534AB7] text-white rounded-tr-md rounded-tl-md rounded-bl-md px-3 py-2 max-w-[85%] text-[11px] leading-relaxed">
        {msg.content}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  // Exercise context from lesson
  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [projectName, setProjectName] = useState('My Project');
  const [isEditingName, setIsEditingName] = useState(false);
  const [files, setFiles] = useState<{ name: string; content: string }[]>(DEFAULT_FILES.python);
  const [activeFile, setActiveFile] = useState(0);
  const [unsaved, setUnsaved] = useState(false);

  // Console
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'Terminal' | 'Output' | 'Problems'>('Terminal');
  const [termLines, setTermLines] = useState<TermLine[]>([]);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'welcome', role: 'ai', content: 'Welcome! I\'m your AI tutor. Ask me anything or analyze your code to get started.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Saved projects list
  const [savedProjects, setSavedProjects] = useState<{ name: string; language: string }[]>([]);

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
      const lang = ctx.language.toLowerCase() as Language;
      setLanguage(lang);
      setFiles(DEFAULT_FILES[lang] ?? DEFAULT_FILES.python);
      const fileContent = getStarterContent(ctx.language, ctx.exercisePrompt);
      setCode(fileContent);
      setActiveFile(0);
      try { await saveSnapshot({ content: fileContent, versionLabel: 'Initial exercise code', projectId: project.id }); } catch {}
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
    } catch {}
  }, []);

  // Load saved on mount
  useEffect(() => {
    const key = `practice-save-${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.code) setCode(parsed.code);
        if (parsed.language) {
          const lang = parsed.language as Language;
          setLanguage(lang);
          setFiles(DEFAULT_FILES[lang] ?? DEFAULT_FILES.python);
        }
        if (parsed.projectName) setProjectName(parsed.projectName);
      } catch {}
    }
    // Load saved projects list
    try {
      const listKey = `practice-projects-${user.id}`;
      const list = localStorage.getItem(listKey);
      if (list) setSavedProjects(JSON.parse(list));
    } catch {}
  }, [user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ctrl+S
  const handleSave = useCallback(() => {
    const key = `practice-save-${user.id}`;
    localStorage.setItem(key, JSON.stringify({ code, language, projectName, savedAt: new Date().toISOString() }));
    setUnsaved(false);
    // Add to saved projects
    const listKey = `practice-projects-${user.id}`;
    const list: { name: string; language: string }[] = JSON.parse(localStorage.getItem(listKey) ?? '[]');
    const existing = list.findIndex(p => p.name === projectName);
    const entry = { name: projectName, language };
    if (existing >= 0) list[existing] = entry; else list.unshift(entry);
    if (list.length > 20) list.length = 20;
    localStorage.setItem(listKey, JSON.stringify(list));
    setSavedProjects(list);
  }, [code, language, projectName, user.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) return;
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: 'Analyze my code' };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const result: CodeAnalysisResponse = await analyzeCodePedagogical({
        code, language, projectDescription: projectName,
        exerciseContext: exerciseContext ? { prompt: exerciseContext.exercisePrompt, lessonTitle: exerciseContext.lessonTitle, level: exerciseContext.level } : undefined,
      });
      let fullContent = result.summary;
      if (result.suggestions.length > 0) {
        fullContent += '\n\nSuggestions:\n' + result.suggestions.map(s => `- ${s.title}: ${s.description}`).join('\n');
      }
      if (result.hasErrors && result.errorHint) {
        fullContent += `\n\nError detected: ${result.errorHint}`;
      }
      const aiMsg: ChatMsg = { id: uid(), role: 'ai', content: fullContent };
      if (result.quality) { aiMsg.quality = result.quality; }
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Could not analyze your code right now. Please try again.' }]);
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
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Connection error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, messages, code, language]);

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;
    setConsoleOpen(true);
    setConsoleTab('Output');
    setTermLines(prev => [...prev, { type: 'input', text: `$ Running ${language}...` }]);
    try {
      const res = await runCode({ code, language });
      if (res.stdout) setTermLines(prev => [...prev, { type: 'output', text: res.stdout }]);
      if (res.stderr) setTermLines(prev => [...prev, { type: 'error', text: res.stderr }]);
      if (!res.stdout && !res.stderr) setTermLines(prev => [...prev, { type: 'output', text: '(no output)' }]);
    } catch {
      setTermLines(prev => [...prev, { type: 'error', text: 'Error executing code' }]);
    }
  }, [code, language]);

  const handleCreateNewProject = useCallback(() => {
    setFiles(DEFAULT_FILES[language] ?? DEFAULT_FILES.python);
    setCode(DEFAULT_FILES[language]?.[0]?.content ?? '');
    setActiveFile(0);
    setProjectName('Untitled Project');
    setTermLines([]);
    setUnsaved(true);
  }, [language]);

  const handleSavedProjectClick = useCallback((p: { name: string; language: string }) => {
    const key = `practice-save-${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCode(parsed.code ?? '');
        setLanguage(parsed.language as Language ?? p.language as Language);
        setProjectName(p.name);
        setFiles(DEFAULT_FILES[parsed.language as Language ?? p.language as Language] ?? DEFAULT_FILES.python);
        setActiveFile(0);
      } catch {}
    }
  }, [user.id]);

  const handleQuickAction = useCallback((action: string) => {
    setChatInput(action);
  }, []);

  const handleNewCode = useCallback((val: string | undefined) => {
    setCode(val ?? '');
    setUnsaved(true);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      {/* ═══ TOP BAR ═══ */}
      <div className="h-[38px] bg-white border-b border-[#E5E7EB] flex items-center px-3 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-6 h-6 bg-[#534AB7] rounded-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span className="text-[12px] font-medium text-[#111827] hidden sm:inline">AICodeTutor</span>
        </div>
        <div className="w-px h-4 bg-[#E5E7EB] mx-2" />
        {isEditingName ? (
          <input autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} onBlur={() => setIsEditingName(false)} onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)} className="text-[12px] font-medium text-[#111827] bg-white border border-[#534AB7] rounded px-2 py-0.5 outline-none w-36" />
        ) : (
          <span className="text-[12px] font-medium text-[#111827] cursor-pointer hover:text-[#534AB7]" onClick={() => setIsEditingName(true)}>{projectName}</span>
        )}
        <div className="flex-1" />
        <button onClick={handleSave} className="border border-[#E5E7EB] text-[#6B7280] px-2.5 py-1 rounded-md text-[11px] font-medium hover:bg-[#F9FAFB] cursor-pointer">Save</button>
        <div className="w-6 h-6 bg-[#534AB7] rounded-full flex items-center justify-center text-white text-[10px] font-medium ml-2">{user.username?.charAt(0).toUpperCase() || 'U'}</div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="w-[200px] bg-[#F8F9FA] border-r border-[#E5E7EB] flex flex-col shrink-0 overflow-hidden">
          {/* New project button */}
          <div className="p-2.5 border-b border-[#E5E7EB]">
            <button onClick={handleCreateNewProject} className="w-full flex items-center justify-center gap-1.5 bg-[#534AB7] text-white rounded-lg px-3 py-2 text-[11px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New project
            </button>
          </div>

          {/* Current project files */}
          <div className="flex-1 overflow-y-auto px-2 py-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] px-1 py-1">Current</p>
            <div className="flex items-center gap-2 bg-[#EEEDFE] rounded-lg px-2 py-1.5 mb-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span className="text-[11px] font-medium text-[#3C3489] truncate">{projectName}</span>
            </div>
            <div className="pl-[18px]">
              {files.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setActiveFile(i)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors ${i === activeFile ? 'bg-[#EEEDFE]' : 'hover:bg-[#F3F4F6]'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(f.name) }} />
                  <span className={`text-[11px] truncate ${i === activeFile ? 'text-[#534AB7] font-medium' : 'text-[#6B7280]'}`}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Saved projects */}
          <div className="border-t border-[#E5E7EB] px-2 py-2 overflow-y-auto max-h-[180px]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] px-1 py-0.5">Saved projects</p>
            {savedProjects.length === 0 && <p className="text-[10px] text-[#9CA3AF] px-1 py-1">No saved projects yet</p>}
            {savedProjects.map((p, i) => (
              <div key={i} onClick={() => handleSavedProjectClick(p)} className="flex items-center gap-1.5 px-1.5 py-1 rounded-md cursor-pointer hover:bg-[#F3F4F6] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span className="text-[11px] text-[#9CA3AF] truncate hover:text-[#6B7280]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CENTER: Editor + Console ═══ */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Exercise context panel */}
          {exerciseContext && !isCreatingProject && (
            <ExerciseContextPanel context={exerciseContext} onDismiss={() => { setExerciseContext(null); setIsPanelCollapsed(false); }} isCollapsed={isPanelCollapsed} onToggleCollapse={() => setIsPanelCollapsed(p => !p)} />
          )}

          {/* Tab bar */}
          <div className="h-[38px] bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center shrink-0">
            <div className="flex items-center h-full flex-1 overflow-x-auto">
              {files.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setActiveFile(i)}
                  className={`flex items-center gap-1.5 px-3 h-full text-[11px] border-b-2 cursor-pointer transition-colors shrink-0 ${
                    i === activeFile ? 'bg-white border-[#534AB7] text-[#534AB7]' : 'border-transparent text-[#9CA3AF] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(f.name) }} />
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  {unsaved && i === activeFile && <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 shrink-0">
              <span className="bg-[#EEEDFE] text-[#3C3489] rounded-sm px-2 py-0.5 text-[10px] font-medium">{LANG_VERSION[language]}</span>
              <button onClick={handleRunCode} className="flex items-center gap-1 bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:bg-[#D1FAE5] transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run
              </button>
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 flex overflow-hidden">
            <MonacoEditor
              height="100%"
              width="100%"
              language={LANG_MAP[language] ?? 'plaintext'}
              value={code}
              onChange={handleNewCode}
              theme="vs"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.7,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
                lineNumbers: 'on',
                padding: { top: 14 },
                wordWrap: 'on',
                glyphMargin: false,
                folding: false,
                lineNumbersMinChars: 3,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </div>

          {/* Status bar */}
          <div className="h-[22px] bg-[#F3F4F6] border-t border-[#E5E7EB] flex items-center px-3 text-[10px] text-[#9CA3AF] gap-4 shrink-0">
            <span className="flex items-center gap-1 text-[#0F6E56]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5DCAA5]" />
              Connected
            </span>
            <span>Ln 1, Col 1</span>
            <span className="capitalize">{language}</span>
            <span className="ml-auto">UTF-8</span>
            <span>Ctrl+S to save</span>
          </div>

          {/* Console */}
          {consoleOpen && (
            <div className="h-[110px] border-t border-[#E5E7EB] flex flex-col shrink-0">
              <div className="h-7 bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center px-3 gap-3 shrink-0">
                <ConsoleTab label="Terminal" active={consoleTab === 'Terminal'} onClick={() => setConsoleTab('Terminal')} />
                <ConsoleTab label="Output" active={consoleTab === 'Output'} onClick={() => setConsoleTab('Output')} />
                <ConsoleTab label="Problems" active={consoleTab === 'Problems'} onClick={() => setConsoleTab('Problems')} />
                <span className="text-[10px] text-[#9CA3AF] ml-auto cursor-pointer hover:text-[#6B7280]" onClick={() => setTermLines([])}>Clear</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-[#FAFAFA] px-3.5 py-2 font-mono text-[11px] leading-relaxed">
                {termLines.length === 0 && consoleTab !== 'Problems' && <span className="text-[#9CA3AF]">Run your code to see output here...</span>}
                {consoleTab === 'Problems' && <span className="text-[#9CA3AF]">No problems detected</span>}
                {consoleTab !== 'Problems' && termLines.map((line, i) => (
                  <div key={i} className={
                    line.type === 'error' ? 'text-[#DC2626]'
                    : line.type === 'input' ? 'text-[#534AB7]'
                    : line.type === 'output' ? 'text-[#059669]'
                    : 'text-[#9CA3AF]'
                  }>{line.text}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT AI PANEL ═══ */}
        <div className="w-[300px] bg-white border-l border-[#E5E7EB] flex flex-col shrink-0">
          {/* Panel header */}
          <div className="h-11 border-b border-[#E5E7EB] flex items-center px-3.5 gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#5DCAA5]" />
            <span className="text-[13px] font-medium text-[#111827] flex-1">AI Tutor</span>
            <button className="border border-[#E5E7EB] bg-transparent text-[#6B7280] rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:bg-[#F9FAFB]">History</button>
            <button onClick={handleAnalyze} className="bg-[#534AB7] text-white rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:opacity-90">Analyze</button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.map(msg => <AiMessageBubble key={msg.id} msg={msg} />)}
            {chatLoading && (
              <div className="flex items-start gap-2 mb-4">
                <div className="w-6 h-6 bg-[#EEEDFE] rounded-md flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-tr-md rounded-br-md rounded-bl-md px-3 py-2 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick action chips */}
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            <button onClick={() => handleQuickAction('Analyze my code')} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-2.5 py-1 text-[10px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">Analyze code</button>
            <button onClick={() => handleQuickAction('What should I do next?')} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-2.5 py-1 text-[10px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">Next step?</button>
            <button onClick={() => handleQuickAction('Explain what my code does')} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-2.5 py-1 text-[10px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">Explain this</button>
          </div>

          {/* Input area */}
          <div className="border-t border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAFA]">
            <div className="flex items-center gap-1.5">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Ask the AI tutor..."
                className="flex-1 border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[11px] text-[#111827] placeholder-[#9CA3AF] outline-none h-8 focus:border-[#534AB7]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 cursor-pointer ${
                  chatInput.trim() ? 'bg-[#534AB7] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isCreatingProject && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 gap-3">
            <svg className="animate-spin h-6 w-6 text-[#534AB7]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
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
