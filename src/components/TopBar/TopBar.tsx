import { GraduationCap, ArrowLeft, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';

const LANG_BADGE: Record<string, string> = {
  javascript: 'text-yellow-400 bg-yellow-400/10',
  typescript: 'text-blue-400 bg-blue-400/10',
  python: 'text-green-400 bg-green-400/10',
  java: 'text-orange-400 bg-orange-400/10',
  cpp: 'text-blue-300 bg-blue-300/10',
};

interface Props { onBackToDashboard: () => void; }

export function TopBar({ onBackToDashboard }: Props) {
  const { state } = useAppContext();
  const { user, logout } = useAuth();
  const lang = state.currentProject?.programmingLanguage;

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-[#16162a] border-b border-[#2a2a3e] shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onBackToDashboard} className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer" title="Back to Dashboard">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <GraduationCap className="w-5 h-5 text-indigo-400" />
        <span className="text-base font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          CodeTutor
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300 truncate max-w-xs">
          {state.currentProject?.name ?? 'No project'}
        </span>
        {lang && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LANG_BADGE[lang] ?? 'text-gray-400 bg-gray-400/10'}`}>
            {lang}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{user?.username}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </Button>
      </div>
    </header>
  );
}
