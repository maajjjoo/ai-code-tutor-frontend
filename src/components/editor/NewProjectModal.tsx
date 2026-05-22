import { useState, useEffect, useRef } from 'react';
import { CharCounter } from '../ui/CharCounter';
import { validateProjectName } from '../../utils/validation';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  loading: boolean;
  error: string | null;
}

export function NewProjectModal({ open, onClose, onCreate, loading, error }: Props) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const validationError = name ? validateProjectName(name.trim()) : null;
  const canSubmit = name.trim().length > 0 && !validationError;

  useEffect(() => {
    if (open) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && canSubmit) onCreate(name.trim());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, name, canSubmit, onClose, onCreate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-[360px] bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] dark:text-gray-500 hover:text-[#111827] dark:hover:text-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 id="new-project-title" className="text-[15px] font-medium text-[#111827] dark:text-gray-100">New Project</h2>
        <p className="text-[12px] text-[#4B5563] dark:text-gray-400 mt-1 mb-4">Create a new project.</p>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label htmlFor="project-name" className="block text-[12px] font-medium text-[#111827] dark:text-gray-100 mb-1.5">
            Project name
          </label>
          <input
            ref={inputRef}
            id="project-name"
            type="text"
            value={name}
            onChange={e => {
              if (e.target.value.length <= 30) setName(e.target.value);
            }}
            placeholder="e.g. my-calculator"
            className="w-full border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] text-[#111827] dark:text-gray-100 placeholder-[#9CA3AF] outline-none focus:border-[#534AB7] transition-colors"
          />
          <CharCounter current={name.length} max={30} />
          {validationError && (
            <p className="text-[11px] text-[#DC2626] mt-[2px]">{validationError}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-[#E5E7EB] dark:border-gray-700 text-[#4B5563] dark:text-gray-400 py-2 rounded-lg text-[13px] hover:bg-[#F8F9FA] dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (canSubmit) onCreate(name.trim()); }}
            disabled={!canSubmit || loading}
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
