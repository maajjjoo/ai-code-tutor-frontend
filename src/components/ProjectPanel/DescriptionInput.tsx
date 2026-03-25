import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../shared/Button';

export function DescriptionInput() {
  const { state, generateGuide } = useAppContext();
  const [description, setDescription] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) return;
    await generateGuide(description);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Project Description
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the project you want to build... (e.g., a calculator, a to-do list)"
        rows={5}
        className="w-full bg-[#16162a] border border-[#2a2a3e] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <Button
        onClick={handleGenerate}
        loading={state.isGeneratingGuide}
        disabled={!description.trim()}
        className="w-full justify-center"
      >
        Generate Guide
      </Button>
    </div>
  );
}
