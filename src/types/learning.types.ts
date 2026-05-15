export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface LessonSection {
  type: 'explanation' | 'example' | 'tip' | 'exercise';
  title: string;
  content?: string;
  code?: string;
  prompt?: string;
  hints?: string[];
}

export interface Lesson {
  id: string;
  topicId?: string;
  language: string;
  level: string;
  lessonNumber: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  contentJson: string;
}

export function parseSections(lesson: Lesson): LessonSection[] {
  try {
    const parsed = JSON.parse(lesson.contentJson);
    return parsed.sections ?? [];
  } catch {
    return [];
  }
}
