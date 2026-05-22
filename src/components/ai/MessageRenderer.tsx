import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MessagePart {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

interface MessageRendererProps {
  content: string;
}

function parseParts(raw: string): MessagePart[] {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.parts) return parsed.parts;
    if (parsed.content) {
      return [{ type: 'text', content: parsed.content }];
    }
  } catch {}

  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts: MessagePart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: raw.slice(lastIndex, match.index).trim() });
    }
    parts.push({ type: 'code', language: match[1] || 'plaintext', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push({ type: 'text', content: raw.slice(lastIndex).trim() });
  }

  if (parts.length === 0) parts.push({ type: 'text', content: raw });

  return parts.filter(p => p.type !== 'text' || p.content.length > 0);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-[#EEEDFE] text-[#534AB7] px-1 rounded text-[11px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MessageRenderer({ content }: MessageRendererProps) {
  const parts = parseParts(content);

  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return (
            <div key={i} className="relative rounded-lg overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">{part.language || 'code'}</span>
                <CopyButton text={part.content} />
              </div>
              <pre className="bg-[#1E1E2E] p-3 overflow-x-auto m-0">
                <code className={`text-xs font-mono leading-relaxed text-[#A6E3A1] language-${part.language || 'plaintext'}`}>
                  {part.content}
                </code>
              </pre>
            </div>
          );
        }

        if (part.content) {
          const rendered = renderInlineCode(part.content);
          if (typeof rendered === 'string') {
            return (
              <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {rendered}
              </p>
            );
          }
          return (
            <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {rendered}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
