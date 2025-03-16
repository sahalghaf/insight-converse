
import { Message } from '@/types/chat';
import { paths } from '@/config/api-paths';
import { toast } from '@/components/ui/use-toast';

// Base URL for API calls
export const API_BASE_URL = 'http://localhost:9800';

export async function fetchConversationById(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversation:', error);
    toast({
      title: "Error",
      description: "Failed to fetch conversation. Please try again.",
      variant: "destructive",
    });
    return null;
  }
}

export async function createConversationOnServer(id: string, title: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id,
        title 
      }),
    });
    
    if (!response.ok) {
      console.warn('Could not create conversation on server, using local version');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Could not create conversation on server, using local version', error);
    return null;
  }
}

export async function updateConversationTitleOnServer(id: string, title: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update conversation title');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating conversation title:', error);
    return null;
  }
}

export async function deleteConversationOnServer(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
}

export async function fixConversationTopicOnServer(conversationId: string, message: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.FIX_TOPIC_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        message,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fix topic');
    }
    
    const data = await response.json();
    if (data && data.title) {
      return data.title;
    } else {
      throw new Error('No title returned from API');
    }
  } catch (error) {
    console.error('Error fixing topic:', error);
    return null;
  }
}

export async function fetchResponseData(requestId: string): Promise<Message> {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.CHAT_RESPONSE_API}/${requestId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch response data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching response data:', error);
    throw error;
  }
}

export async function sendMessageToApi(content: string, conversationId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${paths.CHAT_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        conversationId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message to API:', error);
    throw error;
  }
}
