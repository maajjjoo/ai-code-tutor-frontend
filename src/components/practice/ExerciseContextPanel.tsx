import { UI } from '../../constants/ui.strings';
import type { ExerciseContext } from '../../types';

interface Props {
  context: ExerciseContext;
  onDismiss: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ExerciseContextPanel({ context, onDismiss, isCollapsed, onToggleCollapse }: Props) {
  if (isCollapsed) {
    return (
      <div className="h-8 bg-[#EEEDFE] dark:bg-indigo-900/30 border-b border-[#AFA9EC] dark:border-indigo-500/50 flex items-center gap-2 px-5 shrink-0 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span className="text-[12px] text-[#3C3489] dark:text-indigo-300 truncate max-w-xs flex-1">
          Exercise: {context.lessonTitle}
        </span>
        <button
          onClick={onToggleCollapse}
          className="text-[#534AB7] hover:opacity-70 cursor-pointer shrink-0"
          title="Expand"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#EEEDFE] dark:bg-indigo-900/30 border-b border-[#AFA9EC] dark:border-indigo-500/50 px-5 py-3 shrink-0 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center text-[11px] font-semibold text-white bg-[#534AB7] rounded-full px-2 py-0.5">
              {UI.LESSON_EXERCISE}
            </span>
            <span className="text-[13px] font-medium text-[#3C3489] dark:text-indigo-300 truncate ml-2">
              {context.lessonTitle}
            </span>
          </div>
          <p className="text-[12px] text-[#4B5563] dark:text-gray-400 mt-1 max-w-[70%] line-clamp-2">
            {context.exercisePrompt}
          </p>
          {context.hints.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {context.hints.map((hint, i) => {
                const truncated = hint.length > 40 ? hint.substring(0, 40) + '...' : hint;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] text-[#534AB7] bg-white dark:bg-gray-900 border border-[#AFA9EC] dark:border-indigo-500/50 rounded-full px-2 py-0.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    {truncated}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <button
            onClick={onToggleCollapse}
            className="text-[#534AB7] hover:opacity-70 cursor-pointer"
            title="Collapse"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button
            onClick={onDismiss}
            className="text-[#9CA3AF] hover:text-[#534AB7] cursor-pointer"
            title="Dismiss exercise"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
