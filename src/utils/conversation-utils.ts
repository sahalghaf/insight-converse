
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '@/types/chat';

export function createEmptyConversation(title = 'New Conversation'): Conversation {
  return {
    id: uuidv4(),
    title,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createUserMessage(content: string): Message {
  return {
    id: uuidv4(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
}

export function createAssistantPlaceholder(stage = 'Contemplating...'): Message {
  return {
    id: uuidv4(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isLoading: true,
    processingStage: stage,
  };
}

export function isConversationEmpty(conversation: Conversation | undefined): boolean {
  if (!conversation) return true;
  
  return !conversation.messages.some(
    msg => msg.role === 'user' && msg.content && msg.content.trim() !== ''
  );
}

export function getDefaultTitle(): string {
  return `Chat ${new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })}`;
}
