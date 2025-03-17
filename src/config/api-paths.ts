
/**
 * API endpoint configuration
 * These can be modified based on environment
 */

// API base URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.intento.freston.io';

// API endpoint paths (without the base URL)
export const paths = {
  CHAT_API: '/api/chat',
  CHAT_STATUS_API: '/api/chat/status',
  CHAT_RESPONSE_API: '/api/chat/response',
  CONVERSATION_API: '/api/conversations',
  FIX_TOPIC_API: '/api/conversations/fixTopic',
  FEEDBACK_API: '/api/feedback',
};
