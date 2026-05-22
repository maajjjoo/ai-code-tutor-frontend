interface Props {
  completionCounts: Record<string, Record<string, number>>;
}

export function SidebarFooter({ completionCounts }: Props) {
  const totalDone = Object.values(completionCounts).reduce(
    (sum, levels) => sum + Object.values(levels).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div className="border-t border-[#E5E7EB] dark:border-gray-700 px-3 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-[#9CA3AF]">Overall progress</span>
        <span className="text-[11px] font-medium text-[#534AB7]">{totalDone} / 40 lessons</span>
      </div>
      <div className="h-1 bg-[#E5E7EB] dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#534AB7] rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, (totalDone / 40) * 100)}%` }}
        />
      </div>
    </div>
  );
}
