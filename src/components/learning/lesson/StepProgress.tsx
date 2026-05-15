const STEP_LABELS = ['Concept', 'Example', 'Deep dive', 'Tip', 'Exercise'];

interface Props {
  currentIndex: number;
  onStepClick: (i: number) => void;
}

export function StepProgress({ currentIndex, onStepClick }: Props) {
  return (
    <div className="flex items-start w-full mb-6">
      {STEP_LABELS.map((label, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={i} className="flex items-start flex-1">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => isDone && onStepClick(i)}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium border-2 transition-colors ${
                  isDone
                    ? 'bg-[#166534] border-[#166534] text-white'
                    : isCurrent
                      ? 'bg-[#534AB7] border-[#534AB7] text-white'
                      : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF]'
                }`}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] mt-1.5 text-center leading-tight ${isCurrent ? 'text-[#534AB7] font-medium' : 'text-[#9CA3AF]'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-[2px] mt-[14px] mx-2 ${i < currentIndex ? 'bg-[#166534]' : 'bg-[#E5E7EB]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
