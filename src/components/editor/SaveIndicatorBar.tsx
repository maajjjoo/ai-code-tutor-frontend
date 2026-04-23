import type { SaveIndicatorState } from '../../hooks/useEditorPersistence';

interface Props {
  state: SaveIndicatorState;
}

export function SaveIndicatorBar({ state }: Props) {
  if (state === 'idle') return <div className="h-0.5 w-full" />;

  const barStyles: Record<SaveIndicatorState, string> = {
    idle:    'bg-transparent',
    unsaved: 'bg-[#f9e2af]',
    saving:  'bg-[#89b4fa] animate-pulse',
    saved:   'bg-[#a6e3a1] transition-opacity duration-1000',
  };

  return (
    <div className="h-0.5 w-full shrink-0">
      <div className={`h-full w-full ${barStyles[state]}`} />
    </div>
  );
}
