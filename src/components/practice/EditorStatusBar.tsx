import React from 'react';
import { UI } from '../../constants/ui.strings';

interface Props {
  hasUnsavedChanges: boolean;
  language: string;
  onSave: () => void;
  saving: boolean;
}

export const EditorStatusBar = React.memo(function EditorStatusBar({ hasUnsavedChanges, language, onSave, saving }: Props) {
  return (
    <div className="h-[22px] bg-[#F9FAFB] dark:bg-gray-800 border-t border-[#E5E7EB] dark:border-gray-700 flex items-center px-3 text-[11px] text-[#9CA3AF] dark:text-gray-500 gap-4 shrink-0 transition-colors">
      <span className="flex items-center gap-[4px] text-[#0F6E56]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#5DCAA5]" />
        {UI.CONNECTED}
      </span>
      {hasUnsavedChanges ? (
        <span className="text-[#F59E0B] font-medium">{UI.UNSAVED}</span>
      ) : (
        <span className="text-[#0F6E56] font-medium">{UI.SAVED}</span>
      )}
      <span className="capitalize">{language}</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[10px] text-[#D1D5DB] dark:text-gray-600 hidden md:inline">{UI.KB_SAVE} · {UI.KB_RUN} · {UI.KB_ANALYZE}</span>
        <span>UTF-8</span>
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || saving}
          className="flex items-center gap-1 bg-[#534AB7] text-white rounded-[6px] px-[10px] py-[2px] text-[10px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed border-none"
        >
          {saving ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          )}
          {saving ? UI.SAVING : 'Guardar'}
        </button>
      </div>
    </div>
  );
});
