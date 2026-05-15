import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, Topic, Lesson, Level } from '../types/learning.types';
import { parseSections } from '../types/learning.types';
import {
  getCachedLesson, setCachedLesson,
  getCompletedLessons, setCompletedLesson,
  getCompletedLevels, setCompletedLevel,
} from '../utils/lessonCache';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
const LESSONS_PER_LEVEL = 10;

const LANGUAGE_MAP: Record<string, string> = {
  Python: 'Python', Java: 'Java', JavaScript: 'JavaScript',
  TypeScript: 'TypeScript', 'C++': 'C++', Kotlin: 'Kotlin',
};

export function useLearning() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonNumber, setCurrentLessonNumber] = useState(1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<Record<string, string[]>>({});
  const [completedLessons, setCompletedLessons] = useState<Record<string, number[]>>({});
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});
  const [toast] = useState<string | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState(false);

  const token = () => localStorage.getItem('codetutor_token');

  const fetchTopics = useCallback(() => {
    setIsLoadingTopics(true);
    setTopicsError(false);
    fetch(`${API_BASE}/topics`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Array<{ id: number; name: string; category: string; description: string }>) => {
        const map = new Map<string, Category>();
        data.forEach((t, i) => {
          if (!map.has(t.category)) {
            map.set(t.category, { id: t.category, name: 'Languages', icon: '', topicCount: 0, topics: [] });
          }
          const cat = map.get(t.category)!;
          const lang = LANGUAGE_MAP[t.name] ?? t.name;
          cat.topics.push({
            id: String(t.id), categoryId: t.category, name: t.name,
            description: t.description, language: lang, orderIndex: i,
          });
          cat.topicCount = cat.topics.length;
        });
        const cats = Array.from(map.values());
        setCategories(cats);
        const completed: Record<string, string[]> = {};
        const lessons: Record<string, number[]> = {};
        cats.forEach(c => c.topics.forEach(t => {
          completed[t.id] = getCompletedLevels(t.id);
          lessons[t.id] = [];
          LEVELS.forEach(l => {
            lessons[t.id + '_' + l] = getCompletedLessons(t.id, l);
          });
        }));
        setCompletedLevels(completed);
        setCompletedLessons(lessons);
        setTopicsError(false);
      })
      .catch(() => setTopicsError(true))
      .finally(() => setIsLoadingTopics(false));
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const loadLesson = useCallback(async (topic: Topic, level: Level, lessonNumber: number) => {
    const cached = getCachedLesson(topic.id, level, lessonNumber);
    if (cached) {
      setCurrentLesson(cached);
      setCurrentLessonNumber(lessonNumber);
      setCurrentSectionIndex(0);
      setRevealedHints({});
      setIsBookmarked(false);
      return;
    }
    setIsLoadingLesson(true);
    const t = setTimeout(() => setIsGeneratingLesson(true), 1500);
    try {
      const lang = topic.language;
      const res = await fetch(
        `${API_BASE}/lessons/topic/${topic.id}?language=${encodeURIComponent(lang)}&level=${encodeURIComponent(level)}&lessonNumber=${lessonNumber}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) throw new Error();
      const lesson: Lesson = await res.json();
      setCachedLesson(topic.id, level, lessonNumber, lesson);
      setCurrentLesson(lesson);
      setCurrentLessonNumber(lessonNumber);
      setCurrentSectionIndex(0);
      setRevealedHints({});
      setIsBookmarked(false);
    } catch {
      setCurrentLesson(null);
    } finally {
      clearTimeout(t);
      setIsLoadingLesson(false);
      setIsGeneratingLesson(false);
    }
  }, []);

  const handleTopicSelect = useCallback((topic: Topic) => {
    const done = getCompletedLevels(topic.id);
    setCompletedLevels(prev => ({ ...prev, [topic.id]: done }));
    setSelectedTopic(topic);
    setCurrentLesson(null);

    const nextLevel = LEVELS.find(l => !done.includes(l)) ?? 'advanced';
    setSelectedLevel(nextLevel);

    const doneLessons = getCompletedLessons(topic.id, nextLevel);
    const nextLesson = doneLessons.length >= LESSONS_PER_LEVEL ? LESSONS_PER_LEVEL : doneLessons.length + 1;

    if (doneLessons.length >= LESSONS_PER_LEVEL && done.includes(nextLevel)) {
      const idx = LEVELS.indexOf(nextLevel);
      if (idx < LEVELS.length - 1) {
        const nextUnlocked = LEVELS[idx + 1];
        setSelectedLevel(nextUnlocked);
        loadLesson(topic, nextUnlocked, 1);
      }
    } else {
      loadLesson(topic, nextLevel, nextLesson);
    }
  }, [loadLesson]);

  const handleLevelSelect = useCallback((level: Level) => {
    if (!selectedTopic) return;
    setSelectedLevel(level);
    setCurrentLesson(null);
    const doneLessons = getCompletedLessons(selectedTopic.id, level);
    const nextLesson = doneLessons.length >= LESSONS_PER_LEVEL ? LESSONS_PER_LEVEL : doneLessons.length + 1;
    loadLesson(selectedTopic, level, nextLesson);
  }, [selectedTopic, loadLesson]);

  const handleLessonComplete = useCallback(() => {
    if (!currentLesson || !selectedTopic) return;
    const level = currentLesson.level as Level;
    const lessonNum = currentLesson.lessonNumber;

    setCompletedLesson(selectedTopic.id, level, lessonNum);
    setCompletedLessons(prev => {
      const key = selectedTopic.id + '_' + level;
      const current = [...(prev[key] ?? [])];
      if (!current.includes(lessonNum)) current.push(lessonNum);
      return { ...prev, [key]: current };
    });

    if (lessonNum < LESSONS_PER_LEVEL) {
      loadLesson(selectedTopic, level, lessonNum + 1);
    } else {
      setCompletedLevel(selectedTopic.id, level);
      setCompletedLevels(prev => {
        const current = [...(prev[selectedTopic.id] ?? [])];
        if (!current.includes(level)) current.push(level);
        return { ...prev, [selectedTopic.id]: current };
      });
      setIsCompletionModalOpen(true);
    }
  }, [currentLesson, selectedTopic, loadLesson]);

  const handlePrevious = useCallback(() => {
    setCurrentSectionIndex(p => Math.max(0, p - 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNext = useCallback(() => {
    if (!currentLesson) return;
    const max = parseSections(currentLesson).length - 1;
    setCurrentSectionIndex(p => Math.min(max, p + 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentLesson]);

  const handleNextLevel = useCallback(() => {
    setIsCompletionModalOpen(false);
    if (!selectedTopic) return;
    const idx = LEVELS.indexOf(selectedLevel);
    if (idx < LEVELS.length - 1) {
      const nextLevel = LEVELS[idx + 1];
      setSelectedLevel(nextLevel);
      loadLesson(selectedTopic, nextLevel, 1);
    }
  }, [selectedTopic, selectedLevel, loadLesson]);

  const handleBookmarkToggle = useCallback(() => {
    setIsBookmarked(p => !p);
  }, []);

  const handleLevelChange = useCallback((level: Level) => {
    handleLevelSelect(level);
  }, [handleLevelSelect]);

  const sections = currentLesson ? parseSections(currentLesson) : [];
  const completedTopicsArr = Object.entries(completedLevels).filter(([, l]) => l.length >= 3).map(([id]) => id);

  function getCompletedCount(topicId: string, level: string): number {
    return (completedLessons[topicId + '_' + level] ?? []).length;
  }

  function getTotalCompleted(topicId: string): number {
    return LEVELS.reduce((sum, l) => sum + getCompletedCount(topicId, l), 0);
  }

  return {
    categories, selectedTopic, selectedLevel, currentLesson, currentLessonNumber,
    currentSectionIndex, completedLevels, completedLessons, completedTopicsArr,
    isLoadingLesson, isGeneratingLesson, isCompletionModalOpen, isBookmarked,
    revealedHints, toast, sections, scrollRef, isLoadingTopics, topicsError,
    failedLevels: completedLevels,
    handleTopicSelect, handleLevelSelect, handleLessonComplete,
    handlePrevious, handleNext, handleNextLevel, handleLevelChange,
    handleBookmarkToggle,
    handleHintReveal: (i: number) => setRevealedHints(p => ({ ...p, [i]: (p[i] ?? 0) + 1 })),
    handleOpenInEditor: (prompt: string) => navigate(`/practice?exercisePrompt=${encodeURIComponent(prompt)}&language=${encodeURIComponent(selectedTopic?.language ?? '')}`),
    handleStepClick: (i: number) => { if (i <= currentSectionIndex) setCurrentSectionIndex(i); },
    setIsCompletionModalOpen,
    getCompletedCount,
    getTotalCompleted,
    fetchTopics,
  };
}
