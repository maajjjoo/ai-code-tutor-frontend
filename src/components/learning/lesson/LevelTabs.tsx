import React from 'react';
import type { Level } from '../../../types/learning.types';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

interface Props {
  selectedLevel: Level;
  completedLevels: string[];
  currentLessonNumber: number;
  onLevelChange: (level: Level) => void;
}

export const LevelTabs = React.memo(function LevelTabs({ selectedLevel, completedLevels, currentLessonNumber, onLevelChange }: Props) {
  const firstIncompleteIdx = LEVELS.findIndex(l => !completedLevels.includes(l));

  return (
    <div className="flex items-center border-b border-[#E5E7EB] mt-[14px]">
      {LEVELS.map((level, i) => {
        const isDone = completedLevels.includes(level);
        const isLocked = i > firstIncompleteIdx && !isDone;
        const isSelected = level === selectedLevel;

        return (
          <button
            key={level}
            onClick={() => !isLocked && onLevelChange(level)}
            disabled={isLocked}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer capitalize ${
              isLocked
                ? 'text-[#9CA3AF] border-transparent cursor-not-allowed'
                : isSelected
                  ? 'text-[#534AB7] border-[#534AB7]'
                  : isDone
                    ? 'text-[#166534] border-transparent hover:border-[#166534]'
                    : 'text-[#9CA3AF] border-transparent hover:border-[#9CA3AF]'
            }`}
          >
            {level}
            {isDone && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {isLocked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            )}
            {isSelected && !isDone && (
              <span className="text-[11px] text-[#9CA3AF] font-normal ml-1">
                Lesson {currentLessonNumber} of 10
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
