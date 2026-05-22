import { useState, useEffect } from 'react';
import { UI } from '../../constants/ui.strings';

interface Props {
  open: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteProjectModal({ open, projectName, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setLoading(false); setError(null); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleDelete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading]);

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError(UI.COULD_NOT_DELETE);
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[360px] bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 shadow-xl" role="dialog" aria-modal="true">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9CA3AF] dark:text-gray-500 hover:text-[#111827] dark:hover:text-gray-100 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Warning icon */}
        <div className="w-10 h-10 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </div>

        <h2 className="text-[14px] font-medium text-[#111827] dark:text-gray-100 text-center">¿Eliminar proyecto?</h2>
        <p className="text-[12px] text-[#4B5563] dark:text-gray-400 text-center mt-1.5">
          Esto eliminará permanentemente <span className="font-medium text-[#111827] dark:text-gray-100">{projectName}</span> y todos sus archivos. {UI.DELETE_WARNING}
        </p>

        {error && (
          <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-[12px] text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#E5E7EB] dark:border-gray-700 text-[#4B5563] dark:text-gray-400 py-2 rounded-lg text-[13px] hover:bg-[#F8F9FA] dark:hover:bg-gray-700 transition-colors cursor-pointer">
            {UI.CANCEL}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-[#EF4444] text-white py-2 rounded-lg text-[13px] font-medium hover:bg-[#DC2626] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
              </svg>
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
