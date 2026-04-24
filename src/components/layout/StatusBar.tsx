import { GitBranch as _GitBranch, User, AlertTriangle, CheckCircle, Info } from 'lucide-react';

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

const LANG_COLOR: Record<string, string> = {
  javascript: 'text-yellow-300',
  typescript: 'text-blue-300',
  python: 'text-green-300',
  java: 'text-orange-300',
  cpp: 'text-cyan-300',
};

export function StatusBar({ language, projectName, version, username, errorCount = 0, canValidate = false, hasAiWarning = false, hasUnsavedChanges = false }: Props) {
  return (
    <div className="flex items-center justify-between px-3 h-6 bg-[#080810] border-t border-[#1e1e2e] text-[11px] shrink-0 select-none" style={{ height: 22 }}>
      <div className="flex items-center gap-3">
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span style={{ color: '#585b70' }}>Conectado</span>
        </div>

        <div className="w-px h-3" style={{ background: '#313244' }} />

        {/* Language */}
        <span className={`font-mono font-semibold ${LANG_COLOR[language] ?? ''}`} style={!LANG_COLOR[language] ? { color: '#89b4fa' } : {}}>
          {language || 'plaintext'}
        </span>

        {/* Save status — only show when a file is open */}
        {projectName && projectName !== 'No file open' && projectName !== '—' && (
          hasUnsavedChanges
            ? <span style={{ color: '#f9e2af' }}>Sin guardar</span>
            : <span style={{ color: '#a6e3a1' }}>✓ Guardado</span>
        )}

        {projectName !== 'No file open' && projectName && (
          <>
            <div className="w-px h-3" style={{ background: '#313244' }} />
            <span className="truncate max-w-[180px]" style={{ color: '#585b70' }}>{projectName}</span>
          </>
        )}
        {version > 0 && <span style={{ color: '#45475a' }}>v{version}</span>}
      </div>

      <div className="flex items-center gap-3">
        {canValidate && (
          errorCount > 0 ? (
            <div className="flex items-center gap-1" style={{ color: '#f38ba8' }}>
              <AlertTriangle className="w-3 h-3" />
              <span>{errorCount} {errorCount === 1 ? 'error' : 'errores'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1" style={{ color: '#a6e3a1' }}>
              <CheckCircle className="w-3 h-3" />
              <span>Sin errores</span>
            </div>
          )
        )}

        {!canValidate && language && language !== 'plaintext' && language !== '—' && (
          hasAiWarning ? (
            <div className="flex items-center gap-1" style={{ color: '#f9e2af' }}>
              <AlertTriangle className="w-3 h-3" />
              <span>Posibles errores</span>
            </div>
          ) : (
            <div className="flex items-center gap-1" style={{ color: '#45475a' }}>
              <Info className="w-3 h-3" />
              <span>Sin validación</span>
            </div>
          )
        )}

        <div className="w-px h-3" style={{ background: '#313244' }} />
        <div className="flex items-center gap-1.5" style={{ color: '#585b70' }}>
          <User className="w-3 h-3" />
          <span>{username}</span>
        </div>

        {/* Progress bar placeholder */}
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: '#313244' }}>
            <div className="h-full rounded-full" style={{ width: '40%', background: '#89b4fa' }} />
          </div>
          <span style={{ color: '#89b4fa' }}>40%</span>
        </div>
      </div>
    </div>
  );
}
