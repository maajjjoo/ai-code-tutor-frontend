import { useNavigate } from 'react-router-dom';
import { UI } from '../../constants/ui.strings';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className='bg-white dark:bg-gray-900 pt-[72px] pb-[64px] px-5 sm:px-[80px] flex flex-col items-center text-center transition-colors'>
      <div className='inline-flex items-center gap-2 bg-[#EEEDFE] dark:bg-indigo-900/30 text-[#3C3489] dark:text-indigo-300 rounded-full px-[14px] py-1 text-[12px] font-medium mb-6'>
        <div className='w-[6px] h-[6px] bg-[#534AB7] dark:bg-indigo-400 rounded-full' />
        {UI.AI_POWERED_TUTOR}
      </div>

      <h1 className='text-[26px] sm:text-[32px] font-medium text-[#111827] dark:text-gray-100 leading-[130%] max-w-[560px] mb-4'>
        Aprende a programar con un{' '}
        <span className='text-[#534AB7] dark:text-indigo-400'>tutor inteligente</span>{' '}
        a tu lado
      </h1>

      <p className='text-[15px] text-[#4B5563] dark:text-gray-400 max-w-[460px] leading-[170%] mb-8'>
        {UI.DESCRIPTION}
      </p>

      <div className='flex items-center gap-[10px]'>
        <button
          onClick={() => navigate('/practice')}
          className='bg-[#534AB7] dark:bg-indigo-600 text-white px-[22px] py-[10px] rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer'
        >
          {UI.START_PRACTICING}
        </button>
        <button
          onClick={() => navigate('/learning')}
          className='border border-[#E5E7EB] dark:border-gray-700 bg-transparent text-[#111827] dark:text-gray-200 px-[22px] py-[10px] rounded-lg text-[14px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer'
        >
          {UI.EXPLORE_COURSES}
        </button>
      </div>
    </section>
  );
}
