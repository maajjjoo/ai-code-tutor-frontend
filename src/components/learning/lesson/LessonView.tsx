import type { RefObject } from 'react';
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
  isGeneratingLesson: boolean;
  bookmarked: boolean;
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
  onOpenInEditor: (prompt: string) => void;
  onBookmarkToggle: () => void;
  onPracticeClick: () => void;
}

export function LessonView({
  course, selectedLevel, currentLessonNumber, currentLesson, sections,
  currentSectionIndex, isLoadingLesson, isGeneratingLesson, bookmarked,
  revealedHints, scrollRef, displayTitle, levelsDone,
  onLevelTabClick, onPrevious, onNext, onComplete, onStepClick,
  onHintReveal, onOpenInEditor, onBookmarkToggle, onPracticeClick,
}: Props) {
  const isLoading = isLoadingLesson && !currentLesson;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white flex items-center justify-between px-6 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-[#9CA3AF]">Languages</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#111827] font-medium truncate max-w-[200px]">{course.name} Basics</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBookmarkToggle}
            className="flex items-center gap-1.5 px-[14px] py-[6px] rounded-lg text-[12px] font-medium border border-[#E5E7EB] text-[#374151] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? '#534AB7' : 'none'} stroke={bookmarked ? '#534AB7' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={onPracticeClick}
            className="flex items-center gap-1.5 px-4 py-[6px] bg-[#534AB7] text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Practice in editor
          </button>
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
        <div className="flex items-center gap-2 bg-[#EEEDFE] mx-6 mt-3 rounded-lg px-[14px] py-[10px]">
          <svg className="w-4 h-4 text-[#534AB7] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
          </svg>
          <span className="text-[12px] text-[#3C3489]">
            {isGeneratingLesson ? 'Generating with AI...' : 'Loading lesson content...'}
          </span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <StepProgress currentIndex={currentSectionIndex} onStepClick={onStepClick} />

        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#F9FAFB] rounded-xl animate-pulse mb-3" />
            ))}
          </>
        ) : sections.length > 0 ? (
          sections.map((s, i) => (
            <SectionCard
              key={i}
              section={s}
              index={i}
              totalSections={sections.length}
              currentIndex={currentSectionIndex}
              revealedHints={revealedHints}
              language={course.name}
              onHintReveal={onHintReveal}
              onOpenInEditor={onOpenInEditor}
            />
          ))
        ) : (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#F9FAFB] rounded-xl animate-pulse mb-3" />
            ))}
          </>
        )}
      </div>

      {sections.length > 0 && (
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
