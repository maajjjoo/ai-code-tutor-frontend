import { useEffect, useState } from 'react';

interface Props {
  autosaveTimestamp: string;
  onKeep: () => void;
  onDiscard: () => void;
}

export function AutosaveRecoveryBanner({ autosaveTimestamp, onKeep, onDiscard }: Props) {
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(previous => {
        if (previous <= 1) {
          clearInterval(interval);
          onKeep(); // Auto-keep after 10 seconds
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onKeep]);

  const formattedDate = (() => {
    try {
      return new Date(autosaveTimestamp).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return autosaveTimestamp;
    }
  })();

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 shrink-0 border-b"
      style={{ background: '#1a2a3a', borderColor: '#89b4fa' }}
    >
      <p className="text-xs flex-1" style={{ color: '#a6adc8' }}>
        Se recuperó contenido guardado automáticamente el{' '}
        <strong style={{ color: '#cdd6f4' }}>{formattedDate}</strong>.
        ¿Mantener o descartar? ({secondsRemaining}s)
      </p>
      <button
        onClick={onKeep}
        className="text-xs font-medium px-2.5 py-1 rounded cursor-pointer transition-colors hover:opacity-80"
        style={{ color: '#a6e3a1' }}
        aria-label="Mantener contenido recuperado"
      >
        Mantener
      </button>
      <button
        onClick={onDiscard}
        className="text-xs font-medium px-2.5 py-1 rounded cursor-pointer transition-colors hover:opacity-80"
        style={{ color: '#f38ba8' }}
        aria-label="Descartar contenido recuperado"
      >
        Descartar
      </button>
    </div>
  );
}
