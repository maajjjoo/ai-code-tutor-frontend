export interface Course {
  id: string;
  name: string;
  topicId: string;
  color: string;
  bgColor: string;
  letters: string;
  description: string;
}

export const COURSES: Course[] = [
  { id: 'python',     name: 'Python',     topicId: 'python-basics-topic-id',     color: '#3B82F6', bgColor: '#EFF6FF', letters: 'Py', description: 'Master Python from fundamentals to advanced topics with hands-on exercises and real-world examples.' },
  { id: 'java',       name: 'Java',       topicId: 'java-basics-topic-id',       color: '#F59E0B', bgColor: '#FFFBEB', letters: 'Jv', description: 'Learn Java programming with object-oriented principles, industry patterns, and practical projects.' },
  { id: 'javascript', name: 'JavaScript', topicId: 'javascript-basics-topic-id', color: '#EAB308', bgColor: '#FEFCE8', letters: 'JS', description: 'Explore JavaScript from syntax basics to modern ES6+ features and functional programming.' },
  { id: 'typescript', name: 'TypeScript', topicId: 'typescript-basics-topic-id', color: '#6366F1', bgColor: '#EEF2FF', letters: 'TS', description: 'Build type-safe applications with TypeScript covering advanced types, generics, and tooling.' },
];
