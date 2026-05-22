import React from 'react';

interface Props {
  hasUnsavedChanges: boolean;
  language: string;
  onSave: () => void;
  saving: boolean;
}

export const EditorStatusBar = React.memo(function EditorStatusBar({ hasUnsavedChanges, language, onSave, saving }: Props) {
  return (
    <div className="h-[22px] bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center px-3 text-[11px] text-[#9CA3AF] gap-4 shrink-0">
      <span className="flex items-center gap-[4px] text-[#0F6E56]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#5DCAA5]" />
        Connected
      </span>
      {hasUnsavedChanges ? (
        <span className="text-[#F59E0B] font-medium">● Unsaved</span>
      ) : (
        <span className="text-[#0F6E56] font-medium">✓ Saved</span>
      )}
      <span className="capitalize">{language}</span>
      <div className="ml-auto flex items-center gap-3">
        <span>UTF-8</span>
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || saving}
          className="flex items-center gap-1 bg-[#534AB7] text-white rounded-[6px] px-[10px] py-[2px] text-[10px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed border-none"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save
        </button>
      </div>
    </div>
  );
});
