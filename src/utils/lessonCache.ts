import type { Lesson } from '../types/learning.types';

const LESSON_PREFIX = 'aict_lesson_';
const DONE_PREFIX = 'aict_done_';
const BOOKMARK_PREFIX = 'aict_bookmark_';

export function getCachedLesson(courseId: string, level: string, lessonNumber: number): Lesson | null {
  try {
    const raw = localStorage.getItem(`${LESSON_PREFIX}${courseId}_${level}_${lessonNumber}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedLesson(courseId: string, level: string, lessonNumber: number, lesson: Lesson): void {
  try {
    localStorage.setItem(`${LESSON_PREFIX}${courseId}_${level}_${lessonNumber}`, JSON.stringify(lesson));
  } catch {}
}

export function getDoneLessons(courseId: string, level: string): number[] {
  try {
    const raw = localStorage.getItem(`${DONE_PREFIX}${courseId}_${level}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setDoneLesson(courseId: string, level: string, lessonNumber: number): void {
  try {
    const key = `${DONE_PREFIX}${courseId}_${level}`;
    const current = getDoneLessons(courseId, level);
    if (!current.includes(lessonNumber)) {
      current.push(lessonNumber);
      localStorage.setItem(key, JSON.stringify(current));
    }
  } catch {}
}

export function isBookmarked(courseId: string, level: string, lessonNumber: number): boolean {
  try {
    return localStorage.getItem(`${BOOKMARK_PREFIX}${courseId}_${level}_${lessonNumber}`) === 'true';
  } catch {
    return false;
  }
}

export function setBookmark(courseId: string, level: string, lessonNumber: number, value: boolean): void {
  try {
    localStorage.setItem(`${BOOKMARK_PREFIX}${courseId}_${level}_${lessonNumber}`, String(value));
  } catch {}
}
