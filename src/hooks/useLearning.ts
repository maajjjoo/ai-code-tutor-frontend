import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson, Level } from '../types/learning.types';
import { parseSections } from '../types/learning.types';
import {
  getCachedLesson, setCachedLesson,
  getDoneLessons, setDoneLesson,
} from '../utils/lessonCache';
import { COURSES } from '../data/courses';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export type ViewState = 'idle' | 'levelSelection' | 'lessonList' | 'lessonView';

export function useLearning() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
  const [selectedLessonNumber, setSelectedLessonNumber] = useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});
  const [topicMap, setTopicMap] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedCourse = useMemo(
    () => COURSES.find(c => c.id === selectedCourseId) ?? null,
    [selectedCourseId],
  );

  const doneLessons = useMemo(() => {
    if (!selectedCourseId) return [];
    return getDoneLessons(selectedCourseId, selectedLevel);
  }, [selectedCourseId, selectedLevel, refreshKey]);

  const completionCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    COURSES.forEach(c => {
      counts[c.id] = {};
      LEVELS.forEach(l => {
        counts[c.id][l] = getDoneLessons(c.id, l).length;
      });
    });
    return counts;
  }, [refreshKey]);

  const levelsDone = useMemo(() => {
    const done: Record<string, string[]> = {};
    COURSES.forEach(c => {
      done[c.id] = LEVELS.filter(l => getDoneLessons(c.id, l).length >= 10);
    });
    return done;
  }, [refreshKey]);

  useEffect(() => {
    const token = localStorage.getItem('codetutor_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/topics`, { headers })
      .then(r => r.json())
      .then((data: Array<{ id: number; name: string }>) => {
        const map: Record<string, string> = {};
        data.forEach(t => { map[t.name] = String(t.id); });
        setTopicMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_BASE}/topics`, { signal: AbortSignal.timeout(5000) }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadLesson = useCallback(async (courseId: string, level: Level, lessonNumber: number) => {
    const cached = getCachedLesson(courseId, level, lessonNumber);
    if (cached) {
      setCurrentLesson(cached);
      setSelectedLessonNumber(lessonNumber);
      setCurrentSectionIndex(0);
      setRevealedHints({});
      setIsBookmarked(false);
      setViewState('lessonView');
      return;
    }
    setIsLoadingLesson(true);
    setViewState('lessonView');
    const t = setTimeout(() => setIsGeneratingLesson(true), 1500);
    try {
      const course = COURSES.find(c => c.id === courseId);
      if (!course) throw new Error('Course not found');
      const topicId = topicMap[course.language];
      if (!topicId) throw new Error('Topic not loaded');
      const lang = course.language;
      const token = localStorage.getItem('codetutor_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(
        `${API_BASE}/lessons/topic/${topicId}?language=${encodeURIComponent(lang)}&level=${encodeURIComponent(level)}&lessonNumber=${lessonNumber}`,
        { headers },
      );
      if (!res.ok) throw new Error();
      const lesson: Lesson = await res.json();
      setCachedLesson(courseId, level, lessonNumber, lesson);
      setCurrentLesson(lesson);
      setSelectedLessonNumber(lessonNumber);
      setCurrentSectionIndex(0);
      setRevealedHints({});
      setIsBookmarked(false);
    } catch {
      setCurrentLesson(null);
      setViewState('lessonList');
    } finally {
      clearTimeout(t);
      setIsLoadingLesson(false);
      setIsGeneratingLesson(false);
    }
  }, [topicMap]);

  const handleCourseSelect = useCallback((courseId: string) => {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      setViewState('idle');
      setCurrentLesson(null);
      return;
    }
    setSelectedCourseId(courseId);
    const courseLevelsDone = levelsDone[courseId] ?? [];
    const next = LEVELS.find(l => !courseLevelsDone.includes(l)) ?? 'advanced';
    setSelectedLevel(next);
    setCurrentLesson(null);
    setViewState('levelSelection');
  }, [selectedCourseId, levelsDone]);

  const handleLevelSelect = useCallback((level: Level) => {
    setSelectedLevel(level);
    setCurrentLesson(null);
    setViewState('lessonList');
  }, []);

  const handleLessonSelect = useCallback((lessonNumber: number) => {
    if (!selectedCourseId) return;
    loadLesson(selectedCourseId, selectedLevel, lessonNumber);
  }, [selectedCourseId, selectedLevel, loadLesson]);

  const handleBackToLevels = useCallback(() => {
    setViewState('levelSelection');
    setCurrentLesson(null);
  }, []);

  const handleBackToLessons = useCallback(() => {
    setViewState('lessonList');
    setCurrentLesson(null);
  }, []);

  const handleLessonComplete = useCallback(() => {
    if (!selectedCourseId || !selectedLessonNumber) return;
    const currentDone = getDoneLessons(selectedCourseId, selectedLevel);
    const alreadyDone = currentDone.includes(selectedLessonNumber);
    setDoneLesson(selectedCourseId, selectedLevel, selectedLessonNumber);
    setRefreshKey(k => k + 1);
    if (!alreadyDone && currentDone.length + 1 >= 10) {
      setIsCompletionModalOpen(true);
    } else {
      setViewState('lessonList');
      setCurrentLesson(null);
    }
  }, [selectedCourseId, selectedLevel, selectedLessonNumber]);

  const handleNextLevel = useCallback(() => {
    setIsCompletionModalOpen(false);
    setCurrentLesson(null);
    const idx = LEVELS.indexOf(selectedLevel);
    if (idx < LEVELS.length - 1) {
      const next = LEVELS[idx + 1];
      setSelectedLevel(next);
      setViewState('lessonList');
    }
  }, [selectedLevel]);

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

  const handleBookmarkToggle = useCallback(() => {
    setIsBookmarked(p => !p);
  }, []);

  const sections = currentLesson ? parseSections(currentLesson) : [];
  const isLastLevel = selectedLevel === 'advanced';

  return {
    viewState, selectedCourseId, selectedCourse, selectedLevel,
    selectedLessonNumber, currentLesson, currentSectionIndex,
    isLoadingLesson, isGeneratingLesson, isCompletionModalOpen,
    isBookmarked, revealedHints, sections, scrollRef, topicMap,
    doneLessons, completionCounts, levelsDone, isLastLevel,
    handleCourseSelect, handleLevelSelect, handleLessonSelect,
    handleBackToLevels, handleBackToLessons,
    handleLessonComplete, handlePrevious, handleNext,
    handleNextLevel, handleBookmarkToggle,
    setIsCompletionModalOpen,
    handleHintReveal: (i: number) => setRevealedHints(p => ({ ...p, [i]: (p[i] ?? 0) + 1 })),
    handleOpenInEditor: (prompt: string) =>
      navigate(`/practice?exercisePrompt=${encodeURIComponent(prompt)}&language=${encodeURIComponent(selectedCourse?.language ?? '')}`),
    handleStepClick: (i: number) => { if (i <= currentSectionIndex) setCurrentSectionIndex(i); },
  };
}
