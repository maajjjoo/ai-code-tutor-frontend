import type { CodeAnalysisResponse } from '../../types';
import { MessageRenderer } from './MessageRenderer';

interface Props {
  result: CodeAnalysisResponse;
}

function QualityBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#534AB7' : value >= 40 ? '#F59E0B' : '#DC2626';

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

export function AnalysisResult({ result }: Props) {
  return (
    <div className="space-y-3">
      {result.quality && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Calidad del código</p>
          <QualityBar label="Estructura" value={result.quality.structure ?? 0} />
          <QualityBar label="Legibilidad" value={result.quality.readability ?? 0} />
        </div>
      )}

      {result.hasErrors && result.errors && result.errors.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-[8px]">Errores encontrados</p>
          <div className="space-y-2">
            {result.errors.map((error, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
                {error.line && (
                  <p className="text-xs font-mono text-red-500 mb-1">Línea {error.line}</p>
                )}
                <p className="text-xs text-red-700 dark:text-red-300 mb-2">{error.message}</p>
                {(error.wrongCode || error.fixedCode) && (
                  <div className="space-y-1">
                    {error.wrongCode && (
                      <div className="rounded bg-red-100 dark:bg-red-900/40 px-2 py-1 font-mono text-xs text-red-600 line-through">{error.wrongCode}</div>
                    )}
                    {error.fixedCode && (
                      <div className="rounded bg-green-100 dark:bg-green-900/40 px-2 py-1 font-mono text-xs text-green-700 dark:text-green-300">{error.fixedCode}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.whatItDoes && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Qué hace tu código</p>
          <MessageRenderer content={result.whatItDoes} />
        </div>
      )}

      {result.suggestions && result.suggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-[8px]">Sugerencias</p>
          <div className="space-y-2">
            {result.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#534AB7] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{typeof s === 'string' ? s : JSON.stringify(s)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
