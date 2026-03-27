import type { Language } from './index';

export interface VFile { id: string; type: 'file'; name: string; content: string; language: Language; parentId: string | null; }
export interface VFolder { id: string; type: 'folder'; name: string; parentId: string | null; open: boolean; }
export type VNode = VFile | VFolder;

export function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
export function detectLang(name: string): Language {
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
  if (name.endsWith('.cpp') || name.endsWith('.h')) return 'cpp';
  return 'javascript';
}
