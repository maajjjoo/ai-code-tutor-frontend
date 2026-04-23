import { useState } from 'react';
import { X, RotateCcw, Clock } from 'lucide-react';
import type { SavedVersion } from '../../hooks/useEditorPersistence';

interface Props {
  versions: SavedVersion[];
  currentContent: string;
  onRestore: (content: string) => void;
  onClose: () => void;
}

function buildDiffLines(originalContent: string, modifiedContent: string): { type: 'added' | 'removed' | 'unchanged'; text: string }[] {
  const originalLines  = originalContent.split('\n');
  const modifiedLines  = modifiedContent.split('\n');
  const result: { type: 'added' | 'removed' | 'unchanged'; text: string }[] = [];

  const maxLength = Math.max(originalLines.length, modifiedLines.length);
  for (let index = 0; index < maxLength; index++) {
    const originalLine  = originalLines[index];
    const modifiedLine  = modifiedLines[index];

    if (originalLine === undefined) {
      result.push({ type: 'added', text: modifiedLine });
    } else if (modifiedLine === undefined) {
      result.push({ type: 'removed', text: originalLine });
    } else if (originalLine !== modifiedLine) {
      result.push({ type: 'removed', text: originalLine });
      result.push({ type: 'added', text: modifiedLine });
    } else {
      result.push({ type: 'unchanged', text: originalLine });
    }
  }

  return result;
}

export function VersionHistoryPanel({ versions, currentContent, onRestore, onClose }: Props) {
  const [selectedVersion, setSelectedVersion] = useState<SavedVersion | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const diffLines = selectedVersion
    ? buildDiffLines(selectedVersion.fileContent, currentContent)
    : [];

  const handleRestoreConfirm = () => {
    if (!selectedVersion) return;
    onRestore(selectedVersion.fileContent);
    setShowRestoreConfirm(false);
    onClose();
  };

  return (
    <div
      className="fixed right-0 top-0 h-full w-96 flex flex-col border-l z-50 shadow-2xl"
      style={{ background: '#0d0d14', borderColor: '#1e1e2e' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: '#89b4fa' }} />
          <span className="text-sm font-semibold" style={{ color: '#cdd6f4' }}>Historial de versiones</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded cursor-pointer transition-colors hover:bg-[#1e1e2e]"
          aria-label="Cerrar historial"
        >
          <X className="w-4 h-4" style={{ color: '#585b70' }} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Version list */}
        <div className="w-40 border-r flex flex-col overflow-y-auto shrink-0" style={{ borderColor: '#1e1e2e' }}>
          {versions.length === 0 && (
            <p className="text-xs p-3 text-center" style={{ color: '#585b70' }}>Sin versiones guardadas</p>
          )}
          {[...versions].reverse().map(version => (
            <button
              key={version.versionNumber}
              onClick={() => setSelectedVersion(version)}
              className="text-left px-3 py-2.5 border-b cursor-pointer transition-colors"
              style={{
                borderColor: '#1e1e2e',
                background: selectedVersion?.versionNumber === version.versionNumber ? '#1e1e2e' : 'transparent',
                color: selectedVersion?.versionNumber === version.versionNumber ? '#cdd6f4' : '#a6adc8',
              }}
              aria-label={`Versión ${version.versionNumber}`}
            >
              <p className="text-[11px] font-medium">v{version.versionNumber}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#585b70' }}>
                {new Date(version.savedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px]" style={{ color: '#45475a' }}>{version.linesCount} líneas</p>
            </button>
          ))}
        </div>

        {/* Diff view */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedVersion ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs" style={{ color: '#585b70' }}>Selecciona una versión</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto font-mono text-[11px]">
                {diffLines.map((diffLine, index) => (
                  <div
                    key={index}
                    className="px-3 py-0.5 whitespace-pre-wrap"
                    style={{
                      background: diffLine.type === 'added' ? '#1a3a2a' : diffLine.type === 'removed' ? '#3a1a1a' : 'transparent',
                      color: diffLine.type === 'added' ? '#a6e3a1' : diffLine.type === 'removed' ? '#f38ba8' : '#585b70',
                    }}
                  >
                    {diffLine.type === 'added' ? '+ ' : diffLine.type === 'removed' ? '- ' : '  '}
                    {diffLine.text}
                  </div>
                ))}
              </div>

              {/* Restore button */}
              <div className="p-3 border-t shrink-0" style={{ borderColor: '#1e1e2e' }}>
                {!showRestoreConfirm ? (
                  <button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs rounded-lg cursor-pointer transition-colors border"
                    style={{ borderColor: '#89b4fa', color: '#89b4fa' }}
                    aria-label="Restaurar esta versión"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar esta versión
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-center" style={{ color: '#a6adc8' }}>
                      ¿Reemplazar el contenido actual?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRestoreConfirm}
                        className="flex-1 py-1.5 text-xs rounded cursor-pointer transition-colors"
                        style={{ background: '#89b4fa', color: '#1e1e2e' }}
                        aria-label="Confirmar restauración"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setShowRestoreConfirm(false)}
                        className="flex-1 py-1.5 text-xs rounded cursor-pointer transition-colors border"
                        style={{ borderColor: '#313244', color: '#585b70' }}
                        aria-label="Cancelar restauración"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
