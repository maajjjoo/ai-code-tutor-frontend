interface Props { content?: string; }

export function TipSection({ content }: Props) {
  return (
    <div className="bg-[#FFFBEB] dark:bg-amber-900/30 border-l-4 border-[#F59E0B] rounded-r-lg p-4 flex gap-3 transition-colors">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p className="text-[13px] text-[#92400E] dark:text-amber-300 leading-relaxed">{content}</p>
    </div>
  );
}
