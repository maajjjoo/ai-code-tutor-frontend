import { useState } from 'react';

interface Props {
  content?: string;
  code?: string;
}

export function ExampleSection({ content, code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {content && <p className="text-[13px] text-[#4B5563] dark:text-gray-400 leading-relaxed mb-3">{content}</p>}
      {code && (
        <div className="bg-[#1E1E2E] rounded-[10px] overflow-hidden mt-3">
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#2A2A3E]">
            <span className="text-[11px] text-gray-500 font-mono">Python</span>
            <button
              onClick={handleCopy}
              className="text-[10px] text-gray-500 cursor-pointer flex items-center gap-1 hover:text-gray-300 transition-colors"
            >
              {copied ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copiar</>
              )}
            </button>
          </div>
          <pre className="p-3.5 font-mono text-xs leading-[1.75] overflow-x-auto text-[#A6E3A1] whitespace-pre">{code}</pre>
        </div>
      )}
    </>
  );
}
