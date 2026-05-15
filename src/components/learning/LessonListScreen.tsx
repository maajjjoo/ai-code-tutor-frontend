import type { Level } from '../../types/learning.types';
import type { Course } from '../../data/courses';
import { LANG_STYLES } from '../../data/courses';
import { LESSON_TITLES } from '../../data/lessonTitles';

const LEVEL_ICONS: Record<Level, string> = {
  beginner: '🌱',
  intermediate: '🔥',
  advanced: '🚀',
};

interface Props {
  course: Course;
  level: Level;
  doneLessons: number[];
  onBack: () => void;
  onLessonClick: (lessonNumber: number) => void;
}

export function LessonListScreen({ course, level, doneLessons, onBack, onLessonClick }: Props) {
  const titles = LESSON_TITLES[course.id]?.[level] ?? [];
  const style = LANG_STYLES[course.language] ?? LANG_STYLES.Python;
  const allDone = doneLessons.length >= 10;

  const isUnlocked = (n: number) => n === 1 || doneLessons.includes(n - 1) || allDone;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-[#E5E7EB] px-5 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1 hover:bg-[#F3F4F6] rounded-lg cursor-pointer transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: style.bg, color: style.color }}
        >
          {course.icon}
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-[#9CA3AF]">{course.name}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#111827] font-medium capitalize">{level}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[520px] mx-auto px-5 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{LEVEL_ICONS[level]}</span>
            <div>
              <h2 className="text-[17px] font-medium text-[#111827] capitalize">{level}</h2>
              <p className="text-[13px] text-[#4B5563]">{doneLessons.length} / 10 lessons completed</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {titles.map((title, idx) => {
              const n = idx + 1;
              const done = doneLessons.includes(n);
              const unlocked = isUnlocked(n);
              const isNext = !done && unlocked && (n === 1 || doneLessons.includes(n - 1));

              return (
                <button
                  key={n}
                  onClick={() => unlocked && onLessonClick(n)}
                  disabled={!unlocked}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    done
                      ? 'border-[#9FE1CB] bg-[#E1F5EE]'
                      : unlocked
                        ? isNext
                          ? 'border-l-2 border-l-[#534AB7] border-[#E5E7EB] hover:bg-[#F8F9FA]'
                          : 'border-[#E5E7EB] hover:bg-[#F8F9FA]'
                        : 'border-[#E5E7EB] opacity-50'
                  } ${unlocked ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${
                    done ? 'bg-white text-[#0F6E56]' : unlocked ? 'bg-[#F3F4F6] text-[#4B5563]' : 'bg-[#F9FAFB] text-[#9CA3AF]'
                  }`}>
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] ${done ? 'text-[#0F6E56]' : unlocked ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                      {title}
                    </div>
                  </div>
                  {!unlocked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  )}
                  {done && (
                    <span className="text-[11px] text-[#0F6E56] font-medium">Done</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
