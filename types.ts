
export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

export interface Source {
  id: string;
  title: string;
  uri?: string;
  snippet?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  content: string;
  size: number;
}

export enum RAGMode {
  LONG_CONTEXT = 'LONG_CONTEXT',
  SEARCH_GROUNDING = 'SEARCH_GROUNDING'
}
