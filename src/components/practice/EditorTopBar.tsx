import React from 'react';
import type { VFile } from '../../types/vfs';
import { UI } from '../../constants/ui.strings';

const FILE_EXT_COLORS: Record<string, string> = {
  py: '#3B82F6', java: '#F59E0B', js: '#EAB308',
  ts: '#6366F1', tsx: '#6366F1', jsx: '#EAB308',
  cpp: '#9CA3AF', cs: '#9CA3AF',
};

const LANG_DISPLAY: Record<string, { lang: string; ver: string }> = {
  python: { lang: 'Python', ver: '3.11' },
  java: { lang: 'Java', ver: '17' },
  javascript: { lang: 'JavaScript', ver: 'Node 20' },
  typescript: { lang: 'TypeScript', ver: '5.4' },
  cpp: { lang: 'C++', ver: '20' },
};

function getFileExt(filename: string): string {
  return filename.includes('.') ? filename.split('.').pop() ?? '' : '';
}

function getFileDotColor(filename: string): string {
  return FILE_EXT_COLORS[getFileExt(filename)] ?? '#D1D5DB';
}

interface Props {
  filesList: VFile[];
  fsActiveId: string | null;
  language: string;
  hasUnsavedChanges: boolean;
  onSwitchFile: (fileId: string) => void;
  onRunCode: () => void;
  isRunning?: boolean;
}

export const EditorTopBar = React.memo(function EditorTopBar({ filesList, fsActiveId, language, hasUnsavedChanges, onSwitchFile, onRunCode, isRunning }: Props) {
  const disp = LANG_DISPLAY[language] ?? { lang: language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Python', ver: '' };

  return (
    <div className="h-[40px] bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-700 flex items-center shrink-0 px-3 transition-colors">
      <div className="flex items-center h-full flex-1 overflow-x-auto">
        {filesList.map((f) => {
          const isActive = fsActiveId === f.id;
          return (
            <div
              key={f.id}
              onClick={() => { onSwitchFile(f.id); }}
              className={`flex items-center gap-[6px] px-[14px] h-full text-[12px] cursor-pointer transition-colors shrink-0 ${
                isActive ? 'bg-white dark:bg-gray-900 border-b-2 border-[#534AB7] text-[#111827] dark:text-gray-100 font-medium' : 'text-[#9CA3AF] dark:text-gray-500 hover:bg-[#F3F4F6] dark:hover:bg-gray-700'
              }`}
            >
              <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: getFileDotColor(f.name) }} />
              <span className="truncate max-w-[100px]">{f.name}</span>
              {hasUnsavedChanges && isActive && <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B] shrink-0" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-[8px] ml-auto shrink-0">
        <div className="flex items-center gap-[6px] bg-[#EEEDFE] dark:bg-indigo-900/30 text-[#3C3489] dark:text-indigo-300 rounded-[6px] px-[10px] py-[3px]">
          <span className="text-[11px] font-medium">{disp.lang}</span>
          <svg width="1" height="12" viewBox="0 0 1 12" fill="#3C3489" opacity="0.3"><rect width="1" height="12" rx="0.5"/></svg>
          <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">{disp.ver}</span>
        </div>
        <button onClick={onRunCode} disabled={isRunning} className="flex items-center gap-[6px] bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] rounded-[8px] px-[14px] py-[5px] text-[12px] font-medium cursor-pointer hover:bg-[#D1FAE5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {isRunning ? (
            <svg className="animate-spin w-3.5 h-3.5 text-[#0F6E56]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#0F6E56"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
          {isRunning ? UI.RUNNING : UI.RUN}
        </button>
      </div>
    </div>
  );
});
