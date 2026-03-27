import { useState, useRef, useEffect } from 'react';
import {
  FilePlus, FolderPlus, FileInput, FolderInput,
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Trash2, Pencil, ChevronUp,
} from 'lucide-react';
import { getProjectsByUser, loadEditor, getErrorMessage } from '../../services/api';
import type { Project, Language } from '../../types';
import type { VNode, VFile, VFolder } from '../../types/vfs';
import { uid, detectLang } from '../../types/vfs';

const LANG_ICON: Record<string, string> = { javascript: '🟨', typescript: '🔷', python: '🐍', java: '☕', cpp: '⚙️' };

// ─── Nodo del árbol ───────────────────────────────────────────────────────────
function TreeNode({ node, depth, nodes, activeId, onOpen, onToggle, onDelete, onRename }:
  { node: VNode; depth: number; nodes: VNode[]; activeId: string | null;
    onOpen: (n: VFile) => void; onToggle: (id: string) => void;
    onDelete: (id: string) => void; onRename: (id: string, name: string) => void; }) {

  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const children = nodes.filter(n => n.parentId === node.id);
  const isActive = node.type === 'file' && activeId === node.id;

  const submit = () => {
    if (val.trim() && val !== node.name) onRename(node.id, val.trim());
    setEditing(false);
  };

  return (
    <div>
      <div
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        className={`group flex items-center gap-1 py-0.5 pr-2 cursor-pointer select-none text-sm
          ${isActive ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'}`}
        onClick={() => node.type === 'file' ? onOpen(node as VFile) : onToggle(node.id)}
      >
        {node.type === 'folder'
          ? ((node as VFolder).open
            ? <ChevronDown className="w-3 h-3 text-[#858585] shrink-0" />
            : <ChevronRight className="w-3 h-3 text-[#858585] shrink-0" />)
          : <span className="w-3 h-3 shrink-0" />}

        {node.type === 'folder'
          ? ((node as VFolder).open
            ? <FolderOpen className="w-4 h-4 text-[#dcb67a] shrink-0" />
            : <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />)
          : <File className="w-4 h-4 text-[#519aba] shrink-0" />}

        {editing
          ? <input ref={inputRef} value={val} autoFocus
              onChange={e => setVal(e.target.value)}
              onBlur={submit}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setEditing(false); }}
              onClick={e => e.stopPropagation()}
              className="flex-1 bg-[#3c3c3c] border border-[#569cd6] rounded px-1 text-xs outline-none" />
          : <span className="flex-1 truncate text-xs">{node.name}</span>}

        <span className="hidden group-hover:flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
            className="hover:text-white cursor-pointer"><Pencil className="w-3 h-3" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(node.id); }}
            className="hover:text-[#f48771] cursor-pointer"><Trash2 className="w-3 h-3" /></button>
        </span>
      </div>

      {node.type === 'folder' && (node as VFolder).open && children.map(c =>
        <TreeNode key={c.id} node={c} depth={depth + 1} nodes={nodes} activeId={activeId}
          onOpen={onOpen} onToggle={onToggle} onDelete={onDelete} onRename={onRename} />
      )}
    </div>
  );
}

// ─── Props — el estado de nodos viene del padre para que persista ─────────────
interface Props {
  userId: number;
  nodes: VNode[];
  setNodes: React.Dispatch<React.SetStateAction<VNode[]>>;
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenFile: (name: string, content: string, language: Language) => void;
}

export function FilesSidebar({ userId, nodes, setNodes, activeId, setActiveId, onOpenFile }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectsOpen && projects.length === 0) {
      getProjectsByUser(userId).then(setProjects).catch(() => {});
    }
  }, [projectsOpen, userId, projects.length]);

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

  const renameNode = (id: string, name: string) =>
    setNodes(prev => prev.map(n => n.id === id ? { ...n, name } : n));

  const createFile = (parentId: string | null = null) => {
    const node: VFile = { id: uid(), type: 'file', name: 'newFile.js', content: '', language: 'javascript', parentId };
    setNodes(prev => [...prev, node]);
    setActiveId(node.id);
    onOpenFile('newFile.js', '', 'javascript');
  };

  const createFolder = (parentId: string | null = null) => {
    const node: VFolder = { id: uid(), type: 'folder', name: 'newFolder', parentId, open: true };
    setNodes(prev => [...prev, node]);
  };

  const handleOpenFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(e.target.files ?? [])) {
      const content = await file.text();
      const lang = detectLang(file.name);
      const node: VFile = { id: uid(), type: 'file', name: file.name, content, language: lang, parentId: null };
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
      const data = await loadEditor(p.id);
      const node: VFile = { id: uid(), type: 'file', name: p.name + '.' + data.language, content: data.currentCode ?? '', language: data.language, parentId: null };
      setNodes(prev => [...prev, node]);
      setActiveId(node.id);
      onOpenFile(node.name, node.content, data.language);
    } catch (err) { console.error(getErrorMessage(err)); }
  };

  const roots = nodes.filter(n => n.parentId === null);

  return (
    <div className="flex flex-col h-full text-[#cccccc] overflow-hidden">
      <input ref={fileInputRef} type="file" multiple className="hidden"
        accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.h,.json,.md,.txt,.css,.html"
        onChange={handleOpenFiles} />
      <input ref={folderInputRef} type="file" multiple className="hidden"
        // @ts-expect-error webkitdirectory no está en los tipos TS
        webkitdirectory="" onChange={handleOpenFolder} />

      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e1e] shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#bbbbbb]">Explorer</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => fileInputRef.current?.click()} title="Open file" className="text-[#858585] hover:text-white cursor-pointer"><FileInput className="w-3.5 h-3.5" /></button>
          <button onClick={() => folderInputRef.current?.click()} title="Open folder" className="text-[#858585] hover:text-white cursor-pointer"><FolderInput className="w-3.5 h-3.5" /></button>
          <div className="w-px h-3 bg-[#3c3c3c]" />
          <button onClick={() => createFile()} title="New file" className="text-[#858585] hover:text-white cursor-pointer"><FilePlus className="w-3.5 h-3.5" /></button>
          <button onClick={() => createFolder()} title="New folder" className="text-[#858585] hover:text-white cursor-pointer"><FolderPlus className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {roots.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[#858585]">
            <p>No files yet.</p>
            <p className="mt-1">Open or create a file to start.</p>
          </div>
        )}
        {roots.map(n => (
          <TreeNode key={n.id} node={n} depth={0} nodes={nodes} activeId={activeId}
            onOpen={openFile} onToggle={toggleFolder} onDelete={deleteNode} onRename={renameNode} />
        ))}
      </div>

      <div className="border-t border-[#1e1e1e] shrink-0">
        <button onClick={() => setProjectsOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#858585] hover:text-[#cccccc] cursor-pointer">
          {projectsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span className="uppercase tracking-widest font-semibold">My Projects</span>
        </button>
        {projectsOpen && (
          <div className="max-h-40 overflow-y-auto pb-1">
            {projects.length === 0 && <p className="text-xs text-[#858585] px-4 py-2">No projects found.</p>}
            {projects.map(p => (
              <button key={p.id} onClick={() => handleLoadProject(p)}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#2a2d2e] text-left cursor-pointer">
                <span>{LANG_ICON[p.programmingLanguage] ?? '📄'}</span>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
