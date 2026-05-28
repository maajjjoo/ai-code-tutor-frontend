export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface LessonSection {
  type: 'explanation' | 'example' | 'tip' | 'exercise';
  title: string;
  content?: string;
  code?: string;
  prompt?: string;
  hints?: string[];
  wrongCode?: string;
  rightCode?: string;
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

function cleanCode(code: string): string {
  if (!code) return '';
  return code
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

export function parseSections(lesson: Lesson): LessonSection[] {
  try {
    const parsed = JSON.parse(lesson.contentJson);
    const raw: LessonSection[] = Array.isArray(parsed) ? parsed : (parsed.sections ?? []);
    return raw.map(section => ({
      ...section,
      code: section.code ? cleanCode(section.code) : undefined,
      wrongCode: section.wrongCode ? cleanCode(section.wrongCode) : undefined,
      rightCode: section.rightCode ? cleanCode(section.rightCode) : undefined,
    }));
  } catch {
    return [];
  }
}
