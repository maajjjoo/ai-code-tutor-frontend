import React from 'react';
import type { LessonSection } from '../../../types/learning.types';
import { ExplanationSection } from './ExplanationSection';
import { ExampleSection } from './ExampleSection';
import { TipSection } from './TipSection';
import { ExerciseSection } from './ExerciseSection';

const TAG: Record<string, { bg: string; text: string; label: string }> = {
  explanation: { bg: 'bg-[#F3F4F6]', text: 'text-[#374151]', label: 'Concept' },
  example:     { bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', label: 'Example' },
  tip:         { bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', label: 'Tip' },
  exercise:    { bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', label: 'Exercise' },
};

interface Props {
  section: LessonSection;
  index: number;
  totalSections: number;
  currentIndex: number;
  revealedHints: Record<number, number>;
  language: string;
  lessonTitle: string;
  level: string;
  onHintReveal: (i: number) => void;
  onOpenInEditor: (prompt: string, hints: string[]) => void;
  onSectionComplete: () => void;
}

export const SectionCard = React.memo(function SectionCard({ section, index, currentIndex, revealedHints, language: _language, lessonTitle, level, onHintReveal, onOpenInEditor, onSectionComplete }: Props) {
  const isCurrent = index === currentIndex;
  const isLocked = index > currentIndex;
  const isDone = index < currentIndex;
  const tag = TAG[section.type] ?? TAG.explanation;

  return (
    <div
      className={`bg-white border rounded-xl p-5 mb-3 transition-all ${
        isCurrent ? 'border-l-4 border-l-[#534AB7] border-[#E5E7EB]' : 'border-[#E5E7EB]'
      } ${isLocked ? 'opacity-45 pointer-events-none' : ''} ${isDone ? 'opacity-100' : ''}`}
    >
      <div className="mb-2">
        <span className={`inline-flex items-center text-[11px] font-medium px-2 py-[3px] rounded-md ${tag.bg} ${tag.text}`}>
          {tag.label}
        </span>
      </div>
      <h3 className="text-[16px] font-semibold text-[#111827] mb-2">{section.title}</h3>

      {section.type === 'explanation' && <ExplanationSection content={section.content} />}
      {section.type === 'example' && <ExampleSection content={section.content} code={section.code} />}
      {section.type === 'tip' && <TipSection content={section.content} />}
      {section.type === 'exercise' && (
        <ExerciseSection
          prompt={section.prompt}
          hints={section.hints}
          hintsRevealed={revealedHints[index] ?? 0}
          onHintReveal={() => onHintReveal(index)}
          selectedLanguage={_language}
          lessonTitle={lessonTitle}
          level={level}
          onSectionComplete={onSectionComplete}
          onOpenInEditor={onOpenInEditor}
        />
      )}
    </div>
  );
});
