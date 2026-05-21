import { useEffect, useRef } from 'react';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';

interface RestartModalProps {
  isOpen: boolean;
  courseName: string;
  level: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestartModal({ isOpen, courseName, level, onConfirm, onCancel }: RestartModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-[340px] bg-white rounded-xl p-6 text-center"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#9CA3AF] cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 bg-[#EEEDFE] rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw size={24} className="text-[#534AB7]" />
        </div>

        <h2 className="text-[15px] font-medium text-[#111827]">
          Restart {level} level?
        </h2>

        <p className="text-[13px] text-[#4B5563] mt-2 leading-relaxed">
          This will reset your progress for the {level} level of {courseName}. You will start from lesson 1 again. This cannot be undone.
        </p>

        <div className="mt-3 inline-flex items-center gap-1 bg-[#FAEEDA] text-[#633806] rounded-full px-3 py-1 text-xs">
          <AlertTriangle size={12} />
          Your lesson content stays saved
        </div>

        <div className="flex flex-col gap-2 mt-5 w-full">
          <button
            onClick={onConfirm}
            className="bg-[#534AB7] text-white rounded-lg py-2.5 text-sm font-medium w-full cursor-pointer hover:opacity-90"
          >
            Yes, restart from lesson 1
          </button>
          <button
            onClick={onCancel}
            className="border border-[#E5E7EB] text-[#4B5563] rounded-lg py-2.5 text-sm w-full cursor-pointer hover:bg-[#F9FAFB]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
