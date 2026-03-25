import { useAppContext } from '../../context/AppContext';
import { Archive, Clock } from 'lucide-react';

export function SuggestionsTab() {
  const { state } = useAppContext();

  if (state.snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-gray-600 gap-2">
        <Archive className="w-8 h-8 opacity-30" />
        <p className="text-sm">No saved versions yet. Click "Save Version" to create one.</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {state.snapshots.map((snap) => (
        <li key={snap.id} className="flex flex-col gap-1 p-3 rounded-md border border-[#2a2a3e] bg-[#16162a]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-300 truncate">
              {snap.versionLabel || `v${snap.versionNumber}`}
            </span>
            <span className="text-[10px] text-gray-600 shrink-0">#{snap.versionNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <Clock className="w-3 h-3" />
            {new Date(snap.createdAt).toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-600 font-mono truncate mt-1">{snap.content.slice(0, 60)}…</p>
        </li>
      ))}
    </ol>
  );
}
