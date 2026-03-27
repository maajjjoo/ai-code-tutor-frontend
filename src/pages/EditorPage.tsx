import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityBar, type ActivityView } from '../components/layout/ActivityBar';
import { StatusBar } from '../components/layout/StatusBar';
import { FilesSidebar } from '../components/sidebar/FilesSidebar';
import { LearnSidebar } from '../components/sidebar/LearnSidebar';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ExercisePanel } from '../components/editor/ExercisePanel';
import { AIPanel } from '../components/ai/AIPanel';
import type { LearnTopic, Language } from '../types';
import type { VNode } from '../types/vfs';

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
  // Estado del sistema de archivos virtual — vive aquí para que persista entre re-renders
  const [fsNodes, setFsNodes] = useState<VNode[]>([]);
  const [fsActiveId, setFsActiveId] = useState<string | null>(null);

  // Cuando el sidebar abre un archivo (virtual o del disco o del backend)
  const handleOpenFile = (name: string, content: string, language: Language) => {
    setOpenFile({ name, content, language });
    setCode(content);
    setActiveTopic(null);
  };

  const handleSelectTopic = (topic: LearnTopic, language: Language) => {
    setActiveTopic(topic);
    setActiveTopicLang(language);
    setOpenFile(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // EditorData mínimo para el CodeEditor y AIPanel (sin projectId real cuando es archivo local)
  const editorData = openFile ? {
    projectId: 0,
    projectName: openFile.name,
    language: openFile.language,
    currentCode: openFile.content,
    versionNumber: 0,
  } : null;

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-mono">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar active={activity} onChange={setActivity} />

        {/* Sidebar */}
        <div className="w-56 bg-[#252526] border-r border-[#1e1e1e] flex flex-col overflow-hidden shrink-0">
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
            <LearnSidebar userId={user.id} onSelectTopic={handleSelectTopic} activeTopicId={activeTopic?.id ?? null} />
          )}
          {activity === 'settings' && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-3 py-2 border-b border-[#1e1e1e] shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#bbbbbb]">Settings</p>
              </div>

              {/* User card */}
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 py-4 px-3 bg-[#2d2d2d] rounded-lg border border-[#3c3c3c]">
                  {/* Avatar con inicial */}
                  <div className="w-14 h-14 rounded-full bg-[#0e639c] flex items-center justify-center text-white text-2xl font-bold select-none">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-[#858585] mt-0.5">{user.email}</p>
                  </div>
                  <div className="w-full h-px bg-[#3c3c3c]" />
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#858585]">User ID</span>
                      <span className="text-[#cccccc] font-mono">#{user.id}</span>
                    </div>
                  </div>
                </div>

                {/* Sign out */}
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#f48771] border border-[#f48771]/30 rounded hover:bg-[#f48771]/10 transition-colors cursor-pointer">
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editor area */}
        <div className="flex flex-1 overflow-hidden">
          {activeTopic ? (
            <ExercisePanel topic={activeTopic} language={activeTopicLang} userId={user.id} />
          ) : (
            <CodeEditor editorData={editorData} code={code} onChange={setCode} />
          )}
          <AIPanel editorData={editorData} code={code} />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        language={openFile?.language ?? activeTopic?.category ?? '—'}
        projectName={openFile?.name ?? activeTopic?.name ?? 'No file open'}
        version={0}
        username={user.username ?? ''}
      />
    </div>
  );
}
