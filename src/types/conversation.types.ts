export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  projectId: string | null;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}
