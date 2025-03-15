
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChartData {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'correlation';
  data: any;
  options?: any;
  title?: string;
  description?: string;
}

export interface TableData {
  columns: Array<{
    id: string;
    header: string;
    accessorKey?: string;
  }>;
  data: any[];
  pagination?: {
    pageSize: number;
    pageIndex: number;
    totalPages: number;
  };
  title?: string;
  description?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  visuals?: ChartData[];
  tables?: TableData[];
  isLoading?: boolean;
  processingStage?: string;
  requestId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isGeneratingTitle?: boolean;
  titleUpdated?: boolean;
}
