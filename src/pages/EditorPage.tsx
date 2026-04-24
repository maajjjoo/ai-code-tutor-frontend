import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityBar, type ActivityView } from '../components/layout/ActivityBar';
import { StatusBar } from '../components/layout/StatusBar';
import { FilesSidebar } from '../components/sidebar/FilesSidebar';
import { LearnSidebar } from '../components/sidebar/LearnSidebar';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ExercisePanel } from '../components/editor/ExercisePanel';
import { TerminalPanel, type TerminalLine } from '../components/editor/TerminalPanel';
import { AIPanel } from '../components/ai/AIPanel';
import type { LearnTopic, Language } from '../types';
import type { VNode } from '../types/vfs';
import { Terminal, Save } from 'lucide-react';

interface StoredUser { id: number; username: string; email: string; }

// Datos mínimos del archivo abierto para el editor y status bar
interface OpenFile { name: string; content: string; language: Language; }

export function EditorPage() {
  const navigate = useNavigate();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  const [activity, setActivity] = useState<ActivityView>('files');
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [code, setCode] = useState('');
  const [activeTopic, setActiveTopic] = useState<LearnTopic | null>(null);
  const [activeTopicLang, setActiveTopicLang] = useState<Language>('javascript');
  const [exerciseContext, setExerciseContext] = useState<{ statement: string; code: string } | null>(null);
  // Estado del sistema de archivos virtual — vive aquí para que persista entre re-renders
  const [fsNodes, setFsNodes] = useState<VNode[]>([]);
  const [fsActiveId, setFsActiveId] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [canValidate, setCanValidate] = useState(false);
  const [hasAiWarning, setHasAiWarning] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(288);
  const [isSaved, setIsSaved] = useState(false);
  const [isResizingAiPanel, setIsResizingAiPanel] = useState(false);
  const aiPanelResizerRef = useRef<HTMLDivElement>(null);

  // Warn before closing if there is unsaved code
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (code.trim() && !isSaved) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [code, isSaved]);

  // Load saved content from localStorage for a given file
  const loadSavedContent = (fileName: string, defaultContent: string): string => {
    const storageKey = `saved-project-0-file-${fileName}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.fileContent ?? defaultContent;
      } catch { /* ignore */ }
    }
    return defaultContent;
  };

  const handleSaveCode = () => {
    if (!openFile || !code.trim()) return;
    const storageKey = `saved-project-0-file-${openFile.name}`;
    localStorage.setItem(storageKey, JSON.stringify({
      fileName: openFile.name,
      fileContent: code,
      savedAt: new Date().toISOString(),
      projectId: 0,
    }));
    setIsSaved(true);
  };

  // Cuando el sidebar abre un archivo — recupera contenido guardado si existe
  const handleOpenFile = (name: string, content: string, language: Language) => {
    const restoredContent = loadSavedContent(name, content);
    setOpenFile({ name, content: restoredContent, language });
    setCode(restoredContent);
    setIsSaved(true); // content matches what's in localStorage
    setActiveTopic(null);
    setErrorCount(0);
    setCanValidate(false);
    setHasAiWarning(false);
  };

  const handleSelectTopic = (topic: LearnTopic, language: Language) => {
    setActiveTopic(topic);
    setActiveTopicLang(language);
    setOpenFile(null);
  };

  const handleLangChange = (language: Language) => {
    setActiveTopicLang(language);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAiPanelResizerMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizingAiPanel(true);
    const startX = event.clientX;
    const startWidth = aiPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Dragging left increases width, dragging right decreases
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(200, Math.min(600, startWidth + delta));
      setAiPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingAiPanel(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [aiPanelWidth]);

  // EditorData mínimo para el CodeEditor y AIPanel (sin projectId real cuando es archivo local)
  const editorData = openFile ? {
    projectId: 0,
    projectName: openFile.name,
    language: openFile.language,
    currentCode: openFile.content,
    versionNumber: 0,
  } : null;

  return (
    <div className="flex flex-col h-screen bg-[#0d0d14] text-[#cccccc] overflow-hidden font-mono">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar active={activity} onChange={setActivity} />

        {/* Sidebar */}
        <div className="w-56 bg-[#0d0d14] border-r border-[#ffffff08] flex flex-col overflow-hidden shrink-0">
          {activity === 'files' && (
            <FilesSidebar
              userId={user.id}
              nodes={fsNodes}
              setNodes={setFsNodes}
              activeId={fsActiveId}
              setActiveId={setFsActiveId}
              onOpenFile={handleOpenFile}
            />
          )}
          {activity === 'learn' && (
            <LearnSidebar
              userId={user.id}
              onSelectTopic={handleSelectTopic}
              activeTopicId={activeTopic?.id ?? null}
              selectedLang={activeTopicLang}
              onLangChange={handleLangChange}
            />
          )}
          {activity === 'settings' && (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2 border-b border-[#ffffff08] shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280]">Settings</p>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 py-5 px-3 bg-[#161622] rounded-2xl border border-[#ffffff0a]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6f42c1] to-[#0e639c] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#6f42c1]/30 select-none">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{user.email}</p>
                  </div>
                  <div className="w-full h-px bg-[#ffffff08]" />
                  <div className="w-full flex items-center justify-between text-xs">
                    <span className="text-[#6b7280]">User ID</span>
                    <span className="text-[#9ca3af] font-mono bg-[#0d0d14] px-2 py-0.5 rounded">#{user.id}</span>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer">
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editor area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Editor / Exercise */}
            <div className="flex flex-1 overflow-hidden">
              {activeTopic ? (
                <ExercisePanel
                  topic={activeTopic}
                  language={activeTopicLang}
                  userId={user.id}
                  onAskHelp={(statement, code) => setExerciseContext({ statement, code })}
                />
              ) : (
                <CodeEditor
                  editorData={editorData}
                  code={code}
                  onChange={newCode => { setCode(newCode); setIsSaved(false); }}
                  onErrorCountChange={(count, validate) => {
                    setErrorCount(count);
                    setCanValidate(validate);
                  }}
                />
              )}
            </div>

            {/* Bottom bar — save button + terminal toggle */}
            {!terminalOpen && (
              <div className="flex items-center justify-between px-3 py-1 bg-[#080810] border-t border-[#1e1e2e] shrink-0">
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-[#585b70] hover:text-[#cdd6f4] cursor-pointer transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" /> Consola
                </button>

                {openFile && code.trim() && (
                  <button
                    onClick={handleSaveCode}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#89b4fa]/30 text-[#89b4fa] hover:bg-[#89b4fa]/10 cursor-pointer transition-colors"
                    aria-label="Guardar código"
                  >
                    <Save className="w-3 h-3" /> Guardar
                  </button>
                )}
              </div>
            )}

            {/* Terminal panel */}
            {terminalOpen && (
              <div className="h-48 shrink-0">
                <TerminalPanel
                  code={code}
                  language={openFile?.language ?? activeTopicLang}
                  lines={terminalLines}
                  running={terminalRunning}
                  onLines={setTerminalLines}
                  onRunning={setTerminalRunning}
                  onClose={() => setTerminalOpen(false)}
                />
              </div>
            )}
          </div>

          {/* AI Panel — hidden when exercise is active */}
          {!activeTopic && (
            <>
              {/* Resizer — wider hit area with visual indicator on hover */}
              <div
                ref={aiPanelResizerRef}
                onMouseDown={handleAiPanelResizerMouseDown}
                className="relative shrink-0 cursor-col-resize group"
                style={{ width: 8 }}
                aria-label="Redimensionar panel de IA"
              >
                <div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 transition-colors group-hover:bg-[#89b4fa]/50"
                  style={{ background: isResizingAiPanel ? 'rgba(137,180,250,0.6)' : 'transparent' }}
                />
              </div>
              <AIPanel
                editorData={editorData}
                code={code}
                exerciseContext={exerciseContext}
                width={aiPanelWidth}
                onAiResponse={(msg) => {
                  const lower = msg.toLowerCase();
                  if (['error', 'falta', 'incorrecto', 'problema', 'fallo'].some(w => lower.includes(w))) {
                    setHasAiWarning(true);
                  }
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        language={openFile?.language ?? activeTopic?.category ?? '—'}
        projectName={openFile?.name ?? activeTopic?.name ?? 'No file open'}
        version={0}
        username={user.username ?? ''}
        errorCount={errorCount}
        canValidate={canValidate}
        hasAiWarning={hasAiWarning}
        hasUnsavedChanges={!!openFile && !isSaved}
      />
    </div>
  );
}
