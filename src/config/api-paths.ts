
/**
 * API endpoint configuration
 * These can be modified based on environment
 */

// Simplify by using relative paths - backend server is at localhost:9800
export const paths = {
  CHAT_API: '/api/chat',
  CHAT_STATUS_API: '/api/chat/status',
  CHAT_RESPONSE_API: '/api/chat/response',
  CONVERSATION_API: '/api/conversations',
  FIX_TOPIC_API: '/api/conversations/fixTopic',
  FEEDBACK_API: '/api/feedback',
  WS_CHAT: 'ws://localhost:9800/ws/chat',
  WS_CHAT_REQUEST: (requestId: string) => `ws://localhost:9800/ws/chat/${requestId}`,
};
