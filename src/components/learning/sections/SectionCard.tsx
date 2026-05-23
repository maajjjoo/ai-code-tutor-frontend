import React from 'react';
import type { LessonSection } from '../../../types/learning.types';
import { ExplanationSection } from './ExplanationSection';
import { ExampleSection } from './ExampleSection';
import { TipSection } from './TipSection';
import { ExerciseSection } from './ExerciseSection';

const TAG: Record<string, { bg: string; text: string; label: string; border: string }> = {
  explanation: { bg: 'bg-[#EEEDFE] dark:bg-[#2a2550]', text: 'text-[#3C3489] dark:text-[#a09de8]', label: 'Concepto', border: 'border-l-[#534AB7]' },
  example:     { bg: 'bg-[#E1F5EE] dark:bg-teal-900/30', text: 'text-[#085041] dark:text-teal-300', label: 'Ejemplo', border: 'border-l-[#0F6E56]' },
  tip:         { bg: 'bg-[#FEF3C7] dark:bg-amber-900/30', text: 'text-[#92400E] dark:text-amber-300', label: 'Consejo', border: 'border-l-[#F59E0B]' },
  exercise:    { bg: 'bg-[#EEEDFE] dark:bg-[#2a2550]', text: 'text-[#3C3489] dark:text-[#a09de8]', label: 'Ejercicio', border: 'border-l-[#534AB7]' },
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
  const isLocked = index > currentIndex;
  const tag = TAG[section.type] ?? TAG.explanation;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 transition-all border border-[#E5E7EB] dark:border-gray-700 border-l-[3px] ${tag.border} ${
        isLocked ? 'opacity-45 pointer-events-none' : ''
      }`}
    >
      <div className="mb-2.5">
        <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-colors ${tag.bg} ${tag.text}`}>
          {tag.label}
        </span>
      </div>
      <h3 className="text-base font-medium text-[#111827] dark:text-white mb-2">{section.title}</h3>

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
