import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SavedVersion {
  versionNumber: number;
  fileContent: string;
  savedAt: string;
  linesCount: number;
}

export type SaveIndicatorState = 'idle' | 'unsaved' | 'saving' | 'saved';

interface UseEditorPersistenceParams {
  projectId: string | number;
  fileName: string;
  currentContent: string;
}

interface UseEditorPersistenceResult {
  savedContent: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  saveIndicatorState: SaveIndicatorState;
  lastSavedAt: Date | null;
  saveManually: () => Promise<void>;
  versionHistory: SavedVersion[];
  autosaveContent: string | null;
  autosaveTimestamp: string | null;
  dismissAutosaveBanner: () => void;
  restoreVersion: (versionContent: string) => void;
}

const MAXIMUM_VERSIONS_PER_FILE = 10;
const AUTOSAVE_DEBOUNCE_MS = 2000;
const SAVED_INDICATOR_DURATION_MS = 2000;

// ── Storage key helpers ───────────────────────────────────────────────────────

function buildManualSaveKey(projectId: string | number, fileName: string): string {
  return `saved-project-${projectId}-file-${fileName}`;
}

function buildAutosaveKey(projectId: string | number, fileName: string): string {
  return `autosave-project-${projectId}-file-${fileName}`;
}

function buildHistoryKey(projectId: string | number, fileName: string): string {
  return `history-project-${projectId}-file-${fileName}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEditorPersistence({
  projectId,
  fileName,
  currentContent,
}: UseEditorPersistenceParams): UseEditorPersistenceResult {

  const [savedContent, setSavedContent]               = useState('');
  const [isSaving, setIsSaving]                       = useState(false);
  const [saveIndicatorState, setSaveIndicatorState]   = useState<SaveIndicatorState>('idle');
  const [lastSavedAt, setLastSavedAt]                 = useState<Date | null>(null);
  const [versionHistory, setVersionHistory]           = useState<SavedVersion[]>([]);
  const [autosaveContent, setAutosaveContent]         = useState<string | null>(null);
  const [autosaveTimestamp, setAutosaveTimestamp]     = useState<string | null>(null);

  const autosaveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUnsavedChanges = currentContent !== savedContent && currentContent !== '';

  // ── Load initial state from localStorage ───────────────────────────────────
  useEffect(() => {
    if (!projectId || !fileName) return;

    const manualSaveKey = buildManualSaveKey(projectId, fileName);
    const autosaveKey   = buildAutosaveKey(projectId, fileName);
    const historyKey    = buildHistoryKey(projectId, fileName);

    const manualSaveRaw = localStorage.getItem(manualSaveKey);
    const autosaveRaw   = localStorage.getItem(autosaveKey);
    const historyRaw    = localStorage.getItem(historyKey);

    if (manualSaveRaw) {
      try {
        const parsed = JSON.parse(manualSaveRaw);
        setSavedContent(parsed.fileContent ?? '');
        setLastSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : null);
      } catch { /* ignore malformed data */ }
    }

    if (autosaveRaw) {
      try {
        const parsed = JSON.parse(autosaveRaw);
        // Only show autosave banner if it differs from manual save
        if (!manualSaveRaw || parsed.fileContent !== JSON.parse(manualSaveRaw).fileContent) {
          setAutosaveContent(parsed.fileContent ?? null);
          setAutosaveTimestamp(parsed.savedAt ?? null);
        }
      } catch { /* ignore */ }
    }

    if (historyRaw) {
      try {
        setVersionHistory(JSON.parse(historyRaw));
      } catch { /* ignore */ }
    }
  }, [projectId, fileName]);

  // ── Update save indicator state ─────────────────────────────────────────────
  useEffect(() => {
    if (isSaving) {
      setSaveIndicatorState('saving');
    } else if (hasUnsavedChanges) {
      setSaveIndicatorState('unsaved');
    } else if (savedContent) {
      setSaveIndicatorState('saved');
    } else {
      setSaveIndicatorState('idle');
    }
  }, [hasUnsavedChanges, isSaving, savedContent]);

  // ── Autosave with debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId || !fileName || !currentContent || !hasUnsavedChanges) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      const autosaveKey = buildAutosaveKey(projectId, fileName);
      const autosaveData = {
        fileName,
        fileContent: currentContent,
        savedAt: new Date().toISOString(),
        projectId,
      };
      localStorage.setItem(autosaveKey, JSON.stringify(autosaveData));
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [currentContent, hasUnsavedChanges, projectId, fileName]);

  // ── Ctrl+S handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveManually();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentContent, projectId, fileName]);

  // ── Manual save ─────────────────────────────────────────────────────────────
  const saveManually = useCallback(async () => {
    if (!projectId || !fileName || !currentContent) return;
    setIsSaving(true);

    const timestamp = new Date().toISOString();
    const saveData = {
      fileName,
      fileContent: currentContent,
      savedAt: timestamp,
      projectId,
    };

    // Save to localStorage
    localStorage.setItem(buildManualSaveKey(projectId, fileName), JSON.stringify(saveData));

    // Update version history
    const historyKey = buildHistoryKey(projectId, fileName);
    const existingHistory: SavedVersion[] = (() => {
      try { return JSON.parse(localStorage.getItem(historyKey) ?? '[]'); }
      catch { return []; }
    })();

    const newVersion: SavedVersion = {
      versionNumber: (existingHistory[existingHistory.length - 1]?.versionNumber ?? 0) + 1,
      fileContent: currentContent,
      savedAt: timestamp,
      linesCount: currentContent.split('\n').length,
    };

    const updatedHistory = [...existingHistory, newVersion].slice(-MAXIMUM_VERSIONS_PER_FILE);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    setVersionHistory(updatedHistory);

    setSavedContent(currentContent);
    setLastSavedAt(new Date(timestamp));
    setIsSaving(false);

    // Show "saved" indicator briefly
    setSaveIndicatorState('saved');
    if (savedIndicatorTimer.current) clearTimeout(savedIndicatorTimer.current);
    savedIndicatorTimer.current = setTimeout(() => {
      setSaveIndicatorState('idle');
    }, SAVED_INDICATOR_DURATION_MS);
  }, [currentContent, projectId, fileName]);

  // ── Dismiss autosave banner ─────────────────────────────────────────────────
  const dismissAutosaveBanner = useCallback(() => {
    setAutosaveContent(null);
    setAutosaveTimestamp(null);
  }, []);

  // ── Restore a specific version ──────────────────────────────────────────────
  const restoreVersion = useCallback((versionContent: string) => {
    setSavedContent(versionContent);
  }, []);

  return {
    savedContent,
    hasUnsavedChanges,
    isSaving,
    saveIndicatorState,
    lastSavedAt,
    saveManually,
    versionHistory,
    autosaveContent,
    autosaveTimestamp,
    dismissAutosaveBanner,
    restoreVersion,
  };
}
