import { User, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Props {
  language: string;
  projectName: string;
  version: number;
  username: string;
  errorCount?: number;
  canValidate?: boolean;
  hasAiWarning?: boolean;
  hasUnsavedChanges?: boolean;
}

export function StatusBar({ language, projectName, version, username, errorCount = 0, canValidate = false, hasAiWarning = false, hasUnsavedChanges = false }: Props) {
  return (
    <div className="flex items-center justify-between px-3 h-6 bg-[#534AB7] text-white text-[11px] shrink-0 select-none">
      <div className="flex items-center gap-3">
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span className="opacity-80">Conectado</span>
        </div>

        <div className="w-px h-3 bg-white/20" />

        {/* Language */}
        <span className="font-medium">{language || 'plaintext'}</span>

        {/* Save status */}
        {projectName && projectName !== 'No file open' && projectName !== '—' && (
          hasUnsavedChanges
            ? <span className="opacity-80">● Unsaved</span>
            : <span className="opacity-80">✓ Saved</span>
        )}

        {projectName !== 'No file open' && projectName && (
          <>
            <div className="w-px h-3 bg-white/20" />
            <span className="truncate max-w-[180px] opacity-80">{projectName}</span>
          </>
        )}
        {version > 0 && <span className="opacity-60">v{version}</span>}
      </div>

      <div className="flex items-center gap-3">
        {canValidate && (
          errorCount > 0 ? (
            <div className="flex items-center gap-1 text-red-200">
              <AlertTriangle className="w-3 h-3" />
              <span>{errorCount} {errorCount === 1 ? 'error' : 'errores'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-200">
              <CheckCircle className="w-3 h-3" />
              <span>Sin errores</span>
            </div>
          )
        )}

        {!canValidate && language && language !== 'plaintext' && language !== '—' && (
          hasAiWarning ? (
            <div className="flex items-center gap-1 text-yellow-200">
              <AlertTriangle className="w-3 h-3" />
              <span>Posibles errores</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 opacity-60">
              <Info className="w-3 h-3" />
              <span>Sin validación</span>
            </div>
          )
        )}

        <div className="w-px h-3 bg-white/20" />
        <div className="flex items-center gap-1.5 opacity-80">
          <User className="w-3 h-3" />
          <span>{username}</span>
        </div>

        <span className="opacity-60">UTF-8</span>
      </div>
    </div>
  );
}
