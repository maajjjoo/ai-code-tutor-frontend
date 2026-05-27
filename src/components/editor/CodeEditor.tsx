import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import type * as Monaco from 'monaco-editor';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import { saveSnapshot, getErrorMessage } from '../../services/api';
import type { EditorData } from '../../types';
import { useEditorPersistence } from '../../hooks/useEditorPersistence';
import { storage } from '../../utils/storage';
import { SaveIndicatorBar } from './SaveIndicatorBar';
import { AutosaveRecoveryBanner } from './AutosaveRecoveryBanner';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { Clock } from 'lucide-react';

interface Props {
  editorData: EditorData | null;
  code: string;
  onChange: (code: string) => void;
  onErrorCountChange?: (count: number, canValidate: boolean) => void;
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

function resolveMonacoLanguage(language: string, fileName: string): string {
  const hasKnownExtension = /\.(js|jsx|ts|tsx|py|java|cpp|h|cc)$/.test(fileName);
  if (!hasKnownExtension) return 'plaintext';
  return MONACO_LANGUAGE_MAP[language] ?? 'plaintext';
}

export function CodeEditor({ editorData, code, onChange, onErrorCountChange }: Props) {
  const isSavingToBackend          = useRef(false);
  const monacoDisposableRef        = useRef<Monaco.IDisposable | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const projectId = editorData?.projectId ?? 0;
  const fileName  = editorData?.projectName ?? 'untitled';

  const {
    hasUnsavedChanges,
    saveIndicatorState,
    lastSavedAt,
    saveManually,
    versionHistory,
    autosaveContent,
    autosaveTimestamp,
    dismissAutosaveBanner,
    restoreVersion,
  } = useEditorPersistence({ projectId, fileName, currentContent: code });

  // Update browser tab title with unsaved indicator
  useEffect(() => {
    const baseTitle = `${fileName} — CodeLearnAI`;
    document.title = hasUnsavedChanges ? `• ${baseTitle}` : baseTitle;
    return () => { document.title = 'CodeLearnAI'; };
  }, [hasUnsavedChanges, fileName]);

  const handleEditorMount = (_editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    // Enable JS/TS diagnostics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typescriptLanguageService = (monaco.languages as any).typescript;
    if (typescriptLanguageService) {
      typescriptLanguageService.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
      typescriptLanguageService.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    }

    monacoDisposableRef.current?.dispose();
    monacoDisposableRef.current = monaco.editor.onDidChangeMarkers(uris => {
      const errorMarkers = uris.flatMap(uri =>
        monaco.editor.getModelMarkers({ resource: uri })
          .filter(marker => marker.severity === monaco.MarkerSeverity.Error)
      );
      const currentLanguage = editorData?.language ?? '';
      const canValidate = currentLanguage === 'javascript' || currentLanguage === 'typescript';
      onErrorCountChange?.(errorMarkers.length, canValidate);
    });
  };

  useEffect(() => () => { monacoDisposableRef.current?.dispose(); }, []);

  // Ctrl+S — save locally and sync to backend
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        await saveManually();

        // Also sync to backend if project is real
        if (!editorData || isSavingToBackend.current || editorData.projectId === 0) return;
        isSavingToBackend.current = true;
        try {
          await saveSnapshot({ content: code, versionLabel: 'manual_save', projectId: editorData.projectId });
        } catch (err) {
          console.error('Backend sync failed:', getErrorMessage(err));
        } finally {
          isSavingToBackend.current = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, editorData, saveManually]);

  const handleKeepAutosave = () => {
    dismissAutosaveBanner();
  };

  const handleDiscardAutosave = () => {
    dismissAutosaveBanner();
    // Revert to last manually saved content if available
    const manualSaveKey = `saved-project-${projectId}-file-${fileName}`;
    const manualSaveRaw = storage.get(manualSaveKey);
    if (manualSaveRaw) {
      try {
        const parsed = JSON.parse(manualSaveRaw);
        onChange(parsed.fileContent ?? '');
      } catch { /* ignore */ }
    }
  };

  if (!editorData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white select-none">
        <div className="text-center">
          <p className="text-5xl mb-4 opacity-20 text-[#9CA3AF]">{'</>'}</p>
          <p className="text-sm text-[#9CA3AF]">Open a file from the explorer to start</p>
          <p className="text-xs mt-2 text-[#C4C4C4]">Ctrl+S to save</p>
        </div>
      </div>
    );
  }

  const monacoLanguage = resolveMonacoLanguage(editorData.language, editorData.projectName);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Tab bar */}
      <div className="flex items-center bg-white border-b border-[#E5E7EB] shrink-0" style={{ height: 36 }}>
        <div
          className="flex items-center gap-2 px-4 h-full border-t-2 border-[#534AB7] bg-white"
        >
          <span className="text-xs text-[#111827]">{editorData.projectName}</span>

          {/* Unsaved dot */}
          {hasUnsavedChanges && (
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#F59E0B]"
              title="Unsaved changes"
            />
          )}
        </div>

        {/* Save status */}
        <div className="ml-auto flex items-center gap-3 px-3">
          {lastSavedAt && !hasUnsavedChanges && (
            <span className="text-[10px] text-[#9CA3AF]">
              Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {/* Version history button */}
          {versionHistory.length > 0 && (
            <button
              onClick={() => setShowVersionHistory(previous => !previous)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded cursor-pointer transition-colors hover:bg-[#F0F1F3] text-[#9CA3AF]"
              aria-label="View version history"
            >
              <Clock className="w-3 h-3" />
              {versionHistory.length}
            </button>
          )}
        </div>
      </div>

      {/* Autosave recovery banner */}
      {autosaveContent && autosaveTimestamp && (
        <AutosaveRecoveryBanner
          autosaveTimestamp={autosaveTimestamp}
          onKeep={handleKeepAutosave}
          onDiscard={handleDiscardAutosave}
        />
      )}

      {/* Save indicator bar */}
      <SaveIndicatorBar state={saveIndicatorState} />

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-white">
            <div className="animate-spin h-6 w-6 border-2 border-[#534AB7] rounded-full border-t-transparent" />
          </div>
        }>
          <MonacoEditor
            height="100%"
            language={monacoLanguage}
            value={code}
            theme="vs"
            onMount={handleEditorMount}
            onChange={value => onChange(value ?? '')}
            aria-label="Code editor"
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
              cursorBlinking: 'smooth',
            }}
          />
        </Suspense>
      </div>

      {/* Version history panel */}
      {showVersionHistory && (
        <VersionHistoryPanel
          versions={versionHistory}
          currentContent={code}
          onRestore={restoredContent => {
            onChange(restoredContent);
            restoreVersion(restoredContent);
            setShowVersionHistory(false);
          }}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}
