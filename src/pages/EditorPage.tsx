import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityBar, type ActivityView } from '../components/layout/ActivityBar';
import { StatusBar } from '../components/layout/StatusBar';
import { FilesSidebar } from '../components/sidebar/FilesSidebar';
import { LearnSidebar } from '../components/sidebar/LearnSidebar';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ExercisePanel } from '../components/editor/ExercisePanel';
import { AIPanel } from '../components/ai/AIPanel';
import { loadEditor, getErrorMessage } from '../services/api';
import type { Project, EditorData, LearnTopic } from '../types';

interface StoredUser { id: number; username: string; email: string; }

export function EditorPage() {
  const navigate = useNavigate();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  const [activity, setActivity] = useState<ActivityView>('files');
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [code, setCode] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeTopic, setActiveTopic] = useState<LearnTopic | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  const handleSelectProject = async (p: Project) => {
    setLoadingProject(true);
    setActiveTopic(null);
    try {
      const data = await loadEditor(p.id);
      setEditorData(data);
      setCode(data.currentCode ?? '');
      setActiveProjectId(p.id);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoadingProject(false);
    }
  };

  const handleSelectTopic = (topic: LearnTopic) => {
    setActiveTopic(topic);
    setEditorData(null); // ocultar editor de proyecto
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-mono">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar active={activity} onChange={setActivity} />

        {/* Sidebar */}
        <div className="w-56 bg-[#252526] border-r border-[#1e1e1e] flex flex-col overflow-hidden shrink-0">
          {activity === 'files' && (
            <FilesSidebar userId={user.id} activeProjectId={activeProjectId} onSelectProject={handleSelectProject} />
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
          {loadingProject ? (
            <div className="flex-1 flex items-center justify-center text-[#858585] text-sm">Loading project...</div>
          ) : activeTopic ? (
            <ExercisePanel topic={activeTopic} userId={user.id} />
          ) : (
            <CodeEditor editorData={editorData} code={code} onChange={setCode} />
          )}
          <AIPanel editorData={editorData} code={code} />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        language={editorData?.language ?? activeTopic?.category ?? '—'}
        projectName={editorData?.projectName ?? activeTopic?.name ?? 'No project open'}
        version={editorData?.versionNumber ?? 0}
        username={user.username ?? ''}
      />
    </div>
  );
}
