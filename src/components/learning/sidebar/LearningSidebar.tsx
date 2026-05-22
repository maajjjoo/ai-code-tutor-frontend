import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI } from '../../../constants/ui.strings';
import { COURSES } from '../../../data/courses';
import { CourseItem } from './CourseItem';
import { SidebarFooter } from './SidebarFooter';

interface Props {
  selectedCourseId: string | null;
  completionCounts: Record<string, Record<string, number>>;
  levelsDone: Record<string, string[]>;
  onSelect: (courseId: string) => void;
  onHome: () => void;
}

export function LearningSidebar({ selectedCourseId, completionCounts, levelsDone, onSelect }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = COURSES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className='w-[280px] h-full flex flex-col bg-[#F9FAFB] dark:bg-gray-900 border-r border-[#E5E7EB] dark:border-gray-800 shrink-0 overflow-hidden transition-colors'>
      <div className='h-12 px-3 flex items-center border-b border-[#E5E7EB] dark:border-gray-800 shrink-0'>
        <button
          onClick={() => navigate('/')}
          className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'
        >
          <div className='w-6 h-6 rounded-md bg-[#534AB7] flex items-center justify-center'>
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <polyline points='16 18 22 12 16 6'/><polyline points='8 6 2 12 8 18'/>
            </svg>
          </div>
          <span className='text-[13px] font-medium text-[#111827] dark:text-gray-100'>
            AI<span className='text-[#534AB7] dark:text-indigo-400'>Code</span>Tutor
          </span>
        </button>
      </div>

      <div className='px-3 py-3'>
        <div className='flex items-center gap-2 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-[10px] py-[7px]'>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#9CA3AF' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='shrink-0'>
            <circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/>
          </svg>
          <input
            type='text'
            placeholder={UI.SEARCH_TOPICS}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='flex-1 text-[12px] text-[#111827] dark:text-gray-100 outline-none bg-transparent placeholder:text-[#9CA3AF]'
          />
        </div>
      </div>

      <div className='px-3 pb-1'>
        <span className='text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF] px-[4px]'>{UI.COURSES}</span>
      </div>

      <div className='flex-1 overflow-y-auto px-3 pb-2'>
        {filtered.map(course => {
          const counts = completionCounts[course.id] ?? {};
          const totalDone = Object.values(counts).reduce((a, b) => a + b, 0);
          const done = levelsDone[course.id] ?? [];

          return (
            <CourseItem
              key={course.id}
              course={course}
              isSelected={selectedCourseId === course.id}
              totalDone={totalDone}
              levelsDone={done}
              onSelect={onSelect}
            />
          );
        })}
      </div>

      <SidebarFooter completionCounts={completionCounts} />
    </div>
  );
}
