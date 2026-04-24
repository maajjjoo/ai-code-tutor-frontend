import { useState, useEffect, useCallback, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { generateExercise, evaluateSolution, getHint, getErrorMessage } from '../../services/api';
import type { LearnTopic, Language, Exercise, ExerciseEvaluation } from '../../types';
import {
  RefreshCw, Send, CheckCircle, XCircle, Lightbulb,
  Code2, Trophy, ChevronDown, ChevronRight, Lock, Loader2
} from 'lucide-react';
import { InlineAiPanel } from '../ai/InlineAiPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMarkdownBold(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#cdd6f4">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:#313244;color:#a6e3a1;font-family:monospace;padding:1px 4px;border-radius:3px;font-size:11px">$1</code>');
}

const DIFFICULTY_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  BEGINNER:     { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Principiante' },
  INTERMEDIATE: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400',   label: 'Intermedio'   },
  ADVANCED:     { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',           dot: 'bg-rose-400',    label: 'Avanzado'     },
};

const LANGUAGE_CONFIG: Record<string, string> = {
  javascript: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  typescript: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  python:     'bg-green-500/15 text-green-400 border-green-500/30',
  java:       'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', cpp: 'cpp',
};

// ── Exercise statement parser ─────────────────────────────────────────────────
// Splits the AI-generated statement into objective, requirements and context
function parseExerciseStatement(statement: string): {
  objective: string;
  requirements: string[];
  context: string;
} {
  const lines = statement.split('\n').map(line => line.trim()).filter(Boolean);
  const requirements: string[] = [];
  const contextLines: string[] = [];
  let objective = '';
  let section: 'objective' | 'requirements' | 'context' = 'objective';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('requisito') || lower.includes('operacion') || lower.includes('debe') || lower.includes('implementa')) {
      section = 'requirements';
    }
    if (lower.includes('contexto') || lower.includes('cuando usar') || lower.includes('por qué') || lower.includes('aplicacion')) {
      section = 'context';
    }

    if (section === 'objective' && !objective) {
      objective = line.replace(/^\*+/, '').trim();
    } else if (section === 'requirements') {
      const cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleaned && cleaned.length > 5) requirements.push(cleaned);
    } else if (section === 'context') {
      contextLines.push(line);
    }
  }

  // Fallback: use first 150 chars as objective if parsing failed
  if (!objective) objective = statement.substring(0, 150);
  if (requirements.length === 0) {
    // Extract bullet points from full text
    const bulletMatches = statement.match(/[-*•]\s+(.+)/g) ?? [];
    bulletMatches.forEach(match => requirements.push(match.replace(/^[-*•]\s+/, '').trim()));
  }

  return {
    objective,
    requirements: requirements.slice(0, 6),
    context: contextLines.join('\n') || 'Practica este concepto para reforzar tu comprensión.',
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ObjectiveBlock({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 120;
  const displayText = isLong && !isExpanded ? text.substring(0, 120) + '...' : text;

  return (
    <div className="rounded-lg border-l-2 border-[#89b4fa] bg-[#1a1a2e] p-3 mb-3">
      <p className="text-[10px] font-semibold text-[#89b4fa] uppercase tracking-wider mb-1.5">Objetivo</p>
      <p
        className="text-xs text-[#a6adc8] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: parseMarkdownBold(displayText) }}
      />
      {isLong && (
        <button
          onClick={() => setIsExpanded(previous => !previous)}
          className="text-[10px] text-[#89b4fa] hover:text-[#cdd6f4] mt-1.5 cursor-pointer transition-colors"
          aria-label={isExpanded ? 'Ver menos' : 'Ver más'}
        >
          {isExpanded ? 'Ver menos ↑' : 'Ver más ↓'}
        </button>
      )}
    </div>
  );
}

function RequirementsList({ requirements, completedCount }: { requirements: string[]; completedCount: number }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold text-[#89b4fa] uppercase tracking-wider mb-2">Requisitos</p>
      <div className="flex flex-col gap-0">
        {requirements.map((requirement, index) => {
          const isCompleted = index < completedCount;
          return (
            <div key={index} className={`flex items-start gap-2.5 py-2 border-b border-[#1e1e2e] last:border-0 ${isCompleted ? 'opacity-60' : ''}`}>
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors
                  ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-transparent border-[#45475a]'}`}
                role="checkbox"
                aria-checked={isCompleted}
              >
                {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              </div>
              <p
                className="text-xs text-[#a6adc8] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdownBold(requirement) }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContextBlock({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(previous => !previous)}
        className="flex items-center gap-2 text-[10px] font-semibold text-[#585b70] uppercase tracking-wider hover:text-[#a6adc8] transition-colors cursor-pointer w-full"
        aria-label={isExpanded ? 'Colapsar contexto' : 'Expandir contexto'}
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Contexto
      </button>
      {isExpanded && (
        <div className="mt-2 pl-3 border-l border-[#313244]">
          <p className="text-xs text-[#585b70] leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}

function HintsTab({ exerciseId }: { exerciseId: number }) {
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRevealNextHint = async () => {
    if (revealedHints.length >= 3) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const hintText = await getHint(exerciseId);
      setRevealedHints(previous => [...previous, hintText]);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      {revealedHints.map((hint, index) => (
        <div key={index} className="rounded-lg bg-[#1a2a1a] border border-[#2a5a3a] p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Pista {index + 1}</span>
          </div>
          <p className="text-xs text-[#a6adc8] leading-relaxed">{hint}</p>
        </div>
      ))}

      {errorMessage && (
        <p className="text-xs text-rose-400">{errorMessage}</p>
      )}

      {revealedHints.length < 3 && (
        <button
          onClick={handleRevealNextHint}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Ver siguiente pista"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
          {revealedHints.length === 0 ? 'Ver primera pista' : 'Ver siguiente pista'}
        </button>
      )}

      {revealedHints.length >= 3 && (
        <p className="text-[10px] text-[#585b70] text-center">Has visto todas las pistas disponibles.</p>
      )}
    </div>
  );
}

function SolutionTab({ starterCode, language, hasAttempted }: { starterCode: string; language: string; hasAttempted: boolean }) {
  if (!hasAttempted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#1e1e2e] border border-[#313244] flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#585b70]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#cdd6f4]">Solución bloqueada</p>
          <p className="text-xs text-[#585b70] mt-1">Intenta resolver el ejercicio primero.<br />Se desbloqueará después de tu primer intento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <p className="text-[10px] font-semibold text-[#585b70] uppercase tracking-wider mb-2">Código de referencia</p>
      <div className="rounded-lg overflow-hidden border border-[#313244]">
        <MonacoEditor
          height="200px"
          language={MONACO_LANGUAGE_MAP[language] ?? 'javascript'}
          value={starterCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'off',
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  topic: LearnTopic;
  language: Language;
  userId: number;
  onAskHelp: (statement: string, code: string) => void;
}

type ActiveTab = 'statement' | 'hints' | 'solution';

export function ExercisePanel({ topic, language, userId }: Props) {
  const [exercise, setExercise]               = useState<Exercise | null>(null);
  const [studentCode, setStudentCode]         = useState('');
  const [evaluation, setEvaluation]           = useState<ExerciseEvaluation | null>(null);
  const [activeTab, setActiveTab]             = useState<ActiveTab>('statement');
  const [isGenerating, setIsGenerating]       = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [errorMessage, setErrorMessage]       = useState('');
  const [hasAttempted, setHasAttempted]       = useState(false);
  const [leftPanelWidth, setLeftPanelWidth]   = useState(320);
  const [isDragging, setIsDragging]           = useState(false);
  const containerRef                          = useRef<HTMLDivElement>(null);

  const parsedStatement = exercise ? parseExerciseStatement(exercise.statement) : null;
  const difficultyConfig = DIFFICULTY_CONFIG[topic.difficulty] ?? DIFFICULTY_CONFIG.BEGINNER;

  useEffect(() => {
    setExercise(null);
    setStudentCode('');
    setEvaluation(null);
    setActiveTab('statement');
    setErrorMessage('');
    setHasAttempted(false);
  }, [language, topic.id]);

  const handleGenerateExercise = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setEvaluation(null);
    setHasAttempted(false);
    setActiveTab('statement');
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
    setHasAttempted(true);
    try {
      const result = await evaluateSolution({ exerciseId: exercise.id, userCode: studentCode, language, userId });
      setEvaluation(result);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Resizer drag logic ──────────────────────────────────────────────────────
  const handleResizerMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    const startX = event.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(260, Math.min(500, startWidth + delta));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!exercise) {
    return (
      <div className="flex-1 flex flex-col bg-[#0d0d14]">
        <div className="px-5 py-3 bg-[#080810] border-b border-[#1e1e2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${difficultyConfig.dot}`} />
            <h1 className="text-sm font-semibold text-[#cdd6f4]">{topic.name}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${difficultyConfig.badge}`}>
              {difficultyConfig.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono capitalize ${LANGUAGE_CONFIG[language] ?? ''}`}>
              {language}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1e1e2e] border border-[#313244] flex items-center justify-center">
            <Code2 className="w-7 h-7 text-[#89b4fa]" />
          </div>
          <div className="text-center max-w-xs">
            <p className="text-sm font-medium text-[#cdd6f4] mb-1">¿Listo para practicar?</p>
            <p className="text-xs text-[#585b70] leading-relaxed">
              La IA generará un ejercicio sobre <strong className="text-[#89b4fa]">{topic.name}</strong> en {language}.
            </p>
          </div>
          {errorMessage && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2 max-w-sm text-center">
              {errorMessage}
            </p>
          )}
          <button
            onClick={handleGenerateExercise}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#89b4fa] hover:bg-[#7aa2e8] text-[#1e1e2e] rounded-lg cursor-pointer transition-colors disabled:opacity-60"
            aria-label="Generar ejercicio"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
            {isGenerating ? 'Generando...' : 'Generar ejercicio'}
          </button>
        </div>
      </div>
    );
  }

  // ── Exercise loaded — two-column grid layout ────────────────────────────────
  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden bg-[#0d0d14]">

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#080810] border-b border-[#1e1e2e] shrink-0" style={{ height: 36 }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${difficultyConfig.dot}`} />
          <span className="text-xs font-semibold text-[#cdd6f4] truncate">{topic.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0 ${difficultyConfig.badge}`}>
            {difficultyConfig.label}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0 capitalize ${LANGUAGE_CONFIG[language] ?? ''}`}>
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Reset button */}
          <button
            onClick={handleGenerateExercise}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-[#313244] text-[#585b70] hover:text-[#cdd6f4] hover:border-[#45475a] rounded-md cursor-pointer transition-colors disabled:opacity-50"
            style={{ height: 26, borderRadius: 5 }}
            aria-label="Nuevo ejercicio"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            Nuevo
          </button>

          {/* Submit button */}
          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting || !studentCode.trim()}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#89b4fa] hover:bg-[#7aa2e8] text-[#1e1e2e] font-semibold rounded-md cursor-pointer transition-colors disabled:opacity-50"
            style={{ height: 26, borderRadius: 5 }}
            aria-label="Entregar solución"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {isSubmitting ? 'Evaluando...' : 'Entregar'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="px-4 py-1.5 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-400 shrink-0">
          {errorMessage}
        </div>
      )}

      {/* Two-column body */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — Exercise info panel */}
        <div
          className="flex flex-col border-r border-[#1e1e2e] overflow-hidden bg-[#0a0a12] shrink-0"
          style={{ width: leftPanelWidth }}
        >
          {/* Internal tabs */}
          <div className="flex border-b border-[#1e1e2e] shrink-0" style={{ height: 36 }}>
            {(['statement', 'hints', 'solution'] as ActiveTab[]).map(tab => {
              const tabLabels: Record<ActiveTab, string> = {
                statement: 'Enunciado',
                hints: 'Pistas',
                solution: 'Solución',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-[11px] font-medium transition-colors cursor-pointer border-t-2
                    ${activeTab === tab
                      ? 'border-[#89b4fa] text-[#cdd6f4] bg-[#0d0d14]'
                      : 'border-transparent text-[#585b70] hover:text-[#a6adc8] bg-transparent'
                    }`}
                  aria-label={`Tab ${tabLabels[tab]}`}
                >
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'statement' && parsedStatement && (
              <div className="p-3">
                <ObjectiveBlock text={parsedStatement.objective} />
                {parsedStatement.requirements.length > 0 && (
                  <RequirementsList
                    requirements={parsedStatement.requirements}
                    completedCount={evaluation?.correct ? parsedStatement.requirements.length : 0}
                  />
                )}
                <ContextBlock text={parsedStatement.context} />
              </div>
            )}

            {activeTab === 'hints' && (
              <HintsTab exerciseId={exercise.id} />
            )}

            {activeTab === 'solution' && (
              <SolutionTab
                starterCode={exercise.starterCode ?? ''}
                language={language}
                hasAttempted={hasAttempted}
              />
            )}
          </div>

          {/* Evaluation result */}
          {evaluation && (
            <div className={`border-t p-3 shrink-0 ${evaluation.correct ? 'border-emerald-500/30 bg-[#0d1f0d]' : 'border-rose-500/30 bg-[#1f0d0d]'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {evaluation.correct
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className={`text-xs font-semibold ${evaluation.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {evaluation.correct ? '¡Correcto!' : 'Intenta de nuevo'}
                </span>
                {evaluation.correct && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[#4ec9b0]">
                    <Trophy className="w-3 h-3" /> +1
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1 bg-[#313244] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${evaluation.score >= 70 ? 'bg-emerald-400' : evaluation.score >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${evaluation.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#585b70] font-mono shrink-0">{evaluation.score}/100</span>
              </div>
              <p className="text-[11px] text-[#a6adc8] leading-relaxed line-clamp-3">{evaluation.feedback}</p>
            </div>
          )}
        </div>

        {/* RESIZER */}
        <div
          onMouseDown={handleResizerMouseDown}
          className={`w-1 shrink-0 cursor-col-resize transition-colors hover:bg-[#89b4fa]/25 ${isDragging ? 'bg-[#89b4fa]/25' : 'bg-transparent'}`}
          aria-label="Redimensionar paneles"
        />

        {/* RIGHT — Editor + inline AI panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor area */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#080810] border-b border-[#1e1e2e] shrink-0" style={{ height: 36 }}>
              <div className="w-4 h-4 rounded bg-[#89b4fa]/20 border border-[#89b4fa]/30 flex items-center justify-center shrink-0">
                <span className="text-[9px] text-[#89b4fa] font-bold">2</span>
              </div>
              <p className="text-[10px] font-semibold text-[#585b70] uppercase tracking-wider">Tu solución</p>
              {studentCode.trim() && !evaluation && (
                <span className="ml-auto text-[10px] text-[#45475a]">Ctrl+Enter para entregar</span>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <MonacoEditor
                height="100%"
                language={MONACO_LANGUAGE_MAP[language] ?? 'javascript'}
                value={studentCode}
                theme="vs-dark"
                onChange={value => setStudentCode(value ?? '')}
                aria-label="Editor de código"
                options={{
                  fontSize: 14,
                  fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  cursorBlinking: 'smooth',
                }}
              />
            </div>
          </div>

          {/* Inline AI panel — shrink-0 so it doesn't compress, grows via drag */}
          <InlineAiPanel
            currentCode={studentCode}
            language={language}
          />
        </div>
      </div>
    </div>
  );
}
