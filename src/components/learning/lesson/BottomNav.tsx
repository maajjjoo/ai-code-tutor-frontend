import { UI } from '../../../constants/ui.strings';

interface Props {
  currentIndex: number;
  totalSections: number;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function BottomNav({ currentIndex, totalSections, onPrevious, onNext, onComplete }: Props) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSections - 1;

  return (
    <div className="h-14 bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-700 px-6 flex items-center justify-between shrink-0 transition-colors">
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`px-5 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
          isFirst
            ? 'opacity-40 cursor-not-allowed text-[#9CA3AF]'
            : 'text-[#374151] dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-gray-700'
         }`}
       >
         {UI.PREVIOUS}
       </button>

       <span className="text-[13px] text-[#9CA3AF]">{UI.SECTION_OF} {currentIndex + 1} {UI.OF} {totalSections}</span>

       {!isLast ? (
         <button
           onClick={onNext}
           className="px-5 py-2 bg-[#534AB7] text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
         >
           {UI.NEXT}
         </button>
       ) : (
         <button
           onClick={onComplete}
           className="px-5 py-2 bg-[#166534] text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
         >
           {UI.COMPLETE_LESSON}
         </button>
       )}
    </div>
  );
}
