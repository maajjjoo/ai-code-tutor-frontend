import type { Level } from '../../../types/learning.types';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

interface Props {
  selectedLevel: Level;
  completedLevels: Level[];
  completedLessons: number[];
  currentLessonNumber: number;
  onLevelChange: (level: Level) => void;
}

export function LevelTabs({ selectedLevel, completedLevels, currentLessonNumber, onLevelChange }: Props) {
  const currentIdx = LEVELS.findIndex(l => !completedLevels.includes(l));
  const effectiveCurrent = currentIdx === -1 ? LEVELS.length : currentIdx;

  return (
    <div className="flex items-center border-b border-[#E5E7EB]">
      {LEVELS.map((level, i) => {
        const isDone = completedLevels.includes(level);
        const isLocked = i > effectiveCurrent;
        const isSelected = level === selectedLevel;

        return (
          <button
            key={level}
            onClick={() => !isLocked && onLevelChange(level)}
            disabled={isLocked}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors cursor-pointer capitalize ${
              isLocked
                ? 'text-[#9CA3AF] border-transparent cursor-not-allowed opacity-50'
                : isSelected && isDone
                  ? 'text-[#0F6E56] border-[#0F6E56]'
                  : isSelected
                    ? 'text-[#534AB7] border-[#534AB7]'
                    : isDone
                      ? 'text-[#0F6E56] border-transparent hover:border-[#0F6E56]'
                      : 'text-[#9CA3AF] border-transparent'
            }`}
          >
            {isDone && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {isLocked && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            )}
            {level}
            {isSelected && !isDone && (
              <span className="text-[11px] text-[#9CA3AF] font-normal ml-1">
                Lesson {currentLessonNumber} of 10
              </span>
            )}
            {isDone && (
              <span className="text-[11px] font-normal ml-1">Done</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
