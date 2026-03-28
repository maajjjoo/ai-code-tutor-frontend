import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Layers, Zap, Trophy } from 'lucide-react';
import { getTopicsByCategory, getProgress, getErrorMessage } from '../../services/api';
import type { LearnTopic, LearnCategory, Language, UserProgress } from '../../types';

const SECTIONS: { category: LearnCategory; label: string; icon: React.ReactNode }[] = [
  { category: 'DATA_STRUCTURE', label: 'Data Structures', icon: <Layers className="w-3.5 h-3.5" /> },
  { category: 'DESIGN_PATTERN', label: 'Design Patterns', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { category: 'ALGORITHM', label: 'Algorithms', icon: <Zap className="w-3.5 h-3.5" /> },
];

const LANGUAGES: { value: Language; label: string; color: string }[] = [
  { value: 'javascript', label: 'JavaScript', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'typescript', label: 'TypeScript', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'python', label: 'Python', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'java', label: 'Java', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
];

interface Props {
  userId: number;
  onSelectTopic: (topic: LearnTopic, language: Language) => void;
  activeTopicId: number | null;
  selectedLang: Language;
  onLangChange: (lang: Language) => void;
}

export function LearnSidebar({ userId, onSelectTopic, activeTopicId, selectedLang, onLangChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [topics, setTopics] = useState<Record<string, LearnTopic[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);

  const loadProgress = async () => {
    if (progressLoaded) return;
    try {
      const data = await getProgress(userId);
      setProgress(data);
      setProgressLoaded(true);
    } catch { /* ignorar */ }
  };

  const toggleSection = async (category: LearnCategory) => {
    const isOpen = open[category];
    setOpen(prev => ({ ...prev, [category]: !isOpen }));
    if (!isOpen && !topics[category]) {
      setLoading(prev => ({ ...prev, [category]: true }));
      try {
        const data = await getTopicsByCategory(category);
        setTopics(prev => ({ ...prev, [category]: data }));
        await loadProgress();
      } catch (err) {
        setErrors(prev => ({ ...prev, [category]: getErrorMessage(err) }));
      } finally {
        setLoading(prev => ({ ...prev, [category]: false }));
      }
    }
  };

  const getTopicProgress = (topicId: number) =>
    progress.find(p => p.topicId === topicId);

  return (
    <div className="flex flex-col h-full text-[#cccccc] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e1e1e] shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#bbbbbb] mb-2">Learn</p>

        {/* Selector de lenguaje */}
        <div className="flex gap-1 flex-wrap">
          {LANGUAGES.map(l => (
            <button key={l.value} onClick={() => onLangChange(l.value)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-all cursor-pointer
                ${selectedLang === l.value ? l.color : 'bg-transparent text-[#555] border-[#3c3c3c] hover:text-[#858585]'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secciones */}
      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map(({ category, label, icon }) => (
          <div key={category}>
            <button onClick={() => toggleSection(category)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#2a2d2e] transition-colors cursor-pointer">
              {open[category]
                ? <ChevronDown className="w-3 h-3 text-[#858585] shrink-0" />
                : <ChevronRight className="w-3 h-3 text-[#858585] shrink-0" />}
              <span className="text-[#858585]">{icon}</span>
              <span className="font-medium">{label}</span>
              {loading[category] && <span className="ml-auto text-[10px] text-[#555]">...</span>}
            </button>

            {open[category] && (
              <div className="pl-2">
                {errors[category] && <p className="text-xs text-[#f48771] px-3 py-1">{errors[category]}</p>}
                {(topics[category] ?? []).map(topic => {
                  const prog = getTopicProgress(topic.id);
                  const pct = prog ? Math.round((prog.completedExercises / Math.max(prog.totalExercises, 1)) * 100) : 0;
                  const isActive = activeTopicId === topic.id;
                  return (
                    <button key={topic.id} onClick={() => onSelectTopic(topic, selectedLang)}                      className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer group
                        ${isActive ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{topic.name}</span>
                        {prog && prog.completedExercises > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-[#4ec9b0] shrink-0">
                            <Trophy className="w-2.5 h-2.5" />{prog.completedExercises}
                          </span>
                        )}
                      </div>
                      {/* Barra de progreso */}
                      {prog && (
                        <div className="mt-1 h-0.5 bg-[#3c3c3c] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4ec9b0] transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
