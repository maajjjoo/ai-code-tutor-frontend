import { GitBranch, User } from 'lucide-react';

interface Props {
  language: string;
  projectName: string;
  version: number;
  username: string;
}

const LANG_COLOR: Record<string, string> = {
  javascript: 'text-yellow-300',
  typescript: 'text-blue-300',
  python: 'text-green-300',
  java: 'text-orange-300',
  cpp: 'text-cyan-300',
};

export function StatusBar({ language, projectName, version, username }: Props) {
  return (
    <div className="flex items-center justify-between px-3 h-6 bg-[#0e639c] text-white text-[11px] shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3 h-3 opacity-70" />
          <span className="opacity-90">main</span>
        </div>
        <div className="w-px h-3 bg-white/20" />
        <span className={`font-mono font-semibold ${LANG_COLOR[language] ?? 'text-white'}`}>
          {language}
        </span>
        {projectName !== 'No file open' && (
          <>
            <div className="w-px h-3 bg-white/20" />
            <span className="opacity-80 truncate max-w-[180px]">{projectName}</span>
          </>
        )}
        {version > 0 && <span className="opacity-60">v{version}</span>}
      </div>
      <div className="flex items-center gap-1.5 opacity-80">
        <User className="w-3 h-3" />
        <span>{username}</span>
      </div>
    </div>
  );
}
