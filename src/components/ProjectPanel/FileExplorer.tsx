import { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { FSNode, FolderNode } from '../../types';
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  FilePlus, FolderPlus, Trash2, Pencil,
} from 'lucide-react';

// ─── File icon by extension ───────────────────────────────────────────────────
function fileColor(name: string): string {
  if (name.endsWith('.py')) return 'text-yellow-400';
  if (name.endsWith('.java')) return 'text-orange-400';
  if (name.endsWith('.cpp') || name.endsWith('.h')) return 'text-blue-300';
  return 'text-indigo-300';
}

// ─── Single tree node ─────────────────────────────────────────────────────────
function TreeNode({ node, depth, allNodes }: { node: FSNode; depth: number; allNodes: FSNode[] }) {
  const { state, openFile, toggleFolder, deleteNode, renameNode, createFile, createFolder } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = node.type === 'file' && state.activeFileId === node.id;
  const children = allNodes.filter((n) => n.parentId === node.id);

  const handleClick = () => {
    if (node.type === 'file') openFile(node.id);
    else toggleFolder(node.id);
  };

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== node.name) renameNode(node.id, trimmed);
    setEditing(false);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(node.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm transition-colors select-none
          ${isActive ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-[#2a2a3e] text-gray-300'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleClick}
      >
        {/* Expand arrow for folders */}
        {node.type === 'folder' ? (
          (node as FolderNode).isOpen
            ? <ChevronDown className="w-3 h-3 shrink-0 text-gray-500" />
            : <ChevronRight className="w-3 h-3 shrink-0 text-gray-500" />
        ) : (
          <span className="w-3 h-3 shrink-0" />
        )}

        {/* Icon */}
        {node.type === 'folder'
          ? ((node as FolderNode).isOpen
            ? <FolderOpen className="w-4 h-4 shrink-0 text-yellow-400" />
            : <Folder className="w-4 h-4 shrink-0 text-yellow-400" />)
          : <File className={`w-4 h-4 shrink-0 ${fileColor(node.name)}`} />}

        {/* Name / edit input */}
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setEditing(false); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-[#16162a] border border-indigo-500 rounded px-1 text-xs text-gray-200 outline-none"
          />
        ) : (
          <span className="flex-1 truncate text-xs">{node.name}</span>
        )}

        {/* Action buttons — visible on hover */}
        {!editing && (
          <span className="hidden group-hover:flex items-center gap-1 shrink-0">
            {node.type === 'folder' && (
              <>
                <button onClick={(e) => { e.stopPropagation(); createFile('newFile.js', node.id); }} title="New file" className="hover:text-indigo-400 cursor-pointer"><FilePlus className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); createFolder('newFolder', node.id); }} title="New folder" className="hover:text-indigo-400 cursor-pointer"><FolderPlus className="w-3 h-3" /></button>
              </>
            )}
            <button onClick={startEdit} title="Rename" className="hover:text-indigo-400 cursor-pointer"><Pencil className="w-3 h-3" /></button>
            <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} title="Delete" className="hover:text-red-400 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
          </span>
        )}
      </div>

      {/* Children */}
      {node.type === 'folder' && (node as FolderNode).isOpen && children.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} allNodes={allNodes} />
      ))}
    </div>
  );
}

// ─── Explorer root ────────────────────────────────────────────────────────────
export function FileExplorer() {
  const { state, createFile, createFolder } = useAppContext();
  const roots = state.fsNodes.filter((n) => n.parentId === null);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a3e] shrink-0">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Explorer</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => createFile('newFile.js', null)}
            title="New file"
            className="text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => createFolder('newFolder', null)}
            title="New folder"
            className="text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {roots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-gray-600 gap-2 px-4">
            <FolderOpen className="w-8 h-8 opacity-20" />
            <p className="text-xs">No files yet. Click the icons above to create a file or folder.</p>
          </div>
        ) : (
          roots.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} allNodes={state.fsNodes} />
          ))
        )}
      </div>
    </div>
  );
}
