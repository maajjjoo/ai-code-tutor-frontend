import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { generateExercise, evaluateSolution, getErrorMessage } from '../../services/api';
import type { LearnTopic, Language, Exercise, ExerciseEvaluation } from '../../types';
import { RefreshCw, Send, CheckCircle, XCircle, MessageCircle } from 'lucide-react';

interface Props {
  topic: LearnTopic;
  language: Language;
  userId: number;
  onAskHelp: (statement: string, code: string) => void;
}

const MONACO_LANG: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

export function ExercisePanel({ topic, language, userId, onAskHelp }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState('');
  const [evaluation, setEvaluation] = useState<ExerciseEvaluation | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Resetear ejercicio cuando cambia el lenguaje o el tópico
  useEffect(() => {
    setExercise(null);
    setCode('');
    setEvaluation(null);
    setError('');
  }, [language, topic.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setEvaluation(null);
    try {
      const ex = await generateExercise({ topicId: topic.id, language, userId });
      setExercise(ex);
      setCode(ex.starterCode);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!exercise) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await evaluateSolution({ exerciseId: exercise.id, userCode: code, language, userId });
      setEvaluation(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskHelp = () => {
    if (!exercise) return;
    // Manda el enunciado y el código actual al chat de la IA
    onAskHelp(exercise.statement, code);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d14]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#080810] border-b border-[#ffffff06] shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-white truncate">{topic.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa] font-mono shrink-0 capitalize">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {exercise && (
            <>
              <button onClick={handleAskHelp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#161622] border border-[#ffffff10] text-[#a78bfa] hover:bg-[#a78bfa]/10 rounded-lg cursor-pointer transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Pedir ayuda
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#388a34] hover:bg-[#4a9e46] text-white rounded-lg disabled:opacity-50 cursor-pointer transition-colors">
                <Send className="w-3 h-3" />
                {submitting ? 'Evaluando...' : 'Entregar'}
              </button>
            </>
          )}
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-[#0e639c] to-[#1177bb] hover:opacity-90 text-white rounded-lg disabled:opacity-50 cursor-pointer transition-all shadow-lg shadow-[#0e639c]/20">
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generando...' : exercise ? 'Nuevo ejercicio' : 'Generar ejercicio'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 shrink-0">
          {error}
        </div>
      )}

      {!exercise ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a78bfa]/20 to-[#0e639c]/20 border border-[#ffffff08] flex items-center justify-center">
            <span className="text-3xl">{'{ }'}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{topic.name}</p>
            <p className="text-xs text-[#6b7280] mt-1">Genera un ejercicio para empezar a practicar</p>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="px-5 py-2.5 text-sm bg-gradient-to-r from-[#6f42c1] to-[#0e639c] hover:opacity-90 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-[#6f42c1]/20 font-medium">
            {generating ? 'Generando...' : 'Generar ejercicio'}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enunciado */}
          <div className="px-4 py-3 bg-[#161622] border-b border-[#ffffff06] shrink-0 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Ejercicio</p>
            <p className="text-sm text-[#e5e7eb] leading-relaxed">{exercise.statement}</p>
          </div>

          {/* Resultado evaluación */}
          {evaluation && (
            <div className={`px-4 py-3 border-b border-[#ffffff06] shrink-0 flex items-start gap-3
              ${evaluation.correct ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {evaluation.correct
                ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${evaluation.correct ? 'text-green-400' : 'text-red-400'}`}>
                    {evaluation.correct ? '¡Correcto!' : 'Intenta de nuevo'}
                  </span>
                  <span className="text-[10px] text-[#6b7280]">Puntaje: {evaluation.score}/100</span>
                </div>
                <p className="text-xs text-[#d1d5db] leading-relaxed">{evaluation.feedback}</p>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={MONACO_LANG[language] ?? 'javascript'}
              value={code}
              theme="vs-dark"
              onChange={v => setCode(v ?? '')}
              options={{
                fontSize: 14,
                fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                lineNumbers: 'on',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
