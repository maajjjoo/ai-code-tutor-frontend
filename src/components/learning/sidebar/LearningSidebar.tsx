import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI } from '../../../constants/ui.strings';
import { COURSES } from '../../../data/courses';
import { CourseItem } from './CourseItem';
import type { GeneratedLesson } from '../../../types/generatedLesson.types';

const DOT_COLORS: Record<string, string> = {
  python: 'bg-blue-500',
  java: 'bg-amber-500',
  javascript: 'bg-yellow-500',
  typescript: 'bg-indigo-500',
};

interface Props {
  selectedCourseId: string | null;
  completionCounts: Record<string, Record<string, number>>;
  levelsDone: Record<string, string[]>;
  onSelect: (courseId: string) => void;
  onHome: () => void;
  onGenerateLesson: () => void;
  aiLessons: GeneratedLesson[];
  onOpenAiLesson: (id: number) => void;
  aiGeneratedToday: number;
  aiDailyLimit: number;
}

export function LearningSidebar({
  selectedCourseId, completionCounts, levelsDone, onSelect,
  onGenerateLesson, aiLessons, onOpenAiLesson,
  aiGeneratedToday, aiDailyLimit,
}: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = COURSES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const progressPct = aiDailyLimit > 0 ? (aiGeneratedToday / aiDailyLimit) * 100 : 0;

  return (
    <div className='w-[280px] h-full flex flex-col bg-[#F8F9FA] dark:bg-gray-900 border-r border-[#E5E7EB] dark:border-gray-800 shrink-0 overflow-hidden transition-colors'>
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
        <div className='relative mb-2'>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#9CA3AF' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
            <circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/>
          </svg>
          <input
            type='text'
            placeholder={UI.SEARCH_TOPICS}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full pl-8 pr-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-xs text-[#111827] dark:text-gray-100 bg-white dark:bg-gray-800 outline-none placeholder:text-[#9CA3AF]'
          />
        </div>

        <div
          onClick={onGenerateLesson}
          className='p-3 rounded-xl bg-gradient-to-br from-[#EEEDFE] to-[#E0DEFF] border border-[#AFA9EC] cursor-pointer hover:from-[#E0DEFF] hover:to-[#D4D0FF] transition-all duration-200 dark:from-[#2a2550] dark:to-[#1e1a3d] dark:border-[#534AB7]'
        >
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-lg'>✨</span>
            <span className='text-[13px] font-medium text-[#3C3489] dark:text-[#a09de8]'>
              Generar lección con IA
            </span>
          </div>
          <p className='text-[11px] text-[#7C70D4] dark:text-[#8b83e0] leading-relaxed'>
            Aprende cualquier tema con una lección personalizada
          </p>
          <div className='flex items-center gap-1 mt-2'>
            <div className='flex-1 h-1 bg-[#AFA9EC] dark:bg-[#534AB7] rounded-full overflow-hidden'>
              <div className='h-full bg-[#534AB7] dark:bg-[#8b83e0] rounded-full' style={{ width: `${progressPct}%` }} />
            </div>
            <span className='text-[10px] text-[#7C70D4] dark:text-[#8b83e0] flex-shrink-0'>
              {aiGeneratedToday}/{aiDailyLimit} hoy
            </span>
          </div>
        </div>
      </div>

      <div className='px-3 pb-1'>
        <span className='text-[10px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF] px-1 mb-2 block'>{UI.COURSES}</span>
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

        <div className='h-px bg-[#E5E7EB] mx-1 my-3' />

        <div className='mb-2'>
          <p className='text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400 px-1 mb-2'>
            Mis lecciones IA
          </p>
          {aiLessons.length > 0 ? (
            <div className='space-y-1'>
              {aiLessons.map(lesson => (
                <div
                  key={lesson.id}
                  onClick={() => onOpenAiLesson(lesson.id)}
                  className='flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-gray-700'
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[lesson.language] ?? 'bg-gray-400'}`} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate'>
                      {lesson.title}
                    </p>
                    <p className='text-[10px] text-gray-400'>
                      {lesson.saved ? '⭐ Guardada' : `Expira en ${lesson.daysUntilExpiry} días`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-[11px] text-gray-400 px-2'>
              Aún no has generado lecciones
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
