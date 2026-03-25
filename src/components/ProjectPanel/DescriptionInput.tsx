import { useAppContext } from '../../context/AppContext';
import { Button } from '../shared/Button';
import { BookOpen } from 'lucide-react';

export function DescriptionInput() {
  const { state, generateGuide } = useAppContext();
  const description = state.currentProject?.description ?? '';

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Project Description</label>
      <p className="text-xs text-gray-400 bg-[#16162a] border border-[#2a2a3e] rounded-md px-3 py-2 leading-relaxed min-h-[60px]">
        {description || <span className="text-gray-600">No description set for this project.</span>}
      </p>
      <Button
        onClick={() => generateGuide()}
        loading={state.isGeneratingGuide}
        disabled={!description.trim()}
        className="w-full justify-center"
      >
        <BookOpen className="w-3.5 h-3.5" /> Generate Guide
      </Button>
    </div>
  );
}
