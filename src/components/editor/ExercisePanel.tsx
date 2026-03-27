import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { generateExercise, getHint, evaluateSolution, getErrorMessage } from '../../services/api';
import type { LearnTopic, Language, Exercise, ExerciseEvaluation } from '../../types';

interface Props { topic: LearnTopic; userId: number; }

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python', 'java'];

export function ExercisePanel({ topic, userId }: Props) {
  const [language, setLanguage] = useState<Language>('javascript');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState('');
  const [hint, setHint] = useState('');
  const [evaluation, setEvaluation] = useState<ExerciseEvaluation | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const setLoad = (key: string, val: boolean) => setLoading(p => ({ ...p, [key]: val }));

  const handleGenerate = async () => {
    setLoad('gen', true); setError(''); setHint(''); setEvaluation(null);
    try {
      const ex = await generateExercise({ topicId: topic.id, language, userId });
      setExercise(ex);
      setCode(ex.starterCode);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoad('gen', false); }
  };

  const handleHint = async () => {
    if (!exercise) return;
    setLoad('hint', true);
    try { setHint(await getHint(exercise.id)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoad('hint', false); }
  };

  const handleSubmit = async () => {
    if (!exercise) return;
    setLoad('submit', true); setError('');
    try {
      const result = await evaluateSolution({ exerciseId: exercise.id, userCode: code, language, userId });
      setEvaluation(result);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoad('submit', false); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#252526] border-b border-[#1e1e1e] shrink-0">
        <span className="text-sm text-[#cccccc] font-semibold">{topic.name}</span>
        <select value={language} onChange={e => setLanguage(e.target.value as Language)}
          className="bg-[#3c3c3c] border border-[#555] text-xs text-[#cccccc] rounded px-2 py-1 cursor-pointer focus:outline-none">
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={loading['gen']}
          className="px-3 py-1 text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white rounded disabled:opacity-50 cursor-pointer">
          {loading['gen'] ? 'Generating...' : 'Generate Exercise'}
        </button>
        {exercise && <>
          <button onClick={handleHint} disabled={loading['hint']}
            className="px-3 py-1 text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] rounded disabled:opacity-50 cursor-pointer">
            {loading['hint'] ? '...' : 'Get Hint'}
          </button>
          <button onClick={handleSubmit} disabled={loading['submit']}
            className="px-3 py-1 text-xs bg-[#388a34] hover:bg-[#4a9e46] text-white rounded disabled:opacity-50 cursor-pointer">
            {loading['submit'] ? 'Evaluating...' : 'Submit Solution'}
          </button>
        </>}
      </div>

      {error && <p className="text-xs text-[#f48771] px-4 py-2">{error}</p>}

      {exercise ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Statement */}
          <div className="px-4 py-3 bg-[#252526] border-b border-[#1e1e1e] text-sm text-[#cccccc] shrink-0 max-h-32 overflow-y-auto">
            <p className="text-xs text-[#858585] mb-1 uppercase tracking-wider">Exercise</p>
            <p className="leading-relaxed">{exercise.statement}</p>
          </div>
          {hint && (
            <div className="px-4 py-2 bg-[#1e3a1e] border-b border-[#1e1e1e] text-xs text-[#4ec9b0] shrink-0">
              💡 {hint}
            </div>
          )}
          {evaluation && (
            <div className={`px-4 py-2 border-b border-[#1e1e1e] text-xs shrink-0 ${evaluation.correct ? 'bg-[#1e3a1e] text-[#4ec9b0]' : 'bg-[#3a1e1e] text-[#f48771]'}`}>
              {evaluation.correct ? '✅' : '❌'} Score: {evaluation.score} — {evaluation.feedback}
            </div>
          )}
          <MonacoEditor height="100%" language={language} value={code} theme="vs-dark"
            onChange={v => setCode(v ?? '')}
            options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, padding: { top: 8 } }} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#858585] text-sm">
          Select a language and click "Generate Exercise"
        </div>
      )}
    </div>
  );
}
