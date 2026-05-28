import { UI } from '../../../constants/ui.strings';
import { InlineExerciseEditor } from './InlineExerciseEditor';

interface Props {
  prompt?: string;
  hints?: string[];
  hintsRevealed: number;
  onHintReveal: () => void;
  selectedLanguage: string;
  lessonTitle: string;
  level: string;
  onSectionComplete: () => void;
}

export function ExerciseSection({
  prompt,
  hints = [],
  hintsRevealed,
  onHintReveal,
  selectedLanguage,
  lessonTitle,
  level,
  onSectionComplete,
}: Props) {
  const hintsLeft = hints.length - hintsRevealed;

  return (
    <div>
      <p className="text-[13px] text-[#4B5563] dark:text-gray-400 mb-3">{prompt}</p>

      {hintsRevealed > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-[#9CA3AF] mb-2">{hintsRevealed} / {hints.length} {UI.HINTS_REVEALED}</p>
          <div className="flex flex-col gap-1.5">
            {hints.slice(0, hintsRevealed).map((hint, i) => (
              <div key={i} className="bg-[#F9FAFB] dark:bg-gray-800 rounded-lg px-[10px] py-2 flex items-start gap-2 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span className="text-[12px] text-[#4B5563] dark:text-gray-400">{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onHintReveal}
          disabled={hintsLeft === 0}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] dark:border-gray-700 text-[#374151] dark:text-gray-300 rounded-lg text-[13px] hover:bg-[#F8F9FA] dark:hover:bg-gray-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hintsLeft > 0 ? `${UI.SHOW_HINT} (${hintsLeft} ${UI.HINTS_LEFT})` : UI.ALL_HINTS_SHOWN}
        </button>
      </div>

      <InlineExerciseEditor
        exercisePrompt={prompt ?? ''}
        hints={hints}
        language={selectedLanguage}
        lessonTitle={lessonTitle}
        level={level}
        onSectionComplete={onSectionComplete}
      />
    </div>
  );
}
