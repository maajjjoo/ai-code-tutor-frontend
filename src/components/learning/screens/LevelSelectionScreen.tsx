import { RefreshCw } from 'lucide-react';
import type { Level } from '../../../types/learning.types';
import type { Course } from '../../../data/courses';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

const LEVEL_META: Record<Level, { icon: string; label: string; desc: string }> = {
  beginner:     { icon: '🌱', label: 'Beginner',     desc: 'Start from zero. No experience needed.' },
  intermediate: { icon: '🔥', label: 'Intermediate', desc: 'Take your skills to the next level.' },
  advanced:     { icon: '🚀', label: 'Advanced',     desc: 'Master complex concepts and patterns.' },
};

interface Props {
  course: Course;
  levelsDone: string[];
  doneLessons: number[];
  onLevelSelect: (level: Level) => void;
  onRestartClick: (courseId: string, level: string) => void;
}

export function LevelSelectionScreen({ course, levelsDone, onLevelSelect, onRestartClick }: Props) {
  return (
    <div className="flex-1 flex items-start justify-center overflow-y-auto">
      <div className="max-w-[480px] w-full px-10 py-10">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{ backgroundColor: course.bgColor, color: course.color }}
          >
            {course.letters}
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#111827]">{course.name}</h1>
            <p className="text-[13px] text-[#9CA3AF] mt-1">Choose your level</p>
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
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
                    <div className="text-[14px] font-medium text-[#9CA3AF]">{meta.label}</div>
                    <div className="text-[12px] text-[#9CA3AF]">Complete {LEVELS[idx - 1]} first</div>
                  </div>
                </div>
              );
            }

            const cardBorder = isComplete ? 'border-[#9FE1CB] bg-[#E1F5EE]' : 'border-[#E5E7EB]';

            return (
              <div
                key={level}
                className={`p-4 rounded-xl border ${cardBorder}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: isComplete ? '#D1FAE5' : '#F3F4F6' }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#111827]">{meta.label}</div>
                    <div className="text-[12px] text-[#4B5563]">{meta.desc}</div>
                    <div className="text-[11px] text-[#9CA3AF] mt-0.5">10 lessons</div>
                  </div>
                  {isComplete && <span className="text-[12px] text-[#0F6E56] font-medium shrink-0">Completed ✓</span>}
                </div>
                <div className={`flex gap-2 ${isComplete ? 'mt-3' : 'mt-0'}`}>
                  {isComplete ? (
                    <>
                      <button
                        onClick={() => onLevelSelect(level)}
                        className="flex-1 py-2 text-sm font-medium rounded-lg border border-[#0F6E56] text-[#0F6E56] hover:bg-[#D1FAE5] cursor-pointer"
                      >
                        Continue reviewing
                      </button>
                      <button
                        onClick={() => onRestartClick(course.id, level)}
                        className="flex-1 py-2 text-sm font-medium rounded-lg border border-[#534AB7] text-[#534AB7] hover:bg-[#EEEDFE] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={14} />
                        Restart from beginning
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onLevelSelect(level)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg bg-[#534AB7] text-white hover:opacity-90 cursor-pointer text-center"
                    >
                      Start <span className="ml-1">→</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
