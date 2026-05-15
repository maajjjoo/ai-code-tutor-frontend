export interface Course {
  id: string;
  name: string;
  language: string;
  description: string;
  icon: string;
}

export const COURSES: Course[] = [
  { id: 'python',     name: 'Python',     language: 'Python',     description: 'Learn Python from scratch',     icon: 'Py' },
  { id: 'java',       name: 'Java',       language: 'Java',       description: 'Learn Java from scratch',       icon: 'Jv' },
  { id: 'javascript', name: 'JavaScript', language: 'JavaScript', description: 'Learn JavaScript from scratch', icon: 'JS' },
  { id: 'typescript', name: 'TypeScript', language: 'TypeScript', description: 'Learn TypeScript from scratch', icon: 'TS' },
];

export const LANG_STYLES: Record<string, { bg: string; color: string }> = {
  Python:     { bg: '#E6F1FB', color: '#0C447C' },
  Java:       { bg: '#FAEEDA', color: '#854F0B' },
  JavaScript: { bg: '#FEFCE8', color: '#854D0E' },
  TypeScript: { bg: '#E6F1FB', color: '#1D4ED8' },
};
