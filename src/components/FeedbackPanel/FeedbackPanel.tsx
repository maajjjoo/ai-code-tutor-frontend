import { useState } from 'react';
import { ExplanationTab } from './ExplanationTab';
import { SuggestionsTab } from './SuggestionsTab';
import { ChatTab } from './ChatTab';
import { useAppContext } from '../../context/AppContext';

type Tab = 'analysis' | 'versions' | 'chat';

export function FeedbackPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const { state } = useAppContext();

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'analysis', label: 'Analysis', badge: state.recentAnalysis.length || undefined },
    { id: 'versions', label: 'Versions', badge: state.snapshots.length || undefined },
    { id: 'chat', label: 'Chat', badge: state.chatMessages.length || undefined },
  ];

  return (
    <aside className="flex flex-col w-[25%] min-w-[220px] h-full bg-[#1a1a2e] border-l border-[#2a2a3e]">
      <div className="flex border-b border-[#2a2a3e] shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${activeTab === 'chat' ? 'flex flex-col' : ''}`}>
        {activeTab === 'analysis' && <ExplanationTab />}
        {activeTab === 'versions' && <SuggestionsTab />}
        {activeTab === 'chat' && <ChatTab />}
      </div>
    </aside>
  );
}
