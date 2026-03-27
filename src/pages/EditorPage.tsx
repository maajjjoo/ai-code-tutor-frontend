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

  // Cuando el sidebar abre un archivo (virtual o del disco o del backend)
  const handleOpenFile = (name: string, content: string, language: Language) => {
    setOpenFile({ name, content, language });
    setCode(content);
    setActiveTopic(null);
  };

  const handleSelectTopic = (topic: LearnTopic) => {
    setActiveTopic(topic);
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
            <FilesSidebar userId={user.id} onOpenFile={handleOpenFile} />
          )}
          {activity === 'learn' && (
            <LearnSidebar onSelectTopic={handleSelectTopic} activeTopicId={activeTopic?.id ?? null} />
          )}
          {activity === 'settings' && (
            <div className="flex flex-col gap-2 p-4">
              <p className="text-xs text-[#858585] uppercase tracking-wider mb-2">Settings</p>
              <p className="text-xs text-[#cccccc]">User: {user.username}</p>
              <p className="text-xs text-[#cccccc]">Email: {user.email}</p>
              <button onClick={handleLogout}
                className="mt-4 text-xs text-[#f48771] hover:text-white text-left cursor-pointer">
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Editor area */}
        <div className="flex flex-1 overflow-hidden">
          {activeTopic ? (
            <ExercisePanel topic={activeTopic} userId={user.id} />
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
