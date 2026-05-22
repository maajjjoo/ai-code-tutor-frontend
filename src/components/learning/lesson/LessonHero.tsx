import type { Level } from '../../../types/learning.types';
import { UI } from '../../../constants/ui.strings';

const LEVEL_PILL: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
  intermediate: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  advanced:     { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]' },
};

interface Props {
  language: string;
  level: Level;
  estimatedMinutes: number;
  lessonTitle: string;
  summary: string;
  summaryLoading: boolean;
  completedLevels: string[];
  currentLessonNumber: number;
  onLevelTabClick: (level: Level) => void;
}

export function LessonHero({
  language, level, estimatedMinutes, lessonTitle, summary, summaryLoading,
  completedLevels, currentLessonNumber, onLevelTabClick,
}: Props) {
  const levelPill = LEVEL_PILL[level] ?? LEVEL_PILL.beginner;

  return (
    <div className="px-6 pt-6 pb-0 border-b border-[#E5E7EB] dark:border-gray-700 transition-colors">
      <div className="flex items-center gap-2">
        <span className="bg-[#EEEDFE] dark:bg-indigo-900/30 text-[#3C3489] dark:text-indigo-300 text-[12px] font-medium px-3 py-[3px] rounded-full transition-colors">
          {language}
        </span>
        <span className={`text-[12px] font-medium px-3 py-[3px] rounded-full capitalize ${levelPill.bg} ${levelPill.text}`}>
          {UI[level.toUpperCase() as keyof typeof UI] || level}
        </span>
        <span className="bg-[#F3F4F6] dark:bg-gray-700 text-[#6B7280] dark:text-gray-400 text-[12px] px-3 py-[3px] rounded-full flex items-center gap-1 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {estimatedMinutes} min
        </span>
      </div>

      <div className="flex items-center border-b border-[#E5E7EB] dark:border-gray-700 mt-[14px] transition-colors">
        {(['beginner', 'intermediate', 'advanced'] as Level[]).map((lvl, i) => {
          const levelsArr = ['beginner', 'intermediate', 'advanced'] as Level[];
          const firstIncompleteIdx = levelsArr.findIndex(l => !completedLevels.includes(l));
          const isDone = completedLevels.includes(lvl);
          const isLocked = i > firstIncompleteIdx && !isDone;
          const isSelected = lvl === level;

          return (
            <button
              key={lvl}
              onClick={() => !isLocked && onLevelTabClick(lvl)}
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
              {UI[lvl.toUpperCase() as keyof typeof UI] || lvl}
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
                  Lección {currentLessonNumber} de 10
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h1 className="text-[22px] font-semibold text-[#111827] dark:text-gray-100 mt-4">{lessonTitle}</h1>
      {summaryLoading ? (
        <div className="h-4 w-3/4 bg-[#F3F4F6] dark:bg-gray-700 rounded animate-pulse mt-2 mb-4" />
      ) : (
        <p className="text-[14px] text-[#4B5563] dark:text-gray-400 leading-relaxed mt-2 mb-4">{summary}</p>
      )}
    </div>
  );
}
