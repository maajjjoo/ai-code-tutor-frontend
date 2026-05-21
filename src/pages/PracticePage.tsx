import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { sendChatMessage, analyzeCodePedagogical, runCode, createProject, saveSnapshot } from '../services/api';
import type { Language, ExerciseContext, CodeAnalysisResponse, CodeSuggestion } from '../types';
import { ExerciseContextPanel } from '../components/practice/ExerciseContextPanel';

interface StoredUser { id: number; username: string; email: string; }
interface ChatMsg { id: string; role: 'user' | 'ai'; content: string; quality?: { structure: number; readability: number }; suggestions?: CodeSuggestion[]; timestamp: number; }
interface TermLine { type: 'input' | 'output' | 'error'; text: string; }

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

const FILE_EXT_COLORS: Record<string, string> = {
  py: '#3B82F6', java: '#F59E0B', js: '#EAB308',
  ts: '#6366F1', tsx: '#6366F1', jsx: '#EAB308',
  cpp: '#9CA3AF', cs: '#9CA3AF',
};

const LANG_DISPLAY: Record<string, { lang: string; ver: string }> = {
  python: { lang: 'Python', ver: '3.11' },
  java: { lang: 'Java', ver: '17' },
  javascript: { lang: 'JavaScript', ver: 'Node 20' },
  typescript: { lang: 'TypeScript', ver: '5.4' },
  cpp: { lang: 'C++', ver: '20' },
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
  return FILE_EXT_COLORS[getFileExt(filename)] ?? '#D1D5DB';
}

function fmtTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function QualityBar({ label, score }: { label: string; score: number }) {
  const fillColor = label === 'Readability' && score < 70 ? '#F59E0B' : '#534AB7';
  return (
    <div className="flex items-center gap-[10px]">
      <span className="text-[12px] text-[#6B7280] min-w-[80px]">{label}</span>
      <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: fillColor }} />
      </div>
      <span className="text-[12px] font-semibold min-w-[32px] text-right" style={{ color: fillColor }}>{score}%</span>
    </div>
  );
}

