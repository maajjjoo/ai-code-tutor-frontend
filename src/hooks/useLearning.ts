import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson, Level } from '../types/learning.types';
import { parseSections } from '../types/learning.types';
import {
  getCachedLesson, setCachedLesson,
  getDoneLessons, setDoneLesson,
  isBookmarked, setBookmark,
} from '../utils/lessonCache';
import { COURSES } from '../data/courses';
import { LESSON_TITLES } from '../data/lessonTitles';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
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
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [bookmarkState, setBookmarkState] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});
  const [topicMap, setTopicMap] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedCourse = useMemo(
    () => COURSES.find(c => c.id === selectedCourseId) ?? null,
    [selectedCourseId],
  );

  const doneLessons = useMemo(
    () => selectedCourseId ? getDoneLessons(selectedCourseId, selectedLevel) : [],
    [selectedCourseId, selectedLevel, refreshKey],
  );

  const bookmarked = useMemo(
    () => selectedCourseId ? isBookmarked(selectedCourseId, selectedLevel, currentLessonNumber) : false,
    [selectedCourseId, selectedLevel, currentLessonNumber, bookmarkState],
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

  const getNextLessonNumber = useCallback((courseId: string, level: Level): number => {
    const done = getDoneLessons(courseId, level);
    if (done.length >= 10) return 10;
    for (let i = 1; i <= 10; i++) {
      if (!done.includes(i)) return i;
    }
    return 1;
  }, []);

  const preloadLevel = useCallback(async (courseId: string, level: Level, targetLessonNumber: number) => {
    const course = COURSES.find(c => c.id === courseId);
    if (!course) { setIsLoadingLesson(false); return; }
    const topicId = topicMap[course.name];
    if (!topicId) { setIsLoadingLesson(false); return; }

    try {
      const token = localStorage.getItem('codetutor_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE}/lessons/topic/${topicId}/level/${level}`,
        { headers },
      );

      if (res.status === 503) {
        setTimeout(() => preloadLevel(courseId, level, targetLessonNumber), 5000);
        return;
      }

      if (!res.ok) throw new Error('Failed to load lessons');

      const lessons: Lesson[] = await res.json();
      lessons.forEach(lesson => {
        setCachedLesson(courseId, level, lesson.lessonNumber, lesson);
      });

      const cached = getCachedLesson(courseId, level, targetLessonNumber);
      if (cached) {
        setCurrentLesson(cached);
        setCurrentLessonNumber(targetLessonNumber);
        setCurrentSectionIndex(0);
        setRevealedHints({});
        setBookmarkState(s => !s);
        setTimeout(() => setBookmarkState(s => !s), 0);
      }
    } catch {
      const cached = getCachedLesson(courseId, level, targetLessonNumber);
      if (cached) {
        setCurrentLesson(cached);
        setCurrentLessonNumber(targetLessonNumber);
        setCurrentSectionIndex(0);
      }
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
    setCurrentLesson(null);
    const nextLesson = getNextLessonNumber(selectedCourseId, level);
    setCurrentLessonNumber(nextLesson);
    setCurrentSectionIndex(0);
    setRevealedHints({});
    setIsLoadingLesson(true);
    setViewState('lessonView');

    const cached = getCachedLesson(selectedCourseId, level, nextLesson);
    if (cached) {
      setCurrentLesson(cached);
      setIsLoadingLesson(false);
    }

    preloadLevel(selectedCourseId, level, nextLesson);
  }, [selectedCourseId, getNextLessonNumber, preloadLevel]);

  const handleLevelTabClick = useCallback((level: Level) => {
    if (!selectedCourseId) return;
    if (level === selectedLevel) return;
    setSelectedLevel(level);
    setCurrentLesson(null);
    setCurrentSectionIndex(0);
    setIsLoadingLesson(true);
    const nextLesson = getNextLessonNumber(selectedCourseId, level);
    setCurrentLessonNumber(nextLesson);
    setRevealedHints({});

    const cached = getCachedLesson(selectedCourseId, level, nextLesson);
    if (cached) {
      setCurrentLesson(cached);
      setIsLoadingLesson(false);
    }

    preloadLevel(selectedCourseId, level, nextLesson);
  }, [selectedCourseId, selectedLevel, getNextLessonNumber, preloadLevel]);

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
    setCurrentSectionIndex(p => Math.min(max, p + 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentLesson]);

  const handleBookmarkToggle = useCallback(() => {
    if (!selectedCourseId) return;
    const newVal = !bookmarked;
    setBookmark(selectedCourseId, selectedLevel, currentLessonNumber, newVal);
    setBookmarkState(s => !s);
  }, [selectedCourseId, selectedLevel, currentLessonNumber, bookmarked]);

  const sections = currentLesson ? parseSections(currentLesson) : [];
  const isLastLevel = selectedLevel === 'advanced';
  const displayTitle = LESSON_TITLES[selectedLevel]?.[currentLessonNumber - 1] ?? '';

  return {
    viewState, selectedCourseId, selectedCourse, selectedLevel,
    currentLessonNumber, currentLesson, currentSectionIndex,
    isLoadingLesson, isCompletionModalOpen,
    bookmarked, revealedHints, sections, scrollRef,
    doneLessons, completionCounts, levelsDone, isLastLevel,
    displayTitle,
    handleCourseSelect, handleLevelSelect, handleLevelTabClick,
    handleLessonComplete, handlePrevious, handleNext,
    handleNextLevel, handleBookmarkToggle,
    setIsCompletionModalOpen,
    handleHintReveal: (i: number) => setRevealedHints(p => ({ ...p, [i]: (p[i] ?? 0) + 1 })),
    handleOpenInEditor: (prompt: string) =>
      navigate(`/practice?exercisePrompt=${encodeURIComponent(prompt)}&language=${encodeURIComponent(selectedCourse?.name ?? '')}`),
    handleStepClick: (i: number) => { if (i <= currentSectionIndex) setCurrentSectionIndex(i); },
  };
}
