export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  files?: FileDisplay[];
}

export interface ToolCall {
  type: 'search' | 'edit' | 'read';
  status: 'pending' | 'completed' | 'error';
  query?: string;
  filePath?: string;
}

export interface FileDisplay {
  path: string;
  content: string;
  isOpen: boolean;
}

export interface ContextPill {
  id: string;
  type: 'file' | 'image';
  name: string;
  path?: string;
}

export type ChatMode = 'text' | 'vibe';