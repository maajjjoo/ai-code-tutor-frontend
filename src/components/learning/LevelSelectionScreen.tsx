import type { Level } from '../../types/learning.types';
import type { Course } from '../../data/courses';
import { LANG_STYLES } from '../../data/courses';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

const LEVEL_META: Record<Level, { icon: string; title: string; subtitle: string; color: string }> = {
  beginner:     { icon: '🌱', title: 'Beginner',     subtitle: 'Start from zero. No experience needed.', color: '#0F6E56' },
  intermediate: { icon: '🔥', title: 'Intermediate', subtitle: 'Take your skills to the next level.',    color: '#D97706' },
  advanced:     { icon: '🚀', title: 'Advanced',     subtitle: 'Master complex concepts and patterns.',  color: '#7E22CE' },
};

interface Props {
  course: Course;
  levelsDone: string[];
  onLevelSelect: (level: Level) => void;
}

export function LevelSelectionScreen({ course, levelsDone, onLevelSelect }: Props) {
  const style = LANG_STYLES[course.language] ?? LANG_STYLES.Python;

  return (
    <div className="flex-1 flex items-start justify-center overflow-y-auto">
      <div className="max-w-[480px] w-full px-10 py-10">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {course.icon}
          </div>
          <div>
            <h1 className="text-[24px] font-medium text-[#111827]">{course.name}</h1>
            <p className="text-[14px] text-[#9CA3AF] mt-0.5">Choose where to start</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {LEVELS.map((level, idx) => {
            const isComplete = levelsDone.includes(level);
            const prevDone = idx === 0 || levelsDone.includes(LEVELS[idx - 1]);
            const isLocked = !prevDone && !isComplete;
            const meta = LEVEL_META[level];

            if (isLocked) {
              return (
                <div
                  key={level}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E7EB] opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-[#9CA3AF]">{meta.title}</div>
                    <div className="text-[12px] text-[#9CA3AF]">Complete {LEVELS[idx - 1]} first</div>
                  </div>
                </div>
              );
            }

            const buttonText = isComplete ? 'Review' : 'Start';
            const cardBorder = isComplete ? 'border-[#9FE1CB] bg-[#E1F5EE]' : 'border-[#E5E7EB]';
            const btnStyle = isComplete
              ? 'border border-[#0F6E56] text-[#0F6E56] hover:bg-[#D1FAE5]'
              : 'bg-[#534AB7] text-white hover:opacity-90';

            return (
              <button
                key={level}
                onClick={() => onLevelSelect(level)}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors text-left ${cardBorder} ${isComplete ? '' : 'hover:bg-[#F8F9FA]'}`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: isComplete ? '#D1FAE5' : '#F3F4F6' }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[#111827]">{meta.title}</div>
                  <div className="text-[12px] text-[#4B5563]">{meta.subtitle}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isComplete && <span className="text-[12px] text-[#0F6E56] font-medium">Completed ✓</span>}
                  <span className={`text-[11px] font-medium px-3 py-1 rounded-lg ${btnStyle}`}>
                    {buttonText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
