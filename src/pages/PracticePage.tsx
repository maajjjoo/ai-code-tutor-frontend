import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { FolderPlus } from 'lucide-react';
import type { VFile, VNode } from '../types/vfs';
import { NewProjectModal } from '../components/editor/NewProjectModal';
import { DeleteProjectModal } from '../components/editor/DeleteProjectModal';
import { SaveIndicatorBar } from '../components/editor/SaveIndicatorBar';
import { ExerciseContextPanel } from '../components/practice/ExerciseContextPanel';
import { EditorTopBar } from '../components/practice/EditorTopBar';
import { EditorStatusBar } from '../components/practice/EditorStatusBar';
import { EditorConsole } from '../components/practice/EditorConsole';
import { AiChatPanel } from '../components/practice/AiChatPanel';
import { usePracticePage } from '../hooks/usePracticePage';
import { CharCounter } from '../components/ui/CharCounter';
import { validateFileName } from '../utils/validation';
import { useToast } from '../context/ToastContext';

const FILE_EXT_COLORS: Record<string, string> = {
  py: '#3B82F6', java: '#F59E0B', js: '#EAB308',
  ts: '#6366F1', tsx: '#6366F1', jsx: '#EAB308',
  cpp: '#9CA3AF', cs: '#9CA3AF',
};

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

function getFileExt(filename: string): string {
  return filename.includes('.') ? filename.split('.').pop() ?? '' : '';
}

function getFileDotColor(filename: string): string {
  return FILE_EXT_COLORS[getFileExt(filename)] ?? '#D1D5DB';
}

