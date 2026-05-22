import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityBar, type ActivityView } from '../components/layout/ActivityBar';
import { StatusBar } from '../components/layout/StatusBar';
import { FilesSidebar } from '../components/sidebar/FilesSidebar';
import { CodeEditor } from '../components/editor/CodeEditor';
import { NewProjectModal } from '../components/editor/NewProjectModal';
import { DeleteProjectModal } from '../components/editor/DeleteProjectModal';
import { TerminalPanel, type TerminalLine } from '../components/editor/TerminalPanel';
import { AIPanel } from '../components/ai/AIPanel';
import { createProject, saveSnapshot, getProjectsByUser, loadEditor } from '../services/api';
import type { Language, Project } from '../types';
import type { VNode } from '../types/vfs';
import { uid } from '../types/vfs';
import { Terminal, Save, FolderPlus } from 'lucide-react';
import { useVirtualFileSystem } from '../hooks/useVirtualFileSystem';

interface StoredUser { id: number; username: string; email: string; }

const ACTIVE_PROJECT_KEY = 'codetutor-active-project';

export function EditorPage() {
  const navigate = useNavigate();
  const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const vfs = useVirtualFileSystem();

  const [activity, setActivity] = useState<ActivityView>('files');
  const [errorCount, setErrorCount] = useState(0);
  const [canValidate, setCanValidate] = useState(false);
  const [hasAiWarning, setHasAiWarning] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(288);
  const [isSaved, setIsSaved] = useState(true);
  const [isResizingAiPanel, setIsResizingAiPanel] = useState(false);
  const [savingToBackend, setSavingToBackend] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    try { return JSON.parse(localStorage.getItem(ACTIVE_PROJECT_KEY) ?? 'null'); } catch { return null; }
  });
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const aiPanelResizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.id) {
      getProjectsByUser(user.id).then(setSavedProjects).catch(() => {});
    }
  }, [user.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isSaved) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaved]);

  const saveCurrentProject = async () => {
    if (!activeProject || savingToBackend) return;
    setSavingToBackend(true);
    const updatedNodes = vfs.fsNodes.map(n =>
      n.id === vfs.fsActiveId && n.type === 'file' ? { ...n, content: vfs.code } : n
    );
    vfs.setFsNodes(updatedNodes);
    try {
      await saveSnapshot({
        content: JSON.stringify({ nodes: updatedNodes }),
        versionLabel: `Save - ${new Date().toLocaleTimeString()}`,
        projectId: activeProject.id,
      });
      localStorage.setItem(`codetutor-project-${activeProject.id}-nodes`, JSON.stringify(updatedNodes));
      setIsSaved(true);
      setToast('Project saved');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSavingToBackend(false);
    }
  };

  const clearEditor = useCallback(() => {
    vfs.setOpenFile(null);
    vfs.setCode('');
    vfs.setFsActiveId(null);
    setTerminalLines([]);
  }, [vfs]);

  const handleOpenFile = useCallback((name: string, content: string, language: Language) => {
    vfs.setOpenFile({ name, content, language });
    vfs.setCode(content);
    setErrorCount(0);
    setCanValidate(false);
    setHasAiWarning(false);
  }, [vfs]);

  const handleCreateProject = async (name: string) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (activeProject && !isSaved) {
        await saveCurrentProject();
      }
      vfs.setOpenFile(null);
      vfs.setCode('');
      vfs.setFsActiveId(null);
      setTerminalLines([]);
      const folderId = uid();
      const newNodes: VNode[] = [{ id: folderId, type: 'folder', name, parentId: null, open: true }];
      vfs.setFsNodes(newNodes);
      const newProject = await createProject({
        name, description: name, programmingLanguage: 'javascript', userId: user.id,
      });
      setActiveProject(newProject);
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(newProject));
      setIsSaved(true);
      const projects = await getProjectsByUser(user.id);
      setSavedProjects(projects);
      setIsNewProjectModalOpen(false);
    } catch (err) {
      setModalError('Error creating project. Check your connection.');
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const loadProjectNodes = useCallback(async (project: Project): Promise<VNode[]> => {
    let projectNodes: VNode[] = [];
    const localNodes = localStorage.getItem(`codetutor-project-${project.id}-nodes`);
    if (localNodes) {
      try { const parsed = JSON.parse(localNodes); if (Array.isArray(parsed) && parsed.length > 0) projectNodes = parsed; } catch {}
    }
    if (projectNodes.length === 0) {
      try {
        const data = await loadEditor(project.id);
        try { const parsed = JSON.parse(data.currentCode ?? ''); if (parsed.nodes && Array.isArray(parsed.nodes)) projectNodes = parsed.nodes; } catch {}
      } catch {}
    }
    if (projectNodes.length === 0) {
      const folderId = uid();
      projectNodes = [{ id: folderId, type: 'folder', name: project.name, parentId: null, open: true }];
    }
    return projectNodes;
  }, []);

  const handleLoadSavedProject = async (project: Project) => {
    if (activeProject && !isSaved) {
      await saveCurrentProject();
    }
    clearEditor();
    setLoadingProject(true);
    const projectNodes = await loadProjectNodes(project);
    vfs.setFsNodes(projectNodes);
    setActiveProject(project);
    localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
    setIsSaved(true);
    setLoadingProject(false);
    setToast('Project loaded');
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    localStorage.removeItem(`codetutor-project-${deleteTarget.id}-nodes`);
    setSavedProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast('Project deleted');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveCurrentProject(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeProject, vfs.fsNodes, vfs.fsActiveId, vfs.code, isSaved]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('codetutor_token');
    navigate('/');
  };

  const handleAiPanelResizerMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizingAiPanel(true);
    const startX = event.clientX;
    const startWidth = aiPanelWidth;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setAiPanelWidth(Math.max(200, Math.min(600, startWidth + delta)));
    };
    const handleMouseUp = () => {
      setIsResizingAiPanel(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [aiPanelWidth]);

  const editorData = vfs.openFile ? {
    projectId: activeProject?.id ?? 0,
    projectName: vfs.openFile.name,
    language: vfs.openFile.language,
    currentCode: vfs.openFile.content,
    versionNumber: 0,
  } : null;

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] text-[#111827] overflow-hidden">
      {toast && (
        <div className="fixed top-4 right-4 z-[200] bg-[#111827] text-white text-[12px] px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <NewProjectModal
        open={isNewProjectModalOpen}
        onClose={() => { setIsNewProjectModalOpen(false); setModalError(null); }}
        onCreate={handleCreateProject}
        loading={modalLoading}
        error={modalError}
      />

      <DeleteProjectModal
        open={!!deleteTarget}
        projectName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProject}
      />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar active={activity} onChange={setActivity} />

        <div className="w-56 bg-white border-r border-[#E5E7EB] flex flex-col overflow-hidden shrink-0">
          {activity === 'files' && (
            <FilesSidebar
              userId={user.id}
              nodes={vfs.fsNodes}
              setNodes={vfs.setFsNodes}
              activeId={vfs.fsActiveId}
              setActiveId={vfs.setFsActiveId}
              onOpenFile={handleOpenFile}
              onNewProject={() => setIsNewProjectModalOpen(true)}
              onLoadProject={(_nodes, projId) => {
                const proj = savedProjects.find(p => p.id === projId);
                if (proj) handleLoadSavedProject(proj);
              }}
              onDeleteProject={(projId) => {
                const proj = savedProjects.find(p => p.id === projId);
                if (proj) setDeleteTarget(proj);
              }}
              savedProjects={savedProjects}
              activeProjectId={activeProject?.id ?? null}
              refreshTrigger={savedProjects.length}
            />
          )}
          {activity === 'settings' && (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2 border-b border-[#E5E7EB] shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Settings</p>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 py-5 px-3 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
                  <div className="w-14 h-14 rounded-2xl bg-[#534AB7] flex items-center justify-center text-white text-2xl font-bold select-none">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#111827]">{user.username}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{user.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
                  Sign out
                </button>
                <button onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#534AB7] border border-[#EEEDFE] rounded-xl hover:bg-[#EEEDFE] transition-colors cursor-pointer">
                  ← Back to home
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {activeProject && (
              <div className="h-9 bg-white border-b border-[#E5E7EB] flex items-center px-3 shrink-0 gap-3">
                <span className="text-[13px] font-medium text-[#111827]">{activeProject.name}</span>
                <div className="ml-auto">
                  <button onClick={() => setIsNewProjectModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#534AB7] cursor-pointer transition-colors">
                    <FolderPlus className="w-3.5 h-3.5" /> New
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
              {loadingProject && (
                <div className="absolute inset-0 z-10 bg-white/80 flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 animate-spin text-[#534AB7] mb-3" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  <p className="text-[13px] text-[#4B5563]">Loading project...</p>
                </div>
              )}
              <CodeEditor
                editorData={editorData}
                code={vfs.code}
                onChange={newCode => { vfs.setCode(newCode); setIsSaved(false); }}
                onErrorCountChange={(count, validate) => { setErrorCount(count); setCanValidate(validate); }}
              />
            </div>

            {!terminalOpen && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-[#E5E7EB] shrink-0">
                <button onClick={() => setTerminalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#111827] cursor-pointer transition-colors">
                  <Terminal className="w-3.5 h-3.5" /> Console
                </button>
                <button
                  onClick={saveCurrentProject}
                  disabled={savingToBackend || !activeProject}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#E5E7EB] text-[#534AB7] hover:bg-[#EEEDFE] cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Save className="w-3 h-3" /> {savingToBackend ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}

            {terminalOpen && (
              <div className="h-48 shrink-0">
                <TerminalPanel code={vfs.code} language={vfs.openFile?.language ?? 'javascript'}
                  lines={terminalLines} running={terminalRunning}
                  onLines={setTerminalLines} onRunning={setTerminalRunning}
                  onClose={() => setTerminalOpen(false)} />
              </div>
            )}
          </div>

          <>
            <div ref={aiPanelResizerRef} onMouseDown={handleAiPanelResizerMouseDown}
              className="relative shrink-0 cursor-col-resize group" style={{ width: 6 }}>
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 transition-colors group-hover:bg-[#534AB7]/40"
                style={{ background: isResizingAiPanel ? 'rgba(83,74,183,0.5)' : 'transparent' }} />
            </div>
            <AIPanel editorData={editorData} code={vfs.code} exerciseContext={null} width={aiPanelWidth}
              onAiResponse={(msg) => {
                if (['error', 'falta', 'incorrecto'].some(w => msg.toLowerCase().includes(w))) setHasAiWarning(true);
              }} />
          </>
        </div>
      </div>

      <StatusBar language={vfs.openFile?.language ?? (activeProject ? 'plaintext' : '—')} projectName={activeProject?.name ?? 'No project'}
        version={0} username={user.username ?? ''} errorCount={errorCount}
        canValidate={canValidate} hasAiWarning={hasAiWarning} hasUnsavedChanges={!isSaved} />
    </div>
  );
}
