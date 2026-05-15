import { useEffect, useRef } from 'react';
import type { Level } from '../../../types/learning.types';

interface Props {
  courseName: string;
  level: Level;
  isOpen: boolean;
  isLastLevel: boolean;
  onClose: () => void;
  onPractice: () => void;
  onNextLevel: () => void;
}

export function CompletionModal({ courseName, level, isOpen, isLastLevel, onClose, onPractice, onNextLevel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-[360px] bg-white rounded-xl p-7 shadow-xl text-center outline-none"
        role="dialog"
        aria-modal="true"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] cursor-pointer transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="w-12 h-12 bg-[#E1F5EE] rounded-full flex items-center justify-center mx-auto mb-3.5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h2 className="text-[15px] font-medium text-[#111827]">{levelLabel} complete!</h2>
        <p className="text-[13px] text-[#4B5563] mt-1.5">You completed all {levelLabel} lessons for {courseName}</p>

        <div className="mt-3.5 mb-4 inline-block bg-[#EEEDFE] text-[#3C3489] text-[12px] font-medium px-3.5 py-1 rounded-full">
          +100 XP
        </div>

        <div className="w-full h-px bg-[#E5E7EB] my-4" />

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onPractice(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#534AB7] text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Practice what you learned
          </button>
          {isLastLevel ? (
            <p className="text-[13px] text-[#4B5563] font-medium py-2">
              You've mastered {courseName}!
            </p>
          ) : (
            <button
              onClick={() => { onNextLevel(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#E5E7EB] text-[#4B5563] rounded-lg text-[13px] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
            >
              Continue to {level === 'beginner' ? 'Intermediate' : 'Advanced'}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
