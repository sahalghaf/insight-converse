
export interface WebSocketMessage {
  type?: string;
  status?: 'processing' | 'complete' | 'error';
  stage?: string;
  content?: string;
  message?: string;
  visuals?: any[];
  tables?: any[];
  requestId?: string;
  timestamp?: number;
}

export interface PingMessage {
  type: "ping";
  timestamp: number;
  requestId?: string;
}
