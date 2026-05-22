import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson, Level } from '../types/learning.types';
import { parseSections } from '../types/learning.types';
import {
  getCachedLesson, setCachedLesson,
  getDoneLessons, setDoneLesson, resetDoneLessons,
} from '../utils/lessonCache';
import apiClient from '../services/apiClient';
import { COURSES } from '../data/courses';
import { LESSON_TITLES } from '../data/lessonTitles';
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export type ViewState = 'idle' | 'levelSelection' | 'lessonView';

export function useLearning() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
  const [currentLessonNumber, setCurrentLessonNumber] = useState(1);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});
  const [topicMap, setTopicMap] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [restartTarget, setRestartTarget] = useState<{ courseId: string; level: Level } | null>(null);

  const selectedCourse = useMemo(
    () => COURSES.find(c => c.id === selectedCourseId) ?? null,
    [selectedCourseId],
  );

  const doneLessons = useMemo(
    () => selectedCourseId ? getDoneLessons(selectedCourseId, selectedLevel) : [],
    [selectedCourseId, selectedLevel, refreshKey],
  );

  const completionCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    COURSES.forEach(c => {
      counts[c.id] = {};
      LEVELS.forEach(l => { counts[c.id][l] = getDoneLessons(c.id, l).length; });
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
    apiClient.get<Array<{ id: number; name: string }>>('/topics')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data.forEach(t => { map[t.name] = String(t.id); });
        setTopicMap(map);
      })
      .catch((error) => {
        console.error('Failed to load topics:', error);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      apiClient.get('/topics', { signal: AbortSignal.timeout(5000) }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getNextLessonNumber = useCallback((courseId: string, level: Level): number => {
    const done = getDoneLessons(courseId, level);
    if (done.length >= 10) return 10;
    for (let i = 1; i <= 10; i++) {
      if (!done.includes(i)) return i;
    }
    return 1;
  }, []);

  const preloadLevel = useCallback(async (courseId: string, level: Level) => {
    const course = COURSES.find(c => c.id === courseId);
    if (!course) return;
    const topicId = topicMap[course.name];
    if (!topicId) return;
    try {
      const { data: lessons } = await apiClient.get<Lesson[]>(
        `/lessons/topic/${topicId}/level/${encodeURIComponent(level)}`
      );
      lessons.forEach(lesson => {
        setCachedLesson(courseId, level, lesson.lessonNumber, lesson);
      });
    } catch {
      // silent — cache miss handled by individual lesson load
    }
  }, [topicMap]);

  const loadLesson = useCallback(async (courseId: string, level: Level, lessonNumber: number) => {
    setLessonError(null);
    const cached = getCachedLesson(courseId, level, lessonNumber);
    if (cached) {
      setCurrentLesson(cached);
      setCurrentLessonNumber(lessonNumber);
      setCurrentSectionIndex(0);
      setRevealedHints({});
      setViewState('lessonView');
      return;
    }
    setIsLoadingLesson(true);
    setViewState('lessonView');
    try {
      const course = COURSES.find(c => c.id === courseId);
      if (!course) throw new Error('Course not found');
      const topicId = topicMap[course.name];
      if (!topicId) throw new Error('Topic not loaded');
      const { data: lesson } = await apiClient.get<Lesson>(
        `/lessons/topic/${topicId}?level=${encodeURIComponent(level)}&lessonNumber=${lessonNumber}`
      );
      setCachedLesson(courseId, level, lessonNumber, lesson);
      setCurrentLesson(lesson);
      setCurrentLessonNumber(lessonNumber);
      setCurrentSectionIndex(0);
      setRevealedHints({});
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setLessonError('Preparing content...');
      } else {
        setLessonError('Could not load. Try again.');
      }
      setCurrentLesson(null);
    } finally {
      setIsLoadingLesson(false);
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
    if (!selectedCourseId) return;
    setSelectedLevel(level);
    const nextLesson = getNextLessonNumber(selectedCourseId, level);
    setCurrentLessonNumber(nextLesson);
    preloadLevel(selectedCourseId, level);
    loadLesson(selectedCourseId, level, nextLesson);
  }, [selectedCourseId, getNextLessonNumber, loadLesson, preloadLevel]);

  const handleRestartClick = useCallback((courseId: string, level: string) => {
    setRestartTarget({ courseId, level: level as Level });
    setIsRestartModalOpen(true);
  }, []);

  const handleRestartLevel = useCallback(() => {
    if (!restartTarget) return;
    const { courseId, level } = restartTarget;
    resetDoneLessons(courseId, level);
    setRefreshKey(k => k + 1);
    setIsRestartModalOpen(false);
    setRestartTarget(null);
    handleLevelSelect(level);
  }, [restartTarget, handleLevelSelect]);

  const handleLevelTabClick = useCallback((level: Level) => {
    if (!selectedCourseId) return;
    if (level === selectedLevel) return;
    setSelectedLevel(level);
    setCurrentLesson(null);
    setCurrentSectionIndex(0);
    setIsLoadingLesson(true);
    const nextLesson = getNextLessonNumber(selectedCourseId, level);
    setCurrentLessonNumber(nextLesson);
    preloadLevel(selectedCourseId, level);
    loadLesson(selectedCourseId, level, nextLesson);
  }, [selectedCourseId, selectedLevel, getNextLessonNumber, loadLesson, preloadLevel]);

  const handleLessonComplete = useCallback(() => {
    if (!selectedCourseId) return;
    setDoneLesson(selectedCourseId, selectedLevel, currentLessonNumber);
    setRefreshKey(k => k + 1);
    const done = getDoneLessons(selectedCourseId, selectedLevel);
    if (done.length >= 10) {
      setIsCompletionModalOpen(true);
    } else {
      handleLevelSelect(selectedLevel);
    }
  }, [selectedCourseId, selectedLevel, currentLessonNumber, handleLevelSelect]);

  const handleNextLevel = useCallback(() => {
    setIsCompletionModalOpen(false);
    const idx = LEVELS.indexOf(selectedLevel);
    if (idx < LEVELS.length - 1) {
      handleLevelSelect(LEVELS[idx + 1]);
    }
  }, [selectedLevel, handleLevelSelect]);

  const handlePrevious = useCallback(() => {
    setCurrentSectionIndex(p => Math.max(0, p - 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNext = useCallback(() => {
    if (!currentLesson) return;
    const max = parseSections(currentLesson).length - 1;
    const nextIndex = Math.min(max, currentSectionIndex + 1);
    setCurrentSectionIndex(nextIndex);
    setTimeout(() => {
      const nextEl = document.getElementById(`section-${nextIndex}`);
      nextEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [currentLesson, currentSectionIndex]);

  const sections = currentLesson ? parseSections(currentLesson) : [];
  const isLastLevel = selectedLevel === 'advanced';
  const displayTitle = LESSON_TITLES[selectedLevel]?.[currentLessonNumber - 1] ?? '';

  return {
    viewState, selectedCourseId, selectedCourse, selectedLevel,
    currentLessonNumber, currentLesson, currentSectionIndex,
    isLoadingLesson, lessonError, isCompletionModalOpen,
    revealedHints, sections, scrollRef,
    doneLessons, completionCounts, levelsDone, isLastLevel,
    displayTitle,
    handleCourseSelect, handleLevelSelect, handleLevelTabClick,
    handleLessonComplete, handlePrevious, handleNext,
    handleNextLevel,
    setIsCompletionModalOpen,
    isRestartModalOpen, restartTarget,
    handleRestartClick, handleRestartLevel,
    setIsRestartModalOpen,
    loadLesson,
    handleHintReveal: (i: number) => setRevealedHints(p => ({ ...p, [i]: (p[i] ?? 0) + 1 })),
    handleOpenInEditor: (prompt: string, hints: string[]) => {
      const exerciseContext = {
        lessonTitle: currentLesson?.title ?? '',
        language: selectedCourse?.name ?? '',
        exercisePrompt: prompt,
        hints,
        courseId: selectedCourseId ?? '',
        level: selectedLevel,
        lessonNumber: currentLessonNumber,
      };
      const encoded = encodeURIComponent(JSON.stringify(exerciseContext));
      navigate(`/practice?exercise=${encoded}`);
    },
    handleStepClick: (i: number) => { if (i <= currentSectionIndex) setCurrentSectionIndex(i); },
  };
}
