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
      <div className="h-8 bg-[#EEEDFE] border-b border-[#AFA9EC] flex items-center gap-2 px-5 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span className="text-[12px] text-[#3C3489] truncate flex-1">
          Exercise: {context.lessonTitle}
        </span>
        <button
          onClick={onToggleCollapse}
          className="text-[#534AB7] hover:opacity-80 cursor-pointer"
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
    <div className="bg-[#EEEDFE] border-b border-[#AFA9EC] px-5 py-3 shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center text-[10px] font-semibold text-white bg-[#534AB7] rounded-full px-2 py-0.5 uppercase tracking-wide">
              From lesson
            </span>
            <span className="text-[13px] font-medium text-[#3C3489] truncate">
              {context.lessonTitle}
            </span>
          </div>
          <p className="text-[12px] text-[#4B5563] line-clamp-2">
            {context.exercisePrompt}
          </p>
          {context.hints.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {context.hints.map((hint, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] text-[#534AB7] bg-white border border-[#AFA9EC] rounded-full px-2 py-0.5"
                >
                  <span>💡</span>
                  {hint}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          <button
            onClick={onToggleCollapse}
            className="text-[#534AB7] hover:opacity-80 cursor-pointer"
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
