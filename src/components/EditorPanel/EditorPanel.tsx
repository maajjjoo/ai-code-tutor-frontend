import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useAppContext } from '../../context/AppContext';
import { EditorControls } from './EditorControls';

const MONACO_LANG: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
};

export function EditorPanel() {
  const { state, setCode, triggerAnalysis } = useAppContext();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lang = state.currentProject?.programmingLanguage ?? 'javascript';

  // Reset debounce on unmount
  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const handleChange = (value: string | undefined) => {
    const code = value ?? '';
    setCode(code);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (code.trim()) triggerAnalysis();
    }, 2000);
  };

  return (
    <section className="flex flex-col flex-1 h-full min-w-0 border-x border-[#2a2a3e]">
      {/* File name tab */}
      {state.activeFileId && (
        <div className="px-4 py-1.5 bg-[#16162a] border-b border-[#2a2a3e] shrink-0">
          <span className="text-xs text-gray-400">
            {state.fsNodes.find((n) => n.id === state.activeFileId)?.name ?? 'untitled'}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={MONACO_LANG[lang]}
          value={state.code}
          theme="vs-dark"
          onChange={handleChange}
          options={{
            fontSize: 14,
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
      <EditorControls />
    </section>
  );
}
