import type { RefObject } from 'react';
import type { Lesson, LessonSection, Level } from '../../../types/learning.types';
import { LessonHero } from './LessonHero';
import { StepProgress } from './StepProgress';
import { SectionCard } from '../sections/SectionCard';
import { BottomNav } from './BottomNav';

interface Props {
  lesson: Lesson;
  sections: LessonSection[];
  currentSectionIndex: number;
  selectedLanguage: string;
  selectedLevel: Level;
  isBookmarked: boolean;
  isGeneratingLesson: boolean;
  revealedHints: Record<number, number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  courseId: string;
  onBack: () => void;
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
  lesson, sections, currentSectionIndex, selectedLanguage, selectedLevel,
  isBookmarked, isGeneratingLesson, revealedHints, scrollRef, courseId,
  onBack, onPrevious, onNext, onComplete, onStepClick, onHintReveal,
  onOpenInEditor, onBookmarkToggle, onPracticeClick,
}: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <LessonHero
        lesson={lesson}
        courseId={courseId}
        isGeneratingLesson={isGeneratingLesson}
        onBack={onBack}
        onBookmarkToggle={onBookmarkToggle}
        onPracticeClick={onPracticeClick}
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="px-5 py-5">
          {sections.length > 0 && (
            <StepProgress sections={sections} currentIndex={currentSectionIndex} onStepClick={onStepClick} />
          )}
          {sections.map((s, i) => (
            <SectionCard
              key={i}
              section={s}
              index={i}
              currentIndex={currentSectionIndex}
              revealedHints={revealedHints}
              language={selectedLanguage}
              onHintReveal={onHintReveal}
              onOpenInEditor={onOpenInEditor}
            />
          ))}
        </div>
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
