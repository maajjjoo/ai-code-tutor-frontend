import { useState, useRef, useEffect, type RefObject } from 'react';
import { MoreVertical, RefreshCw } from 'lucide-react';
import { UI } from '../../../constants/ui.strings';
import type { Lesson, LessonSection, Level } from '../../../types/learning.types';
import type { Course } from '../../../data/courses';
import { LessonHero } from './LessonHero';
import { StepProgress } from './StepProgress';
import { SectionCard } from '../sections/SectionCard';
import { BottomNav } from './BottomNav';

interface Props {
  course: Course;
  selectedLevel: Level;
  currentLessonNumber: number;
  currentLesson: Lesson | null;
  sections: LessonSection[];
  currentSectionIndex: number;
  isLoadingLesson: boolean;
  lessonError: string | null;
  revealedHints: Record<number, number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  displayTitle: string;
  doneLessons: number[];
  levelsDone: string[];
  onLevelTabClick: (level: Level) => void;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  onStepClick: (i: number) => void;
  onHintReveal: (i: number) => void;
  onOpenInEditor: (prompt: string, hints: string[]) => void;
  onPracticeClick: () => void;
  onRetry: () => void;
  onSectionComplete: () => void;
  onRestartClick: (courseId: string, level: string) => void;
}

export function LessonView({
  course, selectedLevel, currentLessonNumber, currentLesson, sections,
  currentSectionIndex, isLoadingLesson, lessonError,
  revealedHints, scrollRef, displayTitle, levelsDone,
  onLevelTabClick, onPrevious, onNext, onComplete, onStepClick,
  onHintReveal, onOpenInEditor, onPracticeClick,
  onRetry, onSectionComplete, onRestartClick,
}: Props) {
  const isLoading = isLoadingLesson && !currentLesson;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden transition-colors">
      <div className="h-12 bg-white dark:bg-gray-900 flex items-center justify-between px-6 border-b border-[#E5E7EB] dark:border-gray-700 shrink-0 transition-colors">
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-[#9CA3AF]">{UI.LANGUAGES}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#111827] dark:text-gray-100 font-medium truncate max-w-[200px]">{course.name} Basics</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPracticeClick}
            className="flex items-center gap-1.5 px-4 py-[6px] bg-[#534AB7] text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {UI.PRACTICE_EDITOR}
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-[6px] rounded-lg text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => { setMenuOpen(false); onRestartClick(course.id, selectedLevel); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                 <RefreshCw size={14} />
                   {UI.RESTART_LEVEL}
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LessonHero
        language={course.name}
        level={selectedLevel}
        estimatedMinutes={currentLesson?.estimatedMinutes ?? 10}
        lessonTitle={displayTitle}
        summary={currentLesson?.summary ?? ''}
        summaryLoading={isLoading}
        completedLevels={levelsDone}
        currentLessonNumber={currentLessonNumber}
        onLevelTabClick={onLevelTabClick}
      />

      {isLoading && (
        <div className="flex items-center gap-2 bg-[#EEEDFE] dark:bg-indigo-900/30 mx-6 mt-3 rounded-lg px-[14px] py-[10px] transition-colors">
          <svg className="w-4 h-4 text-[#534AB7] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
          </svg>
           <span className="text-[12px] text-[#3C3489] dark:text-indigo-300">{UI.LOADING_LESSON}</span>
        </div>
      )}

      {lessonError && (
        <div className="mx-6 mt-3 rounded-lg px-[14px] py-[10px] bg-[#FEF2F2] dark:bg-red-900/20 border border-[#FCA5A5] dark:border-red-700 flex items-center justify-between transition-colors">
          <span className="text-[12px] text-[#991B1B] dark:text-red-400">{lessonError}</span>
          <button
            onClick={onRetry}
            className="text-[12px] font-medium text-[#991B1B] underline hover:no-underline cursor-pointer"
           >
             {UI.RETRY}
           </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <StepProgress currentIndex={currentSectionIndex} onStepClick={onStepClick} />

        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[#F9FAFB] dark:bg-gray-800 rounded-xl animate-pulse mb-3" />
            ))}
          </>
        ) : sections.length > 0 ? (
          sections.map((s, i) => (
            <div key={i} id={`section-${i}`}>
              <SectionCard
                section={s} index={i} totalSections={sections.length}
                currentIndex={currentSectionIndex} revealedHints={revealedHints}
                language={course.name} lessonTitle={displayTitle} level={selectedLevel}
                onHintReveal={onHintReveal} onOpenInEditor={onOpenInEditor}
                onSectionComplete={onSectionComplete}
              />
            </div>
          ))
        ) : lessonError ? null : (
          <div className="flex items-center justify-center h-48">
             <p className="text-[#9CA3AF] text-[13px]">{UI.NO_CONTENT}</p>
          </div>
        )}
      </div>

      {sections.length > 0 && !lessonError && (
        <BottomNav
          currentIndex={currentSectionIndex}
          totalSections={sections.length}
          onPrevious={onPrevious}
          onNext={onNext}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
