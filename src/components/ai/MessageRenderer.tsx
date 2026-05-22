import { useState } from 'react';

interface Part {
    type: 'text' | 'code';
    content: string;
    language?: string;
}

function parseMessage(raw: string): Part[] {
    if (!raw || typeof raw !== 'string') {
        return [{ type: 'text', content: '' }];
    }

    const normalized = raw
        .replace(/\\r\\n/g, '\n')
        .replace(/\\r/g, '\n')
        .replace(/\\n/g, '\n');

    const parts: Part[] = [];
    const regex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(normalized)) !== null) {
        const before = normalized.slice(lastIndex, match.index).trim();
        if (before) {
            parts.push({ type: 'text', content: before });
        }
        parts.push({
            type: 'code',
            language: match[1] || 'plaintext',
            content: match[2].trim(),
        });
        lastIndex = match.index + match[0].length;
    }

    const remaining = normalized.slice(lastIndex).trim();
    if (remaining) {
        parts.push({ type: 'text', content: remaining });
    }

    if (parts.length === 0) {
        parts.push({ type: 'text', content: normalized });
    }

    return parts;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const languageLabel: Record<string, string> = {
        python: 'Python',
        java: 'Java',
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        js: 'JavaScript',
        ts: 'TypeScript',
        plaintext: 'Código',
        '': 'Código',
    };

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700 my-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
                <span className="text-xs font-mono text-gray-400">
                    {languageLabel[language.toLowerCase()] ?? language}
                </span>
                <button
                    onClick={handleCopy}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    {copied ? '\u2713 Copiado' : 'Copiar'}
                </button>
            </div>
            <pre className="bg-[#1E1E2E] p-3 overflow-x-auto m-0">
                <code className="text-[13px] font-mono leading-relaxed text-[#A6E3A1] whitespace-pre">
                    {code}
                </code>
            </pre>
        </div>
    );
}

function TextBlock({ content }: { content: string }) {
    const parts = content.split(/`([^`]+)`/);
    return (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2 last:mb-0">
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <code
                        key={i}
                        className="bg-[#EEEDFE] dark:bg-[#2a2550] text-[#3C3489] dark:text-[#a09de8] px-1.5 py-0.5 rounded text-xs font-mono"
                    >
                        {part}
                    </code>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </p>
    );
}

export function MessageRenderer({ content }: { content: string }) {
    const parts = parseMessage(content);

    return (
        <div className="space-y-1">
            {parts.map((part, i) =>
                part.type === 'code' ? (
                    <CodeBlock key={i} code={part.content} language={part.language ?? ''} />
                ) : part.content ? (
                    <TextBlock key={i} content={part.content} />
                ) : null
            )}
        </div>
    );
}
