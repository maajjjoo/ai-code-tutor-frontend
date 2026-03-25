import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Save, Cpu, BookOpen } from 'lucide-react';

export function EditorControls() {
  const { state, triggerAnalysis, saveVersion, generateGuide } = useAppContext();
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  const handleSave = async () => {
    if (showLabelInput) {
      await saveVersion(labelInput.trim() || undefined);
      setLabelInput('');
      setShowLabelInput(false);
    } else {
      setShowLabelInput(true);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#16162a] border-t border-[#2a2a3e] shrink-0 gap-3">
      <div className="flex items-center gap-2">
        {state.isAnalyzing && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <LoadingSpinner size="sm" />
            <span>Analyzing...</span>
          </div>
        )}
        {state.isSaving && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <LoadingSpinner size="sm" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showLabelInput && (
          <input
            autoFocus
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowLabelInput(false); }}
            placeholder="Version label (optional)"
            className="bg-[#16162a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
          />
        )}
        <Button variant="ghost" size="sm" onClick={() => generateGuide()} loading={state.isGeneratingGuide}>
          <BookOpen className="w-3.5 h-3.5" /> Guide
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSave} loading={state.isSaving}>
          <Save className="w-3.5 h-3.5" /> Save Version
        </Button>
        <Button size="sm" onClick={() => triggerAnalysis()} loading={state.isAnalyzing}>
          <Cpu className="w-3.5 h-3.5" /> Analyze
        </Button>
      </div>
    </div>
  );
}
