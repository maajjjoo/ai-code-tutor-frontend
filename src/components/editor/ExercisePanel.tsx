import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { generateExercise, evaluateSolution, getHint, getErrorMessage } from '../../services/api';
import type { LearnTopic, Language, Exercise, ExerciseEvaluation } from '../../types';
import {
  RefreshCw, Send, CheckCircle, XCircle,
  MessageCircle, Lightbulb, Code2, Trophy,
  ChevronRight, Loader2
} from 'lucide-react';

// Simple markdown renderer — bold, inline code, line breaks
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-[#1e1e1e] text-[#ce9178] px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
    .replace(/\n/g, '<br />');
}

interface Props {
  topic: LearnTopic;
  language: Language;
  userId: number;
  onAskHelp: (statement: string, code: string) => void;
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

const DIFFICULTY_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  BEGINNER:     { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Principiante' },
  INTERMEDIATE: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400',   label: 'Intermedio'   },
  ADVANCED:     { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',           dot: 'bg-rose-400',    label: 'Avanzado'     },
};

const LANGUAGE_STYLES: Record<string, string> = {
  javascript: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  typescript: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  python:     'bg-green-500/15 text-green-400 border-green-500/30',
  java:       'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step, label, active, done }: {
  step: number; label: string; active: boolean; done: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${active ? 'text-white' : done ? 'text-[#4ec9b0]' : 'text-[#555]'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors
        ${active ? 'bg-[#0e639c] border-[#0e639c] text-white' : done ? 'bg-[#4ec9b0]/20 border-[#4ec9b0] text-[#4ec9b0]' : 'bg-transparent border-[#3c3c3c] text-[#555]'}`}>
        {done ? '✓' : step}
      </div>
      <span className="hidden sm:block">{label}</span>
    </div>
  );
}

export function ExercisePanel({ topic, language, userId, onAskHelp }: Props) {
  const [exercise, setExercise]         = useState<Exercise | null>(null);
  const [studentCode, setStudentCode]   = useState('');
  const [evaluation, setEvaluation]     = useState<ExerciseEvaluation | null>(null);
  const [hintText, setHintText]         = useState('');
  const [showHint, setShowHint]         = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Current step: 1 = read exercise, 2 = write solution, 3 = see result
  const currentStep = !exercise ? 0 : !evaluation ? (studentCode.trim() ? 2 : 1) : 3;

  useEffect(() => {
    setExercise(null);
    setStudentCode('');
    setEvaluation(null);
    setHintText('');
    setShowHint(false);
    setErrorMessage('');
  }, [language, topic.id]);

  const handleGenerateExercise = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setEvaluation(null);
    setHintText('');
    setShowHint(false);
    try {
      const generatedExercise = await generateExercise({ topicId: topic.id, language, userId });
      setExercise(generatedExercise);
      setStudentCode(generatedExercise.starterCode ?? '');
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!exercise) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await evaluateSolution({ exerciseId: exercise.id, userCode: studentCode, language, userId });
      setEvaluation(result);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!exercise) return;
    setIsLoadingHint(true);
    try {
      const fetchedHint = await getHint(exercise.id);
      setHintText(fetchedHint);
      setShowHint(true);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoadingHint(false);
    }
  };

  const difficultyInfo = DIFFICULTY_STYLES[topic.difficulty] ?? DIFFICULTY_STYLES.BEGINNER;

  // ── Empty / loading state ─────────────────────────────────────────────────
  if (!exercise) {
    return (
      <div className="flex-1 flex flex-col bg-[#0d0d14]">
        {/* Topic header */}
        <div className="px-6 py-4 bg-[#080810] border-b border-[#ffffff06]">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${difficultyInfo.dot}`} />
            <h1 className="text-base font-semibold text-white">{topic.name}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${difficultyInfo.badge}`}>
              {difficultyInfo.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono capitalize ${LANGUAGE_STYLES[language] ?? ''}`}>
              {language}
            </span>
          </div>
          {topic.description && (
            <p className="text-xs text-[#6b7280] mt-2 leading-relaxed max-w-2xl">{topic.description}</p>
          )}
        </div>

        {/* Center CTA */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a78bfa]/20 to-[#0e639c]/20 border border-[#ffffff08] flex items-center justify-center">
            <Code2 className="w-9 h-9 text-[#a78bfa]" />
          </div>
          <div className="text-center max-w-xs">
            <p className="text-sm font-medium text-white mb-1">¿Listo para practicar?</p>
            <p className="text-xs text-[#6b7280]">La IA generará un ejercicio personalizado sobre <strong className="text-[#a78bfa]">{topic.name}</strong> en {language}.</p>
          </div>
          {errorMessage && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 max-w-sm text-center">{errorMessage}</p>
          )}
          <button
            onClick={handleGenerateExercise}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-gradient-to-r from-[#6f42c1] to-[#0e639c] hover:opacity-90 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-[#6f42c1]/20 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
            {isGenerating ? 'Generando ejercicio...' : 'Generar ejercicio'}
          </button>
        </div>
      </div>
    );
  }

