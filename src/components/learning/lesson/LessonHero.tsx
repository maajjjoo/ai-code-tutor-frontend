import type { Lesson } from '../../../types/learning.types';
import { LESSON_TITLES } from '../../../data/lessonTitles';

const LEVEL_PILL: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: 'bg-[#E1F5EE]', text: 'text-[#085041]' },
  intermediate: { bg: 'bg-[#FAEEDA]', text: 'text-[#633806]' },
  advanced:     { bg: 'bg-[#FEE2E2]', text: 'text-[#9B1C1C]' },
};

interface Props {
  lesson: Lesson;
  courseId: string;
  isGeneratingLesson?: boolean;
  onBack: () => void;
  onBookmarkToggle: () => void;
  onPracticeClick: () => void;
}

export function LessonHero({ lesson, courseId, isGeneratingLesson, onBack, onBookmarkToggle, onPracticeClick }: Props) {
  const levelPill = LEVEL_PILL[lesson.level] ?? LEVEL_PILL.beginner;
  const titles = LESSON_TITLES[courseId]?.[lesson.level] ?? [];
  const displayTitle = titles[lesson.lessonNumber - 1] ?? lesson.title;

  return (
    <div className="border-b border-[#E5E7EB]">
      <div className="h-12 bg-white flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-1.5 text-[12px]">
          <button onClick={onBack} className="p-1 mr-0.5 hover:bg-[#F3F4F6] rounded-lg cursor-pointer transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span className="text-[#9CA3AF]">Lessons</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#111827] font-medium truncate max-w-[200px]">Lesson {lesson.lessonNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBookmarkToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-colors cursor-pointer`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Save
          </button>
          <button
            onClick={onPracticeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#534AB7] text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Practice
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] bg-[#EEEDFE] text-[#3C3489] px-2.5 py-1 rounded-full font-medium">
            {lesson.language}
          </span>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${levelPill.bg} ${levelPill.text}`}>
            {lesson.level}
          </span>
          <span className="text-[11px] text-[#9CA3AF] bg-[#F9FAFB] px-2 py-1 rounded-full flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {lesson.estimatedMinutes} min
          </span>
          <span className="text-[11px] text-[#9CA3AF] bg-[#F9FAFB] px-2 py-1 rounded-full">
            Lesson {lesson.lessonNumber} of 10
          </span>
        </div>

        <h1 className="text-[17px] font-medium text-[#111827]">{displayTitle}</h1>
        <p className="text-[13px] text-[#4B5563] leading-[1.6] mt-1">{lesson.summary}</p>

        {isGeneratingLesson && (
          <div className="flex items-center gap-2 bg-[#EEEDFE] rounded-lg px-[14px] py-[10px] mt-3">
            <svg className="w-4 h-4 text-[#534AB7] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
            </svg>
            <span className="text-[12px] text-[#3C3489]">Generating with AI...</span>
          </div>
        )}
      </div>
    </div>
  );
}
