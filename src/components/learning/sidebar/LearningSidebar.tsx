import type { Topic } from '../../../types/learning.types';

const LANG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Python:     { bg: '#E6F1FB', color: '#0C447C', label: 'Py' },
  Java:       { bg: '#FAEEDA', color: '#854F0B', label: 'Jv' },
  JavaScript: { bg: '#FEFCE8', color: '#854D0E', label: 'JS' },
  TypeScript: { bg: '#E6F1FB', color: '#1D4ED8', label: 'TS' },
  'C++':      { bg: '#F0FDF4', color: '#166534', label: 'C++' },
  Kotlin:     { bg: '#FDF4FF', color: '#7E22CE', label: 'Kt' },
};

interface Props {
  languages: Topic[];
  selectedTopicId: string | null;
  completedLevels: Record<string, string[]>;
  getCompletedCount: (topicId: string, level: string) => number;
  getTotalCompleted: (topicId: string) => number;
  isLoading: boolean;
  error: boolean;
  onSelect: (topic: Topic) => void;
  onRetry: () => void;
}

export function LearningSidebar({ languages, selectedTopicId, completedLevels, getTotalCompleted, isLoading, error, onSelect, onRetry }: Props) {
  return (
    <div className="w-[260px] h-full flex flex-col bg-[#F9FAFB] border-r border-[#E5E7EB] shrink-0 overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="text-[13px] font-medium text-[#111827]">Courses</h2>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5">Choose a language to learn</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 bg-[#E5E7EB] rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-full py-8 px-3 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mb-3">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[12px] text-[#4B5563] mb-1">Can't load courses</p>
            <button onClick={onRetry} className="px-3 py-1.5 bg-[#534AB7] text-white rounded-lg text-[11px] font-medium hover:opacity-90 cursor-pointer transition-opacity mt-2">Retry</button>
          </div>
        )}

        {!isLoading && !error && languages.map(topic => {
          const isSelected = selectedTopicId === topic.id;
          const levels = completedLevels[topic.id] ?? [];
          const completed = getTotalCompleted(topic.id);
          const style = LANG_STYLES[topic.language] ?? LANG_STYLES.Python;

          const beginnerDone = levels.includes('beginner');
          const intermediateDone = levels.includes('intermediate');
          const advancedDone = levels.includes('advanced');

          return (
            <button
              key={topic.id}
              onClick={() => onSelect(topic)}
              className={`w-full text-left p-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${
                isSelected ? 'bg-[#EEEDFE] border-l-2 border-[#534AB7]' : 'hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {style.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#111827]">{topic.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] text-[#9CA3AF]">{completed} / 30 lessons</span>
                  </div>
                  <div className="flex gap-0.5 mt-1.5 h-[3px]">
                    <div className={`flex-1 rounded-full ${beginnerDone ? 'bg-[#0F6E56]' : 'bg-[#E5E7EB]'}`} />
                    <div className={`flex-1 rounded-full ${intermediateDone ? 'bg-[#D97706]' : 'bg-[#E5E7EB]'}`} />
                    <div className={`flex-1 rounded-full ${advancedDone ? 'bg-[#7E22CE]' : 'bg-[#E5E7EB]'}`} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