  // ── Exercise loaded — two-column layout ───────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d14]">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#080810] border-b border-[#ffffff06] shrink-0">
        {/* Topic + badges */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${difficultyInfo.dot}`} />
          <span className="text-sm font-semibold text-white truncate">{topic.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono shrink-0 ${difficultyInfo.badge}`}>
            {difficultyInfo.label}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono shrink-0 capitalize ${LANGUAGE_STYLES[language] ?? ''}`}>
            {language}
          </span>
        </div>

        {/* Step indicators */}
        <div className="hidden md:flex items-center gap-1 text-[10px] text-[#555]">
          <StepIndicator step={1} label="Lee el ejercicio" active={currentStep === 1} done={currentStep > 1} />
          <ChevronRight className="w-3 h-3" />
          <StepIndicator step={2} label="Escribe tu solución" active={currentStep === 2} done={currentStep > 2} />
          <ChevronRight className="w-3 h-3" />
          <StepIndicator step={3} label="Resultado" active={currentStep === 3} done={false} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAskHelp(exercise.statement, studentCode)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#161622] border border-[#ffffff10] text-[#a78bfa] hover:bg-[#a78bfa]/10 rounded-lg cursor-pointer transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Pedir ayuda</span>
          </button>
          <button
            onClick={handleGenerateExercise}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#161622] border border-[#ffffff10] text-[#cccccc] hover:bg-[#2a2d2e] rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:block">{isGenerating ? 'Generando...' : 'Nuevo'}</span>
          </button>
          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting || !studentCode.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#388a34] hover:bg-[#4a9e46] text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 font-medium"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {isSubmitting ? 'Evaluando...' : 'Entregar'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 shrink-0">
          {errorMessage}
        </div>
      )}

      {/* Two-column body */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — Exercise info */}
        <div className="w-80 shrink-0 flex flex-col border-r border-[#ffffff06] overflow-hidden bg-[#0a0a12]">

          {/* Exercise statement */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-[#0e639c]/20 border border-[#0e639c]/30 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-[#0e639c] font-bold">1</span>
              </div>
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Enunciado</p>
            </div>
            <div
              className="text-sm text-[#e5e7eb] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(exercise.statement) }}
            />
          </div>

          {/* Hint section */}
          <div className="border-t border-[#ffffff06] p-3 shrink-0">
            {!showHint ? (
              <button
                onClick={handleRequestHint}
                disabled={isLoadingHint}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#ff9800] border border-[#ff9800]/20 rounded-lg hover:bg-[#ff9800]/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoadingHint
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando pista...</>
                  : <><Lightbulb className="w-3.5 h-3.5" /> Ver pista</>}
              </button>
            ) : (
              <div className="bg-[#2d2a1e] border border-[#ff9800]/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[#ff9800]" />
                    <span className="text-[10px] font-semibold text-[#ff9800] uppercase tracking-wider">Pista</span>
                  </div>
                  <button
                    onClick={handleRequestHint}
                    disabled={isLoadingHint}
                    className="text-[10px] text-[#6b7280] hover:text-[#ff9800] cursor-pointer transition-colors"
                  >
                    {isLoadingHint ? '...' : 'Nueva pista'}
                  </button>
                </div>
                <p className="text-xs text-[#fcd34d] leading-relaxed">{hintText}</p>
              </div>
            )}
          </div>

          {/* Evaluation result */}
          {evaluation && (
            <div className={`border-t p-3 shrink-0 ${evaluation.correct ? 'border-emerald-500/30 bg-[#0d1f0d]' : 'border-rose-500/30 bg-[#1f0d0d]'}`}>
              <div className="flex items-center gap-2 mb-2">
                {evaluation.correct
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className={`text-sm font-semibold ${evaluation.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {evaluation.correct ? '¡Correcto!' : 'Intenta de nuevo'}
                </span>
                {evaluation.correct && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[#4ec9b0]">
                    <Trophy className="w-3 h-3" /> +1
                  </span>
                )}
              </div>

              {/* Score bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-[#3c3c3c] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${evaluation.score >= 70 ? 'bg-emerald-400' : evaluation.score >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${evaluation.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#9ca3af] font-mono shrink-0">{evaluation.score}/100</span>
              </div>

              <p className="text-xs text-[#d1d5db] leading-relaxed">{evaluation.feedback}</p>
            </div>
          )}
        </div>

        {/* RIGHT — Code editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0d0d14] border-b border-[#ffffff06] shrink-0">
            <div className="w-5 h-5 rounded bg-[#388a34]/20 border border-[#388a34]/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] text-[#4ec9b0] font-bold">2</span>
            </div>
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Tu solución</p>
            {studentCode.trim() && !evaluation && (
              <span className="ml-auto text-[10px] text-[#555]">Cuando termines, haz clic en Entregar →</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={MONACO_LANGUAGE_MAP[language] ?? 'javascript'}
              value={studentCode}
              theme="vs-dark"
              onChange={value => setStudentCode(value ?? '')}
              options={{
                fontSize: 14,
                fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
