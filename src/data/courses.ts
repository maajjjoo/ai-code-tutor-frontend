export interface Course {
  id: string;
  name: string;
  topicId: string;
  color: string;
  bgColor: string;
  letters: string;
}

export const COURSES: Course[] = [
  { id: 'python',     name: 'Python',     topicId: 'python-basics-topic-id',     color: '#3B82F6', bgColor: '#EFF6FF', letters: 'Py' },
  { id: 'java',       name: 'Java',       topicId: 'java-basics-topic-id',       color: '#F59E0B', bgColor: '#FFFBEB', letters: 'Jv' },
  { id: 'javascript', name: 'JavaScript', topicId: 'javascript-basics-topic-id', color: '#EAB308', bgColor: '#FEFCE8', letters: 'JS' },
  { id: 'typescript', name: 'TypeScript', topicId: 'typescript-basics-topic-id', color: '#6366F1', bgColor: '#EEF2FF', letters: 'TS' },
];
