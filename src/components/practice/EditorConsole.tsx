interface TerminalLine {
  text: string;
  type: 'stdout' | 'stderr' | 'error' | 'info' | 'output' | 'input';
}

interface Props {
  consoleTab: 'Terminal' | 'Output' | 'Problems';
  termLines: TerminalLine[];
  onTabChange: (tab: 'Terminal' | 'Output' | 'Problems') => void;
  onClear: () => void;
}

export function EditorConsole({ consoleTab, termLines, onTabChange, onClear }: Props) {
  return (
    <div className="h-[150px] bg-[#FAFAFA] border-t border-[#E5E7EB] flex flex-col shrink-0">
      <div className="h-[32px] bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center px-[14px] gap-4 shrink-0">
        <button onClick={() => onTabChange('Terminal')} className={`text-[12px] cursor-pointer ${consoleTab === 'Terminal' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Terminal</button>
        <button onClick={() => onTabChange('Output')} className={`text-[12px] cursor-pointer ${consoleTab === 'Output' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Output</button>
        <button onClick={() => onTabChange('Problems')} className={`text-[12px] cursor-pointer ${consoleTab === 'Problems' ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>Problems</button>
        <span className="text-[11px] text-[#9CA3AF] ml-auto flex items-center gap-1 cursor-pointer hover:text-[#6B7280]" onClick={onClear}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
          Clear
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-[14px] py-[10px] font-mono text-[12px] leading-relaxed">
        {termLines.length === 0 && consoleTab !== 'Problems' && <span className="text-[#9CA3AF]">Run your code to see output here...</span>}
        {consoleTab === 'Problems' && <span className="text-[#9CA3AF]">No problems detected</span>}
        {consoleTab !== 'Problems' && termLines.map((line, i) => (
          <div key={i} className={
            line.type === 'error' ? 'text-[#DC2626]'
            : line.type === 'info' ? 'text-[#534AB7]'
            : line.type === 'stdout' ? 'text-[#059669]'
            : line.type === 'output' ? 'text-[#059669]'
            : 'text-[#9CA3AF]'
          }>{line.type === 'output' || line.type === 'stdout' ? `  ${line.text}` : line.text}</div>
        ))}
      </div>
    </div>
  );
}
