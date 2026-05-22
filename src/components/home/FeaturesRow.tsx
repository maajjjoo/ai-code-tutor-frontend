import React from 'react';
import { UI } from '../../constants/ui.strings';

export function FeaturesRow() {
  return (
    <section className='bg-white dark:bg-gray-900 py-12 px-5 sm:px-[80px] transition-colors'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto'>
        <div className='flex flex-col items-center text-center p-4'>
          <div className='w-8 h-8 bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-[10px]'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#534AB7' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-indigo-400'>
              <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
            </svg>
          </div>
          <h4 className='text-[13px] font-medium text-[#111827] dark:text-gray-100 mb-1'>{UI.FEATURE_REALTIME}</h4>
          <p className='text-[12px] text-[#4B5563] dark:text-gray-400 leading-[1.6]'>
            {UI.FEATURE_REALTIME_DESC}
          </p>
        </div>

        <div className='flex flex-col items-center text-center p-4'>
          <div className='w-8 h-8 bg-[#E1F5EE] dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-[10px]'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#0F6E56' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-teal-400'>
              <line x1='5' y1='12' x2='19' y2='12' />
              <polyline points='12 5 19 12 12 19' />
            </svg>
          </div>
          <h4 className='text-[13px] font-medium text-[#111827] dark:text-gray-100 mb-1'>{UI.FEATURE_TUTOR}</h4>
          <p className='text-[12px] text-[#4B5563] dark:text-gray-400 leading-[1.6]'>
            {UI.FEATURE_TUTOR_DESC}
          </p>
        </div>

        <div className='flex flex-col items-center text-center p-4'>
          <div className='w-8 h-8 bg-[#FAEEDA] dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-[10px]'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#854F0B' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-amber-400'>
              <polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />
            </svg>
          </div>
          <h4 className='text-[13px] font-medium text-[#111827] dark:text-gray-100 mb-1'>{UI.FEATURE_SAVED}</h4>
          <p className='text-[12px] text-[#4B5563] dark:text-gray-400 leading-[1.6]'>
            {UI.FEATURE_SAVED_DESC}
          </p>
        </div>
      </div>
    </section>
  );
}

export default React.memo(FeaturesRow);
