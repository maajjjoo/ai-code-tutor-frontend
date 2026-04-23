import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Layers, Zap, Trophy } from 'lucide-react';
import { getTopicsByCategory, getProgress, getErrorMessage } from '../../services/api';
import type { LearnTopic, LearnCategory, Language, UserProgress } from '../../types';

const SECTIONS: { category: LearnCategory; label: string; icon: React.ReactNode }[] = [
  { category: 'DATA_STRUCTURE', label: 'Estructuras de Datos', icon: <Layers className="w-3.5 h-3.5" /> },
  { category: 'DESIGN_PATTERN', label: 'Patrones de Diseño',  icon: <BookOpen className="w-3.5 h-3.5" /> },
  { category: 'ALGORITHM',      label: 'Algoritmos',          icon: <Zap className="w-3.5 h-3.5" /> },
];

const LANGUAGES: { value: Language; label: string; activeStyle: string }[] = [
  { value: 'javascript', label: 'JS', activeStyle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'typescript', label: 'TS', activeStyle: 'bg-blue-500/20 text-blue-400 border-blue-500/30'      },
  { value: 'python',     label: 'PY', activeStyle: 'bg-green-500/20 text-green-400 border-green-500/30'   },
  { value: 'java',       label: 'JV', activeStyle: 'bg-orange-500/20 text-orange-400 border-orange-500/30'},
];

interface Props {
  userId: number;
  onSelectTopic: (topic: LearnTopic, language: Language) => void;
  activeTopicId: number | null;
  selectedLang: Language;
  onLangChange: (lang: Language) => void;
}

export function LearnSidebar({ userId, onSelectTopic, activeTopicId, selectedLang, onLangChange }: Props) {
  const [openSections, setOpenSections]         = useState<Record<string, boolean>>({});
  const [topicsByCategory, setTopicsByCategory] = useState<Record<string, LearnTopic[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});
  const [categoryErrors, setCategoryErrors]     = useState<Record<string, string>>({});
  const [progressList, setProgressList]         = useState<UserProgress[]>([]);
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);

  const loadStudentProgress = async () => {
    if (hasLoadedProgress) return;
    try {
      const progressData = await getProgress(userId);
      setProgressList(progressData);
      setHasLoadedProgress(true);
    } catch {
      // Progress is optional — silently ignore
    }
  };

  const toggleSection = async (category: LearnCategory) => {
    const isSectionOpen = openSections[category];
    setOpenSections(previous => ({ ...previous, [category]: !isSectionOpen }));

    if (!isSectionOpen && !topicsByCategory[category]) {
      setLoadingCategories(previous => ({ ...previous, [category]: true }));
      try {
        const fetchedTopics = await getTopicsByCategory(category);
        setTopicsByCategory(previous => ({ ...previous, [category]: fetchedTopics }));
        await loadStudentProgress();
      } catch (err) {
        setCategoryErrors(previous => ({ ...previous, [category]: getErrorMessage(err) }));
      } finally {
        setLoadingCategories(previous => ({ ...previous, [category]: false }));
      }
    }
  };

  const getTopicProgress = (topicId: number) =>
    progressList.find(progressItem => progressItem.topicId === topicId);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d0d14' }}>

      {/* Header */}
      <div className="px-3 py-2.5 border-b shrink-0" style={{ borderColor: '#1e1e2e' }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#585b70' }}>
          Aprende
        </p>
        <div className="flex gap-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => onLangChange(lang.value)}
              className={`flex-1 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer
                ${selectedLang === lang.value
                  ? lang.activeStyle
                  : 'bg-transparent border-[#313244] hover:border-[#45475a]'
                }`}
              style={selectedLang !== lang.value ? { color: '#585b70' } : {}}
              aria-label={`Seleccionar lenguaje ${lang.label}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic sections */}
      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map(({ category, label, icon }) => (
          <div key={category}>

            {/* Section header */}
            <button
              onClick={() => toggleSection(category)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-[#1e1e2e]"
              aria-label={`${openSections[category] ? 'Colapsar' : 'Expandir'} ${label}`}
            >
              {openSections[category]
                ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: '#585b70' }} />
                : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: '#585b70' }} />}
              <span style={{ color: '#585b70' }}>{icon}</span>
              <span className="font-medium uppercase text-[10px] tracking-wider" style={{ color: '#585b70' }}>
                {label}
              </span>
              {loadingCategories[category] && (
                <span className="ml-auto text-[10px] animate-pulse" style={{ color: '#45475a' }}>...</span>
              )}
            </button>

            {/* Topic list */}
            {openSections[category] && (
              <div className="pb-1">
                {categoryErrors[category] && (
                  <p className="text-xs px-3 py-1" style={{ color: '#f38ba8' }}>{categoryErrors[category]}</p>
                )}

                {(topicsByCategory[category] ?? []).map(topic => {
                  const topicProgress = getTopicProgress(topic.id);
                  const isActive = activeTopicId === topic.id;
                  const isCompleted = topicProgress && topicProgress.completedExercises > 0;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic, selectedLang)}
                      className="w-full text-left px-3 py-1.5 text-xs cursor-pointer transition-colors"
                      style={{
                        background: isActive ? '#313244' : 'transparent',
                        color: isActive ? '#cdd6f4' : '#a6adc8',
                      }}
                      onMouseEnter={event => { if (!isActive) event.currentTarget.style.background = '#1e1e2e'; }}
                      onMouseLeave={event => { if (!isActive) event.currentTarget.style.background = 'transparent'; }}
                      aria-label={`Seleccionar tema ${topic.name}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Status dot */}
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background: isActive ? '#89b4fa' : isCompleted ? '#a6e3a1' : '#45475a',
                          }}
                        />
                        <span className="truncate flex-1">{topic.name}</span>
                        {topicProgress && topicProgress.completedExercises > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: '#a6e3a1' }}>
                            <Trophy className="w-2.5 h-2.5" />
                            {topicProgress.completedExercises}
                          </span>
                        )}
                      </div>
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
