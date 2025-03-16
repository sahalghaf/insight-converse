
/**
 * API endpoint configuration
 * These can be modified based on environment
 */

// Base URL for WebSocket connections
const WS_BASE = 'ws://localhost:9800';

// Simplify by using relative paths - backend server is at localhost:9800
export const paths = {
  CHAT_API: '/api/chat',
  CHAT_STATUS_API: '/api/chat/status',
  CHAT_RESPONSE_API: '/api/chat/response',
  CONVERSATION_API: '/api/conversations',
  FIX_TOPIC_API: '/api/conversations/fixTopic',
  FEEDBACK_API: '/api/feedback',
  // WebSocket endpoints
  WS_CHAT: `${WS_BASE}/ws/chat`,
  WS_CHAT_REQUEST: (requestId: string) => `${WS_BASE}/ws/chat/${requestId}`,
};
