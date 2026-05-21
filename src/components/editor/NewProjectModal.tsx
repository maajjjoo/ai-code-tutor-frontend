import { useState, useEffect, useRef } from 'react';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, language: string) => void;
  loading: boolean;
  error: string | null;
}

export function NewProjectModal({ open, onClose, onCreate, loading, error }: Props) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('python');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setLanguage('python');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && name.trim()) onCreate(name.trim(), language);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, name, language, onClose, onCreate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-[360px] bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 id="new-project-title" className="text-[15px] font-medium text-[#111827]">New Project</h2>
        <p className="text-[12px] text-[#4B5563] mt-1 mb-4">Create a new project with a name and programming language.</p>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="project-name" className="block text-[12px] font-medium text-[#111827] mb-1.5">
            Project name
          </label>
          <input
            ref={inputRef}
            id="project-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My Calculator"
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="project-language" className="block text-[12px] font-medium text-[#111827] mb-1.5">
            Language
          </label>
          <select
            id="project-language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-[#534AB7] transition-colors bg-white cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-[#E5E7EB] text-[#4B5563] py-2 rounded-lg text-[13px] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) onCreate(name.trim(), language); }}
            disabled={!name.trim() || loading}
            className="flex-1 bg-[#534AB7] text-white py-2 rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
            )}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
