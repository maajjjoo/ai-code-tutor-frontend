import { useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { saveSnapshot, getErrorMessage } from '../../services/api';
import type { EditorData } from '../../types';

interface Props {
  editorData: EditorData | null;
  code: string;
  onChange: (code: string) => void;
}

const MONACO_LANG: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

export function CodeEditor({ editorData, code, onChange }: Props) {
  const saving = useRef(false);

  // Ctrl+S para guardar snapshot
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!editorData || saving.current) return;
        saving.current = true;
        try {
          await saveSnapshot({ content: code, versionLabel: 'autosave', projectId: editorData.projectId });
        } catch (err) {
          console.error(getErrorMessage(err));
        } finally {
          saving.current = false;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, editorData]);

  if (!editorData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#858585] text-sm select-none">
        <div className="text-center">
          <p className="text-4xl mb-4">{'</>'}</p>
          <p>Select a project from the Explorer to start coding</p>
          <p className="text-xs mt-2 text-[#555]">Ctrl+S to save a snapshot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center bg-[#252526] border-b border-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border-t-2 border-[#007acc] text-sm text-[#cccccc]">
          <span>{editorData.projectName}</span>
          <span className="text-[#858585] text-xs">.{editorData.language}</span>
        </div>
      </div>
      <MonacoEditor
        height="100%"
        language={MONACO_LANG[editorData.language] ?? 'javascript'}
        value={code}
        theme="vs-dark"
        onChange={v => onChange(v ?? '')}
        options={{
          fontSize: 14,
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
