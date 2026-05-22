import { useState, useRef, useEffect } from 'react';
import type { InputHTMLAttributes } from 'react';
import {
  FilePlus, FolderPlus, FileInput, FolderInput,
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Trash2, Pencil, Plus,
} from 'lucide-react';
import { getProjectsByUser, loadEditor, getErrorMessage } from '../../services/api';
import type { Project, Language } from '../../types';
import type { VNode, VFile, VFolder } from '../../types/vfs';
import { uid, detectLang } from '../../types/vfs';

// ─── Nodo del árbol con drag & drop ──────────────────────────────────────────
function TreeNode({ node, depth, nodes, activeId, onOpen, onToggle, onDelete, onRename, onCreateFileIn, onDrop }:
  { node: VNode; depth: number; nodes: VNode[]; activeId: string | null;
    onOpen: (n: VFile) => void; onToggle: (id: string) => void;
    onDelete: (id: string) => void; onRename: (id: string, name: string) => void;
    onCreateFileIn: (folderId: string) => void; onDrop: (nodeId: string, targetFolderId: string) => void; }) {

  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.name);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const children = nodes.filter(n => n.parentId === node.id);
  const isActive = node.type === 'file' && activeId === node.id;

  const submit = () => {
    if (val.trim() && val !== node.name) onRename(node.id, val.trim());
    setEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('nodeId', node.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (node.type === 'folder') {
      e.preventDefault();
      setDragOver(true);
    }
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDropOnFolder = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const draggedId = e.dataTransfer.getData('nodeId');
    if (draggedId && draggedId !== node.id) {
      onDrop(draggedId, node.id);
    }
  };

  return (
    <div>
      <div
        draggable={!editing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropOnFolder}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        className={`group flex items-center gap-1 py-0.5 pr-2 cursor-pointer select-none text-sm
          ${isActive ? 'bg-[#EEEDFE] text-[#534AB7]' : 'hover:bg-[#F0F1F3] text-[#111827]'}
          ${dragOver ? 'bg-[#EEEDFE] border border-dashed border-[#534AB7]' : ''}`}
        onClick={() => node.type === 'file' ? onOpen(node as VFile) : onToggle(node.id)}
      >
        {node.type === 'folder'
          ? ((node as VFolder).open
            ? <ChevronDown className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            : <ChevronRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />)
          : <span className="w-3 h-3 shrink-0" />}

        {node.type === 'folder'
          ? ((node as VFolder).open
            ? <FolderOpen className="w-4 h-4 text-[#D97706] shrink-0" />
            : <Folder className="w-4 h-4 text-[#D97706] shrink-0" />)
          : <File className="w-4 h-4 text-[#534AB7] shrink-0" />}

        {editing
          ? <input ref={inputRef} value={val} autoFocus
              onChange={e => setVal(e.target.value)}
              onBlur={submit}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setEditing(false); }}
              onClick={e => e.stopPropagation()}
              className="flex-1 bg-[#F8F9FA] border border-[#534AB7] rounded px-1 text-xs outline-none text-[#111827]" />
          : <span className="flex-1 truncate text-xs">{node.name}</span>}

        <span className="hidden group-hover:flex items-center gap-1 shrink-0">
          {node.type === 'folder' && (
            <button onClick={e => { e.stopPropagation(); onCreateFileIn(node.id); }}
              className="text-[#9CA3AF] hover:text-[#534AB7] cursor-pointer" title="New file inside"><Plus className="w-3 h-3" /></button>
          )}
          <button onClick={e => { e.stopPropagation(); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
            className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"><Pencil className="w-3 h-3" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(node.id); }}
            className="text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer"><Trash2 className="w-3 h-3" /></button>
        </span>
      </div>

      {node.type === 'folder' && (node as VFolder).open && children.map(c =>
        <TreeNode key={c.id} node={c} depth={depth + 1} nodes={nodes} activeId={activeId}
          onOpen={onOpen} onToggle={onToggle} onDelete={onDelete} onRename={onRename}
          onCreateFileIn={onCreateFileIn} onDrop={onDrop} />
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  userId: number;
  nodes: VNode[];
  setNodes: React.Dispatch<React.SetStateAction<VNode[]>>;
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenFile: (name: string, content: string, language: Language) => void;
  refreshTrigger?: number;
  onNewProject?: (name: string) => void;
  onLoadProject?: (nodes: VNode[], projectId: number) => void;
  onDeleteProject?: (projectId: number) => void;
  savedProjects?: Project[];
  activeProjectId?: number | null;
}

export function FilesSidebar({ userId, nodes, setNodes, activeId, setActiveId, onOpenFile, refreshTrigger, onNewProject, onLoadProject, onDeleteProject, savedProjects: externalProjects, activeProjectId }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFileParent, setCreatingFileParent] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Load projects on open or when refreshTrigger changes
  useEffect(() => {
    if (projectsOpen) {
      getProjectsByUser(userId).then(setProjects).catch(() => {});
    }
  }, [projectsOpen, userId, refreshTrigger]);

  // Reset creation states when nodes change completely (new project loaded)
  const prevNodesLenRef = useRef(nodes.length);
  useEffect(() => {
    if (nodes.length === 1 && prevNodesLenRef.current > 1) {
      setCreatingFile(false);
      setCreatingFolder(false);
      setNewFileName('');
      setNewFolderName('');
    }
    prevNodesLenRef.current = nodes.length;
  }, [nodes.length]);

  const hasProject = nodes.some(n => n.type === 'folder' && n.parentId === null);

  const openFile = (node: VFile) => {
    setActiveId(node.id);
    onOpenFile(node.name, node.content, node.language);
  };

  const toggleFolder = (id: string) =>
    setNodes(prev => prev.map(n => n.id === id && n.type === 'folder' ? { ...n, open: !(n as VFolder).open } : n));

  const deleteNode = (id: string) => {
    const toDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach(n => { if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) { toDelete.add(n.id); changed = true; } });
    }
    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    if (activeId && toDelete.has(activeId)) setActiveId(null);
  };

  const renameNode = (id: string, name: string) => {
    const lang = detectLang(name);
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        if (n.type === 'file') return { ...n, name, language: lang };
        return { ...n, name };
      }
      return n;
    }));
  };

  // Move a node into a folder (drag & drop)
  const moveNode = (nodeId: string, targetFolderId: string) => {
    // Prevent moving a folder into itself or its children
    const isChild = (parentId: string, childId: string): boolean => {
      const node = nodes.find(n => n.id === childId);
      if (!node || !node.parentId) return false;
      if (node.parentId === parentId) return true;
      return isChild(parentId, node.parentId);
    };
    if (nodeId === targetFolderId || isChild(nodeId, targetFolderId)) return;
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, parentId: targetFolderId } : n));
  };

  // Create file inside the current project
  const createFile = (parentId?: string) => {
    // If no project exists, can't create files
    if (!hasProject && !parentId) return;
    setCreatingFile(true);
    setCreatingFileParent(parentId ?? null);
    setNewFileName('');
    setTimeout(() => newFileInputRef.current?.focus(), 0);
  };

  const createFileInFolder = (folderId: string) => {
    // Open the folder first
    setNodes(prev => prev.map(n => n.id === folderId && n.type === 'folder' ? { ...n, open: true } : n));
    setCreatingFile(true);
    setCreatingFileParent(folderId);
    setNewFileName('');
    setTimeout(() => newFileInputRef.current?.focus(), 0);
  };

  const confirmCreateFile = () => {
    const name = newFileName.trim();
    if (!name) { setCreatingFile(false); setNewFileName(''); setCreatingFileParent(null); return; }
    const lang = detectLang(name);
    let parentId = creatingFileParent;
    if (!parentId && hasProject) {
      const firstFolder = nodes.find(n => n.type === 'folder' && n.parentId === null);
      parentId = firstFolder?.id ?? null;
    }
    const node: VFile = { id: uid(), type: 'file', name, content: '', language: lang, parentId };
    setNodes(prev => [...prev, node]);
    setActiveId(node.id);
    onOpenFile(name, '', lang);
    setCreatingFile(false);
    setNewFileName('');
    setCreatingFileParent(null);
  };

  const createFolder = () => {
    setCreatingFolder(true);
    setNewFolderName('');
    setTimeout(() => newFolderInputRef.current?.focus(), 0);
  };

  const confirmCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolder(false); setNewFolderName(''); return; }
    const rootFolder = nodes.find(n => n.type === 'folder' && n.parentId === null);
    const parentId = rootFolder?.id ?? null;
    const node: VFolder = { id: uid(), type: 'folder', name, parentId, open: true };
    setNodes(prev => [...prev, node]);
    setCreatingFolder(false);
    setNewFolderName('');
  };

  const handleOpenFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Put imported files inside first project folder if exists
    const firstFolder = nodes.find(n => n.type === 'folder' && n.parentId === null);
    const parentId = firstFolder?.id ?? null;
    for (const file of Array.from(e.target.files ?? [])) {
      const content = await file.text();
      const lang = detectLang(file.name);
      const node: VFile = { id: uid(), type: 'file', name: file.name, content, language: lang, parentId };
      setNodes(prev => [...prev, node]);
      setActiveId(node.id);
      onOpenFile(file.name, content, lang);
    }
    e.target.value = '';
  };

  const handleOpenFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const folderMap = new Map<string, string>();
    const sorted = files.sort((a, b) =>
      (a.webkitRelativePath || a.name).split('/').length - (b.webkitRelativePath || b.name).split('/').length);
    const newNodes: VNode[] = [];
    for (const file of sorted) {
      const parts = (file.webkitRelativePath || file.name).split('/');
      let parentId: string | null = null;
      for (let i = 0; i < parts.length - 1; i++) {
        const path = parts.slice(0, i + 1).join('/');
        if (!folderMap.has(path)) {
          const fid = uid();
          folderMap.set(path, fid);
          newNodes.push({ id: fid, type: 'folder', name: parts[i], parentId, open: true });
        }
        parentId = folderMap.get(path)!;
      }
      const content = await file.text();
      const lang = detectLang(parts[parts.length - 1]);
      newNodes.push({ id: uid(), type: 'file', name: parts[parts.length - 1], content, language: lang, parentId });
    }
    setNodes(prev => [...prev, ...newNodes]);
    e.target.value = '';
  };

  const handleLoadProject = async (p: Project) => {
    try {
      // First try to load from localStorage (has full node structure)
      const localNodes = localStorage.getItem(`codetutor-project-${p.id}-nodes`);
      if (localNodes) {
        const parsed = JSON.parse(localNodes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (onLoadProject) {
            onLoadProject(parsed, p.id);
          } else {
            setNodes(parsed);
          }
          return;
        }
      }

      // Fallback: load from backend
      const data = await loadEditor(p.id);
      let projectNodes: VNode[] = [];
      try {
        const parsed = JSON.parse(data.currentCode ?? '');
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          projectNodes = parsed.nodes;
        }
      } catch {
        // Fallback: single file project
        const folderId = uid();
        const fileNode: VFile = { id: uid(), type: 'file', name: p.name + '.' + data.language, content: data.currentCode ?? '', language: data.language, parentId: folderId };
        projectNodes = [
          { id: folderId, type: 'folder', name: p.name, parentId: null, open: true },
          fileNode,
        ];
      }

      if (onLoadProject) {
        onLoadProject(projectNodes, p.id);
      } else {
        setNodes(projectNodes);
      }
    } catch (err) { console.error(getErrorMessage(err)); }
  };

  const roots = nodes.filter(n => n.parentId === null);

  return (
    <div className="flex flex-col h-full text-[#111827] overflow-hidden">
      <input ref={fileInputRef} type="file" multiple className="hidden"
        accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.h,.json,.md,.txt,.css,.html"
        onChange={handleOpenFiles} />
      <input ref={folderInputRef} type="file" multiple className="hidden"
        {...({ webkitdirectory: '' } as InputHTMLAttributes<HTMLInputElement>)}
        onChange={handleOpenFolder} />

      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Explorer</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => fileInputRef.current?.click()} title="Import file" className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"><FileInput className="w-3.5 h-3.5" /></button>
          <button onClick={() => folderInputRef.current?.click()} title="Import folder" className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"><FolderInput className="w-3.5 h-3.5" /></button>
          <div className="w-px h-3 bg-[#E5E7EB]" />
          <button onClick={() => createFile()} title="New file" className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"><FilePlus className="w-3.5 h-3.5" /></button>
          <button onClick={() => createFolder()} title="New folder" className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"><FolderPlus className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Always visible New Project button */}
      <div className="px-3 py-1.5 border-b border-[#E5E7EB] shrink-0">
        <button
          onClick={() => { if (onNewProject) onNewProject(''); }}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#534AB7] text-white text-[11px] font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* Empty state — prompt to create a project */}
        {roots.length === 0 && !creatingFile && !creatingFolder && (
          <div className="px-4 py-6 text-center">
            <FolderPlus className="w-8 h-8 text-[#E5E7EB] mx-auto mb-2" />
            <p className="text-xs text-[#9CA3AF]">Create a project to start</p>
            <button
              onClick={() => { if (onNewProject) onNewProject(''); }}
              className="mt-3 px-3 py-1.5 bg-[#534AB7] text-white text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              + New Project
            </button>
          </div>
        )}

        {/* Input para nueva carpeta/proyecto */}
        {creatingFolder && (
          <div className="flex items-center gap-1 px-3 py-0.5">
            <Folder className="w-4 h-4 text-[#D97706] shrink-0" />
            <input ref={newFolderInputRef} value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onBlur={() => { setCreatingFolder(false); setNewFolderName(''); }}
              onKeyDown={e => { if (e.key === 'Enter') confirmCreateFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); } }}
              placeholder="folder name"
              className="flex-1 bg-[#F8F9FA] border border-[#534AB7] rounded px-1 text-xs text-[#111827] outline-none" />
          </div>
        )}

        {/* Input para nuevo archivo */}
        {creatingFile && (
          <div className="flex items-center gap-1 px-3 py-0.5" style={{ paddingLeft: creatingFileParent ? '22px' : undefined }}>
            <File className="w-4 h-4 text-[#534AB7] shrink-0" />
            <input ref={newFileInputRef} value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onBlur={() => { setCreatingFile(false); setNewFileName(''); setCreatingFileParent(null); }}
              onKeyDown={e => { if (e.key === 'Enter') confirmCreateFile(); if (e.key === 'Escape') { setCreatingFile(false); setNewFileName(''); } }}
              placeholder="filename.py"
              className="flex-1 bg-[#F8F9FA] border border-[#534AB7] rounded px-1 text-xs text-[#111827] outline-none" />
          </div>
        )}

        {roots.map(n => (
          <TreeNode key={n.id} node={n} depth={0} nodes={nodes} activeId={activeId}
            onOpen={openFile} onToggle={toggleFolder} onDelete={deleteNode} onRename={renameNode}
            onCreateFileIn={createFileInFolder} onDrop={moveNode} />
        ))}
      </div>

      {/* Saved projects */}
      <div className="border-t border-[#E5E7EB] shrink-0">
        <button onClick={() => setProjectsOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
          {projectsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="uppercase tracking-widest font-semibold">Saved Projects</span>
          {(externalProjects ?? projects).length > 0 && (
            <span className="ml-auto text-[10px] bg-[#F0F1F3] text-[#9CA3AF] px-1.5 py-0.5 rounded-full">
              {(externalProjects ?? projects).length}
            </span>
          )}
        </button>
        {projectsOpen && (
          <div className="max-h-48 overflow-y-auto pb-1">
            {(externalProjects ?? projects).length === 0 && <p className="text-xs text-[#9CA3AF] px-4 py-2">No saved projects.</p>}
            {(externalProjects ?? projects).map(p => {
              const isActive = activeProjectId === p.id;
              return (
                <div key={p.id}
                  className={`group flex items-center gap-2 px-4 py-1.5 text-xs cursor-pointer ${isActive ? 'bg-[#EEEDFE] border-l-2 border-[#534AB7] text-[#534AB7]' : 'text-[#111827] hover:bg-[#F0F1F3]'}`}
                  onClick={() => !isActive && handleLoadProject(p)}
                >
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#534AB7]' : 'text-[#D97706]'}`} />
                  <span className="truncate flex-1">{p.name}</span>
                  {!isActive && onDeleteProject && (
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteProject(p.id); }}
                      className="hidden group-hover:block text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer shrink-0"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
