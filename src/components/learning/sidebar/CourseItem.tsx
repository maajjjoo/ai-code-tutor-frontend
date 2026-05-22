import React from 'react';
import type { Course } from '../../../data/courses';

interface Props {
  course: Course;
  isSelected: boolean;
  totalDone: number;
  levelsDone: string[];
  onSelect: (courseId: string) => void;
}

export const CourseItem = React.memo(function CourseItem({ course, isSelected, totalDone, levelsDone, onSelect }: Props) {
  const pct = Math.round((totalDone / 30) * 100);

  return (
    <button
      onClick={() => onSelect(course.id)}
      className={`w-full text-left p-[10px] rounded-lg cursor-pointer transition-all ${
        isSelected ? 'bg-white dark:bg-gray-800 border-l-[3px] shadow-sm' : 'hover:bg-white dark:hover:bg-gray-800'
      }`}
      style={isSelected ? { borderLeftColor: course.color } : undefined}
    >
      <div className='flex items-center gap-[10px]'>
        <div
          className='w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0'
          style={{ backgroundColor: course.bgColor, color: course.color }}
        >
          {course.letters}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-[13px] font-medium text-[#111827] dark:text-gray-100'>{course.name}</div>
          <div className='flex items-center gap-1 mt-0.5'>
            <span className='text-[11px] text-[#9CA3AF]'>{totalDone} / 30 lessons</span>
          </div>
          <div className='flex gap-[3px] mt-[6px] h-[3px]'>
            <div
              className={`flex-1 rounded-full ${levelsDone.includes('beginner') ? '' : 'bg-[#E5E7EB] dark:bg-gray-700'}`}
              style={{ backgroundColor: levelsDone.includes('beginner') ? course.color : undefined }}
            />
            <div
              className={`flex-1 rounded-full ${levelsDone.includes('intermediate') ? '' : 'bg-[#E5E7EB] dark:bg-gray-700'}`}
              style={{ backgroundColor: levelsDone.includes('intermediate') ? course.color : undefined }}
            />
            <div
              className={`flex-1 rounded-full ${levelsDone.includes('advanced') ? '' : 'bg-[#E5E7EB] dark:bg-gray-700'}`}
              style={{ backgroundColor: levelsDone.includes('advanced') ? course.color : undefined }}
            />
          </div>
        </div>
        {totalDone > 0 && (
          <span className='text-[11px] font-medium shrink-0' style={{ color: course.color }}>
            {pct}%
          </span>
        )}
      </div>
    </button>
  );
});
