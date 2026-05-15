import { COURSES, LANG_STYLES } from '../../../data/courses';

interface Props {
  selectedCourseId: string | null;
  completionCounts: Record<string, Record<string, number>>;
  levelsDone: Record<string, string[]>;
  onSelect: (courseId: string) => void;
}

export function LearningSidebar({ selectedCourseId, completionCounts, levelsDone, onSelect }: Props) {
  return (
    <div className="w-[260px] h-full flex flex-col bg-[#F9FAFB] border-r border-[#E5E7EB] shrink-0 overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="text-[13px] font-medium text-[#111827]">Courses</h2>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5">Choose a language to learn</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {COURSES.map(course => {
          const isSelected = selectedCourseId === course.id;
          const style = LANG_STYLES[course.language] ?? LANG_STYLES.Python;
          const counts = completionCounts[course.id] ?? {};
          const totalDone = Object.values(counts).reduce((a, b) => a + b, 0);
          const doneLevels = levelsDone[course.id] ?? [];

          return (
            <button
              key={course.id}
              onClick={() => onSelect(course.id)}
              className={`w-full text-left p-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${
                isSelected ? 'bg-[#EEEDFE] border-l-2 border-[#534AB7]' : 'hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {course.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#111827]">{course.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] text-[#9CA3AF]">{totalDone} / 30 lessons</span>
                  </div>
                  <div className="flex gap-0.5 mt-1.5 h-[3px]">
                    <div className={`flex-1 rounded-full ${doneLevels.includes('beginner') ? 'bg-[#0F6E56]' : 'bg-[#E5E7EB]'}`} />
                    <div className={`flex-1 rounded-full ${doneLevels.includes('intermediate') ? 'bg-[#D97706]' : 'bg-[#E5E7EB]'}`} />
                    <div className={`flex-1 rounded-full ${doneLevels.includes('advanced') ? 'bg-[#7E22CE]' : 'bg-[#E5E7EB]'}`} />
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