export function PracticePage() {
  const navigate = useNavigate();
  const p = usePracticePage();
  const { showToast } = useToast();

  return (
    <div className="h-screen w-screen grid overflow-hidden bg-white dark:bg-gray-900 transition-colors" style={{ gridTemplateColumns: `${p.sidebarWidth}px 1fr ${p.aiPanelWidth}px` }}>

      <NewProjectModal
        open={p.isNewProjectModalOpen}
        onClose={() => { p.setIsNewProjectModalOpen(false); p.setModalError(null); }}
        onCreate={p.handleCreateProject}
        loading={p.modalLoading}
        error={p.modalError}
      />

      <DeleteProjectModal
        open={!!p.deleteTarget}
        projectName={p.deleteTarget?.name ?? ''}
        onClose={() => p.setDeleteTarget(null)}
        onConfirm={p.handleDeleteProject}
      />

      <div className="bg-white dark:bg-gray-900 border-r border-[#E5E7EB] dark:border-gray-700 flex flex-col overflow-hidden p-3 relative">
        <div onClick={() => navigate('/')} className="flex items-center gap-[8px] px-[12px] pt-[12px] pb-[8px] cursor-pointer border-b border-[#E5E7EB] dark:border-gray-700 mb-[8px] hover:opacity-85 transition-opacity">
          <div className="w-[24px] h-[24px] bg-[#534AB7] rounded-[6px] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span className="text-[13px] font-medium">
            <span className="text-[#111827] dark:text-gray-100">AI</span>
            <span className="text-[#534AB7] dark:text-indigo-400">Code</span>
            <span className="text-[#111827] dark:text-gray-100">Tutor</span>
          </span>
        </div>
        <button
          onClick={() => p.setIsNewProjectModalOpen(true)}
          className="w-full flex items-center gap-[10px] bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-[10px] px-[14px] py-[10px] text-[13px] font-medium text-[#111827] dark:text-gray-100 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-gray-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New project
        </button>

        <div className="flex-1 overflow-y-auto mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] dark:text-gray-500 mb-[8px]">Current</p>
          {p.activeProject && (
            <div className="flex items-center gap-[8px] bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-[8px] px-[10px] py-[8px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[13px] font-medium text-[#3C3489] dark:text-indigo-300 truncate">{p.activeProject.name}</span>
            </div>
          )}
          {!p.activeProject && (
            <div className="text-center py-6">
              <FolderPlus className="w-8 h-8 text-[#E5E7EB] mx-auto mb-2" />
              <p className="text-xs text-[#9CA3AF] dark:text-gray-500">Create a project to start</p>
              <button onClick={() => p.setIsNewProjectModalOpen(true)} className="mt-3 px-3 py-1.5 bg-[#534AB7] text-white text-xs rounded-lg hover:opacity-90 cursor-pointer">+ New Project</button>
            </div>
          )}

          <div className="mt-[4px]">
            {p.filesList.map((f: VFile) => {
              const isActive = p.fsActiveId === f.id;
              const isRenaming = p.renamingFileId === f.id;
              return (
                <div key={f.id} onClick={() => { if (!isRenaming) p.switchToFile(f.id); }}
                  onDoubleClick={() => { p.setRenamingFileId(f.id); p.setRenamingFileName(f.name); }}
                  className={`flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] group ${isRenaming ? '' : 'cursor-pointer'} transition-colors ${isActive ? 'bg-[#EEEDFE] dark:bg-indigo-900/30' : 'hover:bg-[#F9FAFB] dark:hover:bg-gray-700'}`}
                  style={{ paddingLeft: '22px' }}
                >
                  <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(isRenaming ? p.renamingFileName : f.name) }} />
                  {isRenaming ? (
                    <div className="flex-1">
                      <input ref={p.renameInputRef} value={p.renamingFileName} autoFocus onChange={e => { if (e.target.value.length <= 30) p.setRenamingFileName(e.target.value); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); const name = p.renamingFileName.trim(); if (name && name.length >= 3 && name.includes('.')) { p.handleRenameFile(f.id, name); } p.setRenamingFileId(null); p.setRenamingFileName(''); }
                          else if (e.key === 'Escape') { p.setRenamingFileId(null); p.setRenamingFileName(''); }
                        }}
                        onBlur={() => { const name = p.renamingFileName.trim(); if (name && name.length >= 3 && name.includes('.')) { p.handleRenameFile(f.id, name); } p.setRenamingFileId(null); p.setRenamingFileName(''); }}
                        className="w-full bg-transparent text-[13px] text-[#111827] dark:text-gray-100 outline-none border-b border-[#534AB7]"
                      />
                      <CharCounter current={p.renamingFileName.length} max={30} showAt={1} />
                      {p.renamingFileName.length > 0 && validateFileName(p.renamingFileName) && (
                        <p className="text-[10px] text-[#DC2626] mt-[1px]">{validateFileName(p.renamingFileName)}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className={`text-[13px] truncate flex-1 ${isActive ? 'font-medium text-[#111827] dark:text-gray-100' : 'text-[#9CA3AF] dark:text-gray-500'}`}>{f.name}</span>
                      <button onClick={e => { e.stopPropagation(); p.setFsNodes((prev: VNode[]) => prev.filter((n: VNode) => n.id !== f.id)); if (p.fsActiveId === f.id) { p.setFsActiveId(null); p.setOpenFile(null); p.setCode(''); } delete p.fileContentsRef.current[f.id]; showToast('File deleted', 'success'); }}
                        className="ml-auto text-[#9CA3AF] dark:text-gray-500 hover:text-[#EF4444] cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            {p.isCreatingFile && (
              <div className="flex flex-col gap-[2px] px-[8px] py-[6px] rounded-[6px]" style={{ paddingLeft: '22px' }}>
                <div className="flex items-center gap-[8px]">
                  <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(p.creatingFileName) || '#D1D5DB' }} />
                  <input ref={p.creatingInputRef} value={p.creatingFileName} onChange={e => { if (e.target.value.length <= 30) p.setCreatingFileName(e.target.value); }}
                    placeholder="filename.py"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); const name = p.creatingFileName.trim(); if (name && name.length >= 3 && name.includes('.')) { p.handleNewFile(name); } p.setIsCreatingFile(false); p.setCreatingFileName(''); }
                      else if (e.key === 'Escape') { p.setIsCreatingFile(false); p.setCreatingFileName(''); }
                    }}
                    onBlur={() => { const name = p.creatingFileName.trim(); if (name && name.length >= 3 && name.includes('.')) { p.handleNewFile(name); } p.setIsCreatingFile(false); p.setCreatingFileName(''); }}
                    className="flex-1 bg-transparent text-[13px] text-[#111827] dark:text-gray-100 outline-none border-b border-[#534AB7]"
                  />
                </div>
                <CharCounter current={p.creatingFileName.length} max={30} showAt={1} />
                {p.creatingFileName.length > 0 && validateFileName(p.creatingFileName) && (
                  <p className="text-[10px] text-[#DC2626]">{validateFileName(p.creatingFileName)}</p>
                )}
              </div>
            )}
          </div>

          {p.activeProject && (
            <div onClick={() => { p.setIsCreatingFile(true); p.setCreatingFileName(''); setTimeout(() => p.creatingInputRef.current?.focus(), 20); }}
              className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-gray-700 transition-colors mt-1" style={{ paddingLeft: '22px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">New file</span>
            </div>
          )}
        </div>

        <div className="h-[0.5px] bg-[#E5E7EB] dark:bg-gray-700 my-3" />

        <div className="overflow-y-auto max-h-[180px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] dark:text-gray-500 mb-2">Saved projects</p>
          {p.savedProjects.length === 0 && (
            <div className="flex flex-col items-center gap-1 py-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500">No saved projects yet</p>
              <p className="text-[10px] text-[#D1D5DB] dark:text-gray-600">Create a project to get started</p>
            </div>
          )}
          {p.savedProjects.map((proj) => {
            const isActive = p.activeProject?.id === proj.id;
            return (
              <div key={proj.id} onClick={() => !isActive && p.handleLoadSavedProject(proj)}
                className={`flex items-center gap-[8px] px-[8px] py-[6px] rounded-[4px] cursor-pointer transition-colors ${isActive ? 'bg-[#EEEDFE] dark:bg-indigo-900/30' : 'hover:bg-[#F9FAFB] dark:hover:bg-gray-700'}`}
              >
                <div className={`w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 ${isActive ? 'bg-[#534AB7] border border-[#534AB7]' : 'bg-white dark:bg-gray-900 border border-[#D1D5DB] dark:border-gray-600'}`}>
                  {isActive && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span className={`text-[13px] truncate ${isActive ? 'text-[#111827] dark:text-gray-100' : 'text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-gray-100'}`}>{proj.name}</span>
                {!isActive && (
                  <button onClick={e => { e.stopPropagation(); p.setDeleteTarget(proj); }} className="ml-auto text-[#9CA3AF] dark:text-gray-500 hover:text-[#EF4444] cursor-pointer shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div onMouseDown={e => { e.preventDefault(); p.resizing.current = 'sidebar'; p.resizeStartX.current = e.clientX; p.resizeStartWidth.current = p.sidebarWidth; const onMove = (ev: MouseEvent) => { if (p.resizing.current !== 'sidebar') return; p.setSidebarWidth(Math.max(160, Math.min(360, p.resizeStartWidth.current + ev.clientX - p.resizeStartX.current))); }; const onUp = () => { p.resizing.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
          className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#534AB7]/30 transition-colors z-10"
        />
      </div>

      <div className="flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        {p.exerciseContext && !p.isCreatingProject && (
          <ExerciseContextPanel context={p.exerciseContext} onDismiss={() => { p.setExerciseContext(null); p.setIsPanelCollapsed(false); }} isCollapsed={p.isPanelCollapsed} onToggleCollapse={() => p.setIsPanelCollapsed((prev: boolean) => !prev)} />
        )}

        <EditorTopBar filesList={p.filesList} fsActiveId={p.fsActiveId} language={p.openFile?.language ?? 'python'} hasUnsavedChanges={p.hasUnsavedChanges} onSwitchFile={p.switchToFile} onRunCode={p.handleRunCode} isRunning={p.terminalRunning} />
        <SaveIndicatorBar state={p.saveIndicatorState} />

        <div className="flex-1 flex overflow-hidden relative">
          {p.loadingProject && (
            <div className="absolute inset-0 z-10 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center">
              <svg className="w-8 h-8 animate-spin text-[#534AB7] mb-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
              <p className="text-[13px] text-[#4B5563] dark:text-gray-400">Loading project...</p>
            </div>
          )}
          {!p.openFile ? (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 select-none">
              <div className="text-center">
                <p className="text-5xl mb-4 opacity-20 text-[#9CA3AF] dark:text-gray-500">{'</>'}</p>
                <p className="text-sm text-[#9CA3AF] dark:text-gray-500">Open a file from the explorer to start</p>
                <p className="text-xs mt-2 text-[#C4C4C4]">Ctrl+S to save</p>
              </div>
            </div>
          ) : (
            <MonacoEditor height="100%" width="100%" language={LANG_MAP[p.openFile.language] ?? 'plaintext'} value={p.code} onChange={p.handleCodeChange} onMount={p.handleEditorMount} theme="vs"
              options={{ fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.7, minimap: { enabled: false }, scrollBeyondLastLine: false, renderLineHighlight: 'all', lineNumbers: 'on', padding: { top: 14 }, wordWrap: 'on', glyphMargin: false, folding: false, lineNumbersMinChars: 3, cursorBlinking: 'smooth', smoothScrolling: true }}
            />
          )}
          {p.tooltipPos && p.selectedText && (
            <div ref={p.tooltipRef} className="code-tooltip fixed z-[1000] bg-[#1E1E2E] text-white rounded-[8px] px-[12px] py-[8px] max-w-[280px] text-[12px] leading-relaxed shadow-lg"
              style={{ top: p.tooltipPos.top, left: p.tooltipPos.left, transform: 'translateX(-50%)' }}
            >
              {p.tooltipLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-[#9CA3AF] dark:text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">Explaining...</span>
                </div>
              ) : p.tooltipContent !== null ? (
                <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{p.tooltipContent}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">Press </span>
                  <kbd className="bg-white/10 rounded-[3px] px-[5px] py-[1px] text-[10px] font-mono">Ctrl+K</kbd>
                  <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500"> to explain</span>
                </div>
              )}
            </div>
          )}
        </div>

        <EditorStatusBar hasUnsavedChanges={p.hasUnsavedChanges} language={p.openFile?.language ?? 'plaintext'} onSave={p.saveCurrentProject} saving={p.backupSaving} />

        {p.consoleOpen && <EditorConsole consoleTab={p.consoleTab} termLines={p.termLines} onTabChange={p.setConsoleTab} onClear={() => p.setTermLines([])} />}
      </div>

      <div className="bg-white dark:bg-gray-900 border-l border-[#E5E7EB] dark:border-gray-700 flex flex-col overflow-hidden relative">
        <AiChatPanel aiMessages={p.aiMessages} aiInput={p.aiInput} aiLoading={p.aiLoading} showHistory={p.showHistory} code={p.code} aiBottomRef={p.aiBottomRef}
          onInputChange={p.setAiInput} onSend={p.handleAiSend} onAnalyze={p.handleAnalyze} onToggleHistory={() => p.setShowHistory((prev: boolean) => !prev)}
        />
        <div onMouseDown={e => { e.preventDefault(); p.resizing.current = 'ai'; p.resizeStartX.current = e.clientX; p.resizeStartWidth.current = p.aiPanelWidth; const onMove = (ev: MouseEvent) => { if (p.resizing.current !== 'ai') return; p.setAiPanelWidth(Math.max(240, Math.min(480, p.resizeStartWidth.current - (ev.clientX - p.resizeStartX.current)))); }; const onUp = () => { p.resizing.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
          className="absolute left-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#534AB7]/30 transition-colors z-10"
        />
      </div>

      {p.isCreatingProject && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center z-50 gap-3">
          <svg className="animate-spin h-6 w-6 text-[#534AB7]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          <p className="text-[#534AB7] text-sm font-medium">Preparing your exercise...</p>
        </div>
      )}

      <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-900 z-[100] flex items-center justify-center p-8">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto mb-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <p className="text-[15px] font-medium text-[#111827] dark:text-gray-100">Desktop required</p>
          <p className="text-[13px] text-[#4B5563] dark:text-gray-400 mt-2">Please use a desktop browser for the code editor.</p>
        </div>
      </div>
    </div>
  );
}
