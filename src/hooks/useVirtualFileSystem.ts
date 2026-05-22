import { useState, useCallback, useRef, useEffect } from 'react';
import type { Language } from '../types';
import type { VNode, VFile } from '../types/vfs';
import { uid, detectLang } from '../types/vfs';

export const FS_STORAGE_KEY = 'codetutor-fs-nodes';

export function useVirtualFileSystem() {
  const [fsNodes, setFsNodes] = useState<VNode[]>(() => {
    try { return JSON.parse(localStorage.getItem(FS_STORAGE_KEY) ?? '[]'); } catch { return []; }
  });
  const [fsActiveId, setFsActiveId] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<{ name: string; content: string; language: Language } | null>(null);
  const [code, setCode] = useState('');
  const fileContentsRef = useRef<Record<string, string>>({});

  const firstFolder = fsNodes.find(n => n.type === 'folder' && n.parentId === null);
  const filesList = fsNodes.filter(n => n.type === 'file' && n.parentId === firstFolder?.id) as VFile[];

  useEffect(() => {
    localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(fsNodes));
  }, [fsNodes]);

  useEffect(() => {
    if (!fsActiveId) { setOpenFile(null); setCode(''); return; }
    const node = fsNodes.find(n => n.id === fsActiveId);
    if (node && node.type === 'file') {
      const cached = fileContentsRef.current[fsActiveId];
      const content = cached !== undefined ? cached : node.content;
      setOpenFile({ name: node.name, content, language: node.language });
      setCode(content);
    }
  }, [fsActiveId, fsNodes]);

  const fsActiveIdRef = useRef(fsActiveId);
  fsActiveIdRef.current = fsActiveId;
  const codeRef = useRef(code);
  codeRef.current = code;
  const fsNodesRef = useRef(fsNodes);
  fsNodesRef.current = fsNodes;

  const switchToFile = useCallback((fileId: string) => {
    if (fsActiveIdRef.current !== null) {
      fileContentsRef.current[fsActiveIdRef.current] = codeRef.current;
    }
    const node = fsNodesRef.current.find(n => n.id === fileId);
    if (node && node.type === 'file') {
      const cached = fileContentsRef.current[fileId];
      const content = cached !== undefined ? cached : node.content;
      setOpenFile({ name: node.name, content, language: node.language });
      setCode(content);
    }
    setFsActiveId(fileId);
  }, []);

  const handleCodeChange = useCallback((val: string | undefined) => {
    const newVal = val ?? '';
    setCode(newVal);
    if (fsActiveId) {
      fileContentsRef.current[fsActiveId] = newVal;
    }
  }, [fsActiveId]);

  const switchToFileRef = useRef(switchToFile);
  switchToFileRef.current = switchToFile;

  const handleNewFile = useCallback((name: string) => {
    const lang = detectLang(name);
    const node: VFile = { id: uid(), type: 'file', name, content: '', language: lang, parentId: firstFolder?.id ?? null };
    setFsNodes(prev => [...prev, node]);
    fileContentsRef.current[node.id] = '';
    switchToFileRef.current(node.id);
    return node;
  }, [firstFolder]);

  const handleRenameFile = useCallback((fileId: string, newName: string) => {
    const lang = detectLang(newName);
    setFsNodes(prev => prev.map(n =>
      n.id === fileId && n.type === 'file'
        ? { ...n, name: newName, language: lang }
        : n
    ));
    if (fsActiveId === fileId && openFile) {
      setOpenFile(prev => prev ? { ...prev, name: newName, language: lang } : null);
    }
  }, [fsActiveId, openFile]);

  const handleDeleteFile = useCallback((fileId: string) => {
    setFsNodes(prev => prev.filter(n => n.id !== fileId));
    if (fsActiveId === fileId) {
      setFsActiveId(null);
      setOpenFile(null);
      setCode('');
    }
    delete fileContentsRef.current[fileId];
  }, [fsActiveId]);

  return {
    fsNodes, setFsNodes, fsActiveId, setFsActiveId,
    openFile, setOpenFile, code, setCode,
    fileContentsRef, firstFolder, filesList,
    switchToFile, handleCodeChange,
    handleNewFile, handleRenameFile, handleDeleteFile,
  };
}