function AiMessageBubble({ msg }: { msg: ChatMsg }) {
  const isAi = msg.role === 'ai';
  if (isAi) {
    const hasQuality = msg.quality && msg.quality.structure !== undefined;
    const hasSuggestions = msg.suggestions && msg.suggestions.length > 0;
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-[8px]">
          <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span className="text-[12px] font-medium text-[#534AB7]">AI Tutor</span>
          <span className="text-[11px] text-[#9CA3AF] ml-auto">{fmtTime(msg.timestamp)}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] p-[12px_14px] space-y-[10px]">
          {hasQuality && msg.quality && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Code quality</p>
              <QualityBar label="Structure" score={msg.quality.structure} />
              <div className="mt-[6px]">
                <QualityBar label="Readability" score={msg.quality.readability} />
              </div>
            </div>
          )}
          {(hasQuality && msg.quality) && <div className="h-[0.5px] bg-[#F3F4F6]" />}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">What your code does</p>
            <p className="text-[12px] text-[#4B5563] leading-relaxed whitespace-pre-wrap">
              {msg.content.split(/(`[^`]+`)/).map((part, i) =>
                part.startsWith('`') && part.endsWith('`')
                  ? <code key={i} className="bg-[#EEEDFE] text-[#3C3489] rounded-[4px] px-[6px] py-[1px] text-[11px] font-mono">{part.slice(1, -1)}</code>
                  : <span key={i}>{part}</span>
              )}
            </p>
          </div>
          {hasSuggestions && msg.suggestions && <div className="h-[0.5px] bg-[#F3F4F6]" />}
          {hasSuggestions && msg.suggestions && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Suggestions</p>
              {msg.suggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-[8px] py-[6px] ${i < msg.suggestions!.length - 1 ? 'border-b border-[#F9FAFB]' : ''}`}>
                  <div className="w-[20px] h-[20px] bg-[#534AB7] text-white text-[11px] font-semibold rounded-full flex items-center justify-center shrink-0 mt-[1px]">
                    {i + 1}
                  </div>
                  <span className="text-[12px] text-[#4B5563] leading-relaxed">{s.title}: {s.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end mb-5">
      <div className="flex items-center gap-2 justify-end mb-[2px]">
        <span className="text-[11px] text-[#9CA3AF]">{fmtTime(msg.timestamp)}</span>
      </div>
      <div className="bg-[#534AB7] text-white rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-[10px] px-[14px] py-[10px] max-w-[85%] text-[12px] leading-relaxed">
        {msg.content}
      </div>
    </div>
  );
}

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [projectName, setProjectName] = useState('My Project');
  const [isEditingName, setIsEditingName] = useState(false);
  const [files, setFiles] = useState<{ name: string; content: string }[]>(DEFAULT_FILES.python);
  const [activeFile, setActiveFile] = useState(0);
  const [unsaved, setUnsaved] = useState(false);

  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'Terminal' | 'Output' | 'Problems'>('Terminal');
  const [termLines, setTermLines] = useState<TermLine[]>([]);

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'welcome', role: 'ai', content: 'Welcome! I\'m your AI tutor. Ask me anything or analyze your code to get started.', timestamp: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    try {
      const listKey = `practice-projects-${user.id}`;
      const list = localStorage.getItem(listKey);
      if (list) setSavedProjects(JSON.parse(list));
    } catch {}
  }, [user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSave = useCallback(() => {
    const key = `practice-save-${user.id}`;
    localStorage.setItem(key, JSON.stringify({ code, language, projectName, savedAt: new Date().toISOString() }));
    setUnsaved(false);
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
    const now = Date.now();
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: 'Analyze my code', timestamp: now };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const result: CodeAnalysisResponse = await analyzeCodePedagogical({
        code, language, projectDescription: projectName,
        exerciseContext: exerciseContext ? { prompt: exerciseContext.exercisePrompt, lessonTitle: exerciseContext.lessonTitle, level: exerciseContext.level } : undefined,
      });
      let fullContent = result.summary;
      if (result.hasErrors && result.errorHint) {
        fullContent += `\n\nError detected: ${result.errorHint}`;
      }
      const aiMsg: ChatMsg = { id: uid(), role: 'ai', content: fullContent, suggestions: result.suggestions, timestamp: Date.now() };
      if (result.quality) { aiMsg.quality = result.quality; }
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Could not analyze your code right now. Please try again.', timestamp: Date.now() }]);
    } finally {
      setChatLoading(false);
    }
  }, [code, language, projectName, exerciseContext]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === 'ai' ? 'ai' as const : 'user' as const, content: m.content }));
      const res = await sendChatMessage({ message: text, history, currentCode: code, language });
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: res.message, timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { id: uid(), role: 'ai', content: 'Connection error. Please try again.', timestamp: Date.now() }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, messages, code, language]);

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;
    setConsoleOpen(true);
    setConsoleTab('Output');
    setTermLines(prev => [...prev, { type: 'input', text: `$ python ${files[activeFile]?.name ?? 'main.py'}` }]);
    try {
      const res = await runCode({ code, language });
      if (res.stdout) setTermLines(prev => [...prev, { type: 'output', text: res.stdout }]);
      if (res.stderr) setTermLines(prev => [...prev, { type: 'error', text: res.stderr }]);
      if (!res.stdout && !res.stderr) setTermLines(prev => [...prev, { type: 'output', text: '(no output)' }]);
      setTermLines(prev => [...prev, { type: 'output', text: 'Process finished with exit code 0' }]);
    } catch {
      setTermLines(prev => [...prev, { type: 'error', text: 'Error executing code' }]);
    }
  }, [code, language, files, activeFile]);

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

  const handleNewCode = useCallback((val: string | undefined) => {
    setCode(val ?? '');
    setUnsaved(true);
  }, []);

  const disp = LANG_DISPLAY[language] ?? { lang: language, ver: '' };

  return (
    <div className="h-screen w-screen grid grid-cols-[220px_1fr_320px] overflow-hidden bg-white">

      {/* ═══ COLUMN 1 — SIDEBAR ═══ */}
      <div className="bg-white border-r border-[#E5E7EB] flex flex-col overflow-hidden p-3">

        <button onClick={handleCreateNewProject} className="w-full flex items-center gap-[10px] bg-white border border-[#E5E7EB] rounded-[10px] px-[14px] py-[10px] text-[13px] font-medium text-[#111827] cursor-pointer hover:bg-[#F9FAFB] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New project
        </button>

        <div className="flex-1 overflow-y-auto mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Current</p>

          <div className="flex items-center gap-[8px] bg-[#EEEDFE] rounded-[8px] px-[10px] py-[8px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span
              className="text-[13px] font-medium text-[#3C3489] truncate cursor-pointer"
              onClick={() => setIsEditingName(true)}
            >
              {projectName}
            </span>
            {isEditingName && (
              <input
                autoFocus
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                className="text-[13px] font-medium text-[#3C3489] bg-transparent border border-[#534AB7] rounded px-1 py-0 outline-none w-full"
              />
            )}
          </div>

          <div className="mt-[4px]">
            {files.map((f, i) => (
              <div
                key={i}
                onClick={() => setActiveFile(i)}
                className={`flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] cursor-pointer transition-colors ${i === activeFile ? 'bg-[#EEEDFE]' : 'hover:bg-[#F9FAFB]'}`}
                style={{ paddingLeft: '22px' }}
              >
                <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(f.name) }} />
                <span className={`text-[13px] truncate ${i === activeFile ? 'font-medium text-[#111827]' : 'text-[#9CA3AF]'}`}>{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[0.5px] bg-[#E5E7EB] my-3" />

        <div className="overflow-y-auto max-h-[180px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">Saved projects</p>
          {savedProjects.length === 0 && <p className="text-[11px] text-[#9CA3AF] px-1 py-1">No saved projects yet</p>}
          {savedProjects.map((p, i) => (
            <div
              key={i}
              onClick={() => handleSavedProjectClick(p)}
              className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[4px] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-[14px] h-[14px] bg-[#534AB7] border border-[#534AB7] rounded-[3px] flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span className="text-[13px] text-[#6B7280] truncate hover:text-[#111827]">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ COLUMN 2 — EDITOR ═══ */}
      <div className="flex flex-col overflow-hidden bg-white">
        {exerciseContext && !isCreatingProject && (
          <ExerciseContextPanel context={exerciseContext} onDismiss={() => { setExerciseContext(null); setIsPanelCollapsed(false); }} isCollapsed={isPanelCollapsed} onToggleCollapse={() => setIsPanelCollapsed(p => !p)} />
        )}

        {/* Tab bar */}
        <div className="h-[40px] bg-white border-b border-[#E5E7EB] flex items-center shrink-0 px-3">
          <div className="flex items-center h-full flex-1 overflow-x-auto">
            {files.map((f, i) => (
              <div
                key={i}
                onClick={() => setActiveFile(i)}
                className={`flex items-center gap-[6px] px-[14px] h-full text-[12px] cursor-pointer transition-colors shrink-0 ${
                  i === activeFile ? 'bg-white border-b-2 border-[#534AB7] text-[#111827] font-medium' : 'text-[#9CA3AF] hover:bg-[#F3F4F6]'
                }`}
              >
                <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(f.name) }} />
                <span className="truncate max-w-[100px]">{f.name}</span>
                {unsaved && i === activeFile && <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B] shrink-0" />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-[8px] ml-auto shrink-0">
            <div className="flex items-center gap-[6px] bg-[#EEEDFE] text-[#3C3489] rounded-[6px] px-[10px] py-[3px]">
              <span className="text-[11px] font-medium">{disp.lang}</span>
              <svg width="1" height="12" viewBox="0 0 1 12" fill="#3C3489" opacity="0.3"><rect width="1" height="12" rx="0.5"/></svg>
              <span className="text-[11px] text-[#9CA3AF]">{disp.ver}</span>
            </div>
            <button onClick={handleRunCode} className="flex items-center gap-[6px] bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] rounded-[8px] px-[14px] py-[5px] text-[12px] font-medium cursor-pointer hover:bg-[#D1FAE5] transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#0F6E56"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run
            </button>
          </div>
        </div>

        {/* Editor body */}
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
        <div className="h-[22px] bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center px-3 text-[11px] text-[#9CA3AF] gap-4 shrink-0">
          <span className="flex items-center gap-[4px] text-[#0F6E56]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#5DCAA5]" />
            Connected
          </span>
          <span>Ln 4, Col 18</span>
          <span className="capitalize">{language}</span>
          <span className="ml-auto">UTF-8</span>
        </div>

        {/* Console */}
        {consoleOpen && (
          <div className="h-[150px] bg-[#FAFAFA] border-t border-[#E5E7EB] flex flex-col shrink-0">
            <div className="h-[32px] bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center px-[14px] gap-4 shrink-0">
              <button onClick={() => setConsoleTab('Terminal')} className={`text-[12px] cursor-pointer ${consoleTab === 'Terminal' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Terminal</button>
              <button onClick={() => setConsoleTab('Output')} className={`text-[12px] cursor-pointer ${consoleTab === 'Output' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Output</button>
              <button onClick={() => setConsoleTab('Problems')} className={`text-[12px] cursor-pointer ${consoleTab === 'Problems' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Problems</button>
              <span className="text-[11px] text-[#9CA3AF] ml-auto flex items-center gap-1 cursor-pointer hover:text-[#6B7280]" onClick={() => setTermLines([])}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                Clear
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-[14px] py-[10px] font-mono text-[12px] leading-relaxed">
              {termLines.length === 0 && consoleTab !== 'Problems' && <span className="text-[#9CA3AF]">Run your code to see output here...</span>}
              {consoleTab === 'Problems' && <span className="text-[#9CA3AF]">No problems detected</span>}
              {consoleTab !== 'Problems' && termLines.map((line, i) => (
                <div key={i} className={
                  line.type === 'error' ? 'text-[#DC2626]'
                  : line.type === 'input' ? 'text-[#534AB7]'
                  : line.type === 'output' ? 'text-[#059669]'
                  : 'text-[#9CA3AF]'
                }>{line.type === 'output' ? `  ${line.text}` : line.text}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ COLUMN 3 — AI PANEL ═══ */}
      <div className="bg-white border-l border-[#E5E7EB] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-[44px] border-b border-[#E5E7EB] flex items-center px-[14px] shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-[8px] h-[8px] rounded-full bg-[#5DCAA5]" />
            <span className="text-[13px] font-medium text-[#111827]">AI Tutor</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <button className="flex items-center gap-1 border border-[#E5E7EB] bg-transparent text-[#6B7280] rounded-[8px] px-[12px] py-[5px] text-[12px] font-medium cursor-pointer hover:bg-[#F9FAFB]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </button>
            <button onClick={handleAnalyze} className="flex items-center gap-1 bg-[#534AB7] text-white rounded-[8px] px-[12px] py-[5px] text-[12px] font-medium cursor-pointer hover:opacity-90 border-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
              Analyze
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-[14px] py-[14px]">
          {messages.map(msg => <AiMessageBubble key={msg.id} msg={msg} />)}
          {chatLoading && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-[8px]">
                <div className="w-[28px] h-[28px] bg-[#EEEDFE] rounded-[8px] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <span className="text-[12px] font-medium text-[#534AB7]">AI Tutor</span>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-tl-none rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] px-[14px] py-[10px] flex gap-[4px]">
                <span className="w-[6px] h-[6px] bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-[6px] h-[6px] bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-[6px] h-[6px] bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="px-3 pb-2 pt-1">
          <div className="flex flex-wrap gap-[6px] mb-[10px]">
            <button onClick={() => { setChatInput('Analyze my code'); }} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">
              Analyze code
            </button>
            <button onClick={() => { setChatInput('What should I do next?'); }} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">
              Next step?
            </button>
            <button onClick={() => { setChatInput('Explain what my code does'); }} className="bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC] rounded-full px-[12px] py-[4px] text-[11px] font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors">
              Explain this
            </button>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] px-3 py-3">
          <div className="flex items-center gap-[8px]">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Ask about your code..."
              rows={1}
              className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] px-[12px] py-[8px] text-[12px] text-[#111827] placeholder-[#9CA3AF] outline-none resize-none min-h-[36px] max-h-[100px] focus:border-[#534AB7] focus:bg-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 cursor-pointer border-none ${
                chatInput.trim() ? 'bg-[#534AB7] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
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
