import { useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { DescriptionInput } from './DescriptionInput';
import { GuideStepList } from './GuideStepList';

type Tab = 'explorer' | 'guide';

export function LeftPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('explorer');

  return (
    <aside className="flex flex-col w-[25%] min-w-[220px] h-full bg-[#1a1a2e] border-r border-[#2a2a3e]">
      {/* Tabs */}
      <div className="flex border-b border-[#2a2a3e] shrink-0">
        {(['explorer', 'guide'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'explorer' ? (
          <FileExplorer />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <DescriptionInput />
            <GuideStepList />
          </div>
        )}
      </div>
    </aside>
  );
}
