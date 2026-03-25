import { DescriptionInput } from './DescriptionInput';
import { GuideStepList } from './GuideStepList';

export function ProjectPanel() {
  return (
    <aside className="flex flex-col gap-4 w-[25%] min-w-[220px] h-full overflow-y-auto p-4 bg-[#1a1a2e] border-r border-[#2a2a3e]">
      <DescriptionInput />
      <GuideStepList />
    </aside>
  );
}
