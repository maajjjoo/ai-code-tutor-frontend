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
    <div className="h-14 bg-white border-t border-[#E5E7EB] px-6 flex items-center justify-between shrink-0">
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`px-5 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
          isFirst
            ? 'opacity-40 cursor-not-allowed text-[#9CA3AF]'
            : 'text-[#374151] hover:bg-[#F8F9FA]'
        }`}
      >
        Previous
      </button>

      <span className="text-[13px] text-[#9CA3AF]">Section {currentIndex + 1} of {totalSections}</span>

      {!isLast ? (
        <button
          onClick={onNext}
          className="px-5 py-2 bg-[#534AB7] text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Next
        </button>
      ) : (
        <button
          onClick={onComplete}
          className="px-5 py-2 bg-[#166534] text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Complete lesson
        </button>
      )}
    </div>
  );
}
