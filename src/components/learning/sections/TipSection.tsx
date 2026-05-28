interface Props { content?: string; wrongCode?: string; rightCode?: string; }

export function TipSection({ content, wrongCode, rightCode }: Props) {
  return (
    <div className="bg-[#FFFBEB] dark:bg-amber-900/20 rounded-lg p-4 transition-colors">
      <div className="flex gap-3 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p className="text-[13px] text-[#92400E] dark:text-amber-300 leading-relaxed">{content}</p>
      </div>
      {wrongCode && (
        <div className="mb-2">
          <p className="text-xs text-red-500 font-medium mb-1">❌ Incorrecto</p>
          <pre className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 font-mono text-xs text-red-700 dark:text-red-300 overflow-x-auto">{wrongCode}</pre>
        </div>
      )}
      {rightCode && (
        <div>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">✅ Correcto</p>
          <pre className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 font-mono text-xs text-green-700 dark:text-green-300 overflow-x-auto">{rightCode}</pre>
        </div>
      )}
    </div>
  );
}
