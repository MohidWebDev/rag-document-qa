export interface SourceCitation {
  id: number;
  docName: string;
  page: number;
  section: string;
  snippet: string;
  matchScore: number;
  matchTag: 'High Match' | 'Medium Match';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  senderName: string;
  timestamp: string;
  content: string;
  citations?: SourceCitation[];
  groundingScore?: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  sizeFormatted: string;
  date: string;
  type: 'pdf' | 'md' | 'txt';
  bytes: number;
}

export type NavTab = 'research-chat' | 'document-corpus' | 'citations-sources' | 'analytics-scope';

export type RetrievalScope = string;

export interface PromptArchetype {
  id: string;
  title: string;
  iconName: 'file-text' | 'calendar' | 'lightbulb';
  description: string;
  sampleQuery: string;
}
