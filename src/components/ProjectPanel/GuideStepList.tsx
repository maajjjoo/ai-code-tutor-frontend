import { useAppContext } from '../../context/AppContext';
import { CheckCircle2, Circle } from 'lucide-react';

export function GuideStepList() {
  const { state, toggleStepComplete } = useAppContext();

  if (state.guideSteps.length === 0) return null;

  const completed = state.guideSteps.filter((s) => s.completed).length;

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Guide</span>
        <span className="text-xs text-gray-500">{completed}/{state.guideSteps.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#2a2a3e] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${(completed / state.guideSteps.length) * 100}%` }}
        />
      </div>

      <ol className="flex flex-col gap-2">
        {state.guideSteps.map((step) => (
          <li
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
              step.completed
                ? 'border-indigo-500/30 bg-indigo-500/5'
                : 'border-[#2a2a3e] bg-[#16162a] hover:border-[#3a3a5c]'
            }`}
            onClick={() => toggleStepComplete(step.id)}
          >
            <span className="mt-0.5 shrink-0">
              {step.completed
                ? <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                : <Circle className="w-4 h-4 text-gray-600" />}
            </span>
            <div>
              <p className={`text-sm font-medium ${step.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                {step.stepNumber}. {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
