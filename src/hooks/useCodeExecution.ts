import { useState, useCallback } from 'react';
import type * as Monaco from 'monaco-editor';
import { runCode } from '../services/api';
import type { useVirtualFileSystem } from './useVirtualFileSystem';

interface MonacoMarker {
  startLineNumber: number; startColumn: number;
  endLineNumber: number; endColumn: number;
  message: string; severity: number;
}

type TermLine = { text: string; type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' | 'input' };

interface Params {
  vfs: ReturnType<typeof useVirtualFileSystem>;
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
  monacoRef: React.RefObject<typeof Monaco | null>;
}

export function useCodeExecution({ vfs, editorRef, monacoRef }: Params) {
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'Terminal' | 'Output' | 'Problems'>('Terminal');
  const [termLines, setTermLines] = useState<TermLine[]>([]);
  const [terminalRunning, setTerminalRunning] = useState(false);

  const setRunStderrMarkers = useCallback((stderr: string) => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;
    const markers: MonacoMarker[] = [];
    stderr.split('\n').forEach(line => {
      const match = line.match(/line\s*(\d+)/i) || line.match(/Line\s*(\d+)/i);
      if (match) {
        markers.push({
          startLineNumber: parseInt(match[1]), startColumn: 1,
          endLineNumber: parseInt(match[1]), endColumn: 1000,
          message: line.trim(), severity: monaco.MarkerSeverity.Error,
        });
      }
    });
    monaco.editor.setModelMarkers(model, 'runtime', markers);
  }, [editorRef, monacoRef]);

  const buildRunOutputLines = useCallback((res: { stdout: string; stderr: string; exitCode: number }): TermLine[] => {
    const next: TermLine[] = [];
    if (res.stdout) res.stdout.split('\n').filter(Boolean).forEach(l => next.push({ text: l, type: 'output' }));
    if (res.stderr) res.stderr.split('\n').filter(Boolean).forEach(l => next.push({ text: l, type: 'error' }));
    if (!res.stdout && !res.stderr) next.push({ text: '(no output)', type: 'output' });
    next.push({ text: res.exitCode === 0 ? 'Process finished with exit code 0' : `Process finished with exit code ${res.exitCode}`, type: res.exitCode === 0 ? 'output' : 'error' });
    return next;
  }, []);

  const handleRunCode = useCallback(async () => {
    if (!vfs.code.trim()) return;
    setConsoleOpen(true);
    setConsoleTab('Output');
    setTermLines(prev => [...prev, { text: '> Running...', type: 'info' }]);
    setTerminalRunning(true);
    try {
      const res = await runCode({ code: vfs.code, language: vfs.openFile?.language ?? 'python' });
      const next: TermLine[] = [{ text: '> Running...', type: 'info' }, ...buildRunOutputLines(res)];
      if (res.stderr) setRunStderrMarkers(res.stderr);
      setTermLines(next);
    } catch {
      setTermLines(prev => [...prev, { text: 'Error executing code', type: 'error' }]);
    } finally {
      setTerminalRunning(false);
    }
  }, [vfs.code, vfs.openFile, buildRunOutputLines, setRunStderrMarkers]);

  return {
    consoleOpen, setConsoleOpen,
    consoleTab, setConsoleTab,
    termLines, setTermLines,
    terminalRunning,
    handleRunCode, setRunStderrMarkers,
  };
}
