import React from 'react';
import type { Course } from '../../../data/courses';
import { UI } from '../../../constants/ui.strings';

const LANG_ICON_STYLES: Record<string, { bg: string; text: string }> = {
  python: { bg: 'bg-[#EEF2FF]', text: 'text-[#3730A3]' },
  java: { bg: 'bg-[#FFF7ED]', text: 'text-[#9A3412]' },
  javascript: { bg: 'bg-[#FEFCE8]', text: 'text-[#854D0E]' },
  typescript: { bg: 'bg-[#EFF6FF]', text: 'text-[#1E40AF]' },
};

interface Props {
  course: Course;
  isSelected: boolean;
  totalDone: number;
  levelsDone: string[];
  onSelect: (courseId: string) => void;
}

export const CourseItem = React.memo(function CourseItem({ course, isSelected, totalDone, levelsDone, onSelect }: Props) {
  const pct = Math.round((totalDone / 30) * 100);
  const iconStyle = LANG_ICON_STYLES[course.id] ?? { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };

  return (
    <button
      onClick={() => onSelect(course.id)}
      className={`w-full text-left rounded-[10px] cursor-pointer transition-all duration-150 mb-1 ${
        isSelected ? 'bg-[#EEEDFE] dark:bg-[#2a2550] border border-[#AFA9EC] dark:border-[#534AB7]' : 'hover:bg-[#F3F4F6] dark:hover:bg-gray-800'
      }`}
    >
      <div className='flex items-center gap-2.5 px-2.5 py-2.5'>
        {isSelected && <div className='w-[3px] h-6 rounded-full bg-[#534AB7] flex-shrink-0' />}
        <div
          className={`w-9 h-9 rounded-[9px] flex items-center justify-center text-[11px] font-bold shrink-0 ${iconStyle.bg} ${iconStyle.text}`}
        >
          {course.letters}
        </div>
        <div className='flex-1 min-w-0'>
          <div className={`text-[13px] font-medium ${isSelected ? 'text-[#3C3489] dark:text-[#a09de8]' : 'text-[#111827] dark:text-gray-100'}`}>{course.name}</div>
          <div className='flex items-center gap-1 mt-0.5'>
            <span className={`text-[11px] ${isSelected ? 'text-[#7C70D4] dark:text-[#a09de8]' : 'text-[#9CA3AF] dark:text-gray-500'}`}>{totalDone} / 30 {UI.LESSONS_COUNT}</span>
          </div>
          <div className='flex gap-[3px] mt-1.5 h-[2.5px]'>
            <div
              className={`flex-1 rounded-full ${levelsDone.includes('beginner') ? '' : 'bg-[#E5E7EB] dark:bg-gray-700'}`}
              style={{ backgroundColor: levelsDone.includes('beginner') ? '#534AB7' : undefined }}
            />
            <div
              className={`flex-1 rounded-full ${levelsDone.includes('intermediate') ? '' : 'bg-[#E5E7EB] dark:bg-gray-700'}`}
              style={{ backgroundColor: levelsDone.includes('intermediate') ? '#534AB7' : undefined }}
            />
            <div
              className={`flex-1 rounded-full ${levelsDone.includes('advanced') ? '' : 'bg-[#E5E7EB] dark:bg-gray-700'}`}
              style={{ backgroundColor: levelsDone.includes('advanced') ? '#534AB7' : undefined }}
            />
          </div>
        </div>
        {totalDone > 0 && (
          <span className='text-[11px] font-medium shrink-0 text-[#534AB7] dark:text-indigo-400'>
            {pct}%
          </span>
        )}
      </div>
    </button>
  );
});
