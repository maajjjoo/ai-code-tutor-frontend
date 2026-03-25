import { useAppContext } from '../../context/AppContext';
import { Cpu, Clock } from 'lucide-react';

export function ExplanationTab() {
  const { state } = useAppContext();

  if (state.recentAnalysis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-gray-600 gap-2">
        <Cpu className="w-8 h-8 opacity-30" />
        <p className="text-sm">Write some code and click Analyze to see explanations.</p>
      </div>
    );
  }

  const latest = state.recentAnalysis[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Latest explanation */}
      <div className="rounded-md border border-indigo-500/30 bg-indigo-500/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-300">Latest Analysis</span>
          <span className="ml-auto text-[10px] text-gray-600">
            {new Date(latest.analyzedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{latest.explanation}</p>
      </div>

      {/* Suggestions from latest */}
      {latest.suggestions && (
        <div className="rounded-md border border-[#2a2a3e] bg-[#16162a] p-3">
          <p className="text-xs font-medium text-violet-300 mb-2">Suggestions</p>
          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{latest.suggestions}</p>
        </div>
      )}

      {/* History */}
      {state.recentAnalysis.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider">Previous</p>
          {state.recentAnalysis.slice(1).map((a) => (
            <div key={a.id} className="rounded-md border border-[#2a2a3e] bg-[#16162a] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3 h-3 text-gray-600" />
                <span className="text-[10px] text-gray-600">{new Date(a.analyzedAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{a.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
