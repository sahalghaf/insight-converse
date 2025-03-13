
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Conversation, Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { paths } from '@/config/api-paths';
import { toast } from '@/components/ui/use-toast';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:9800';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const initialConversation: Conversation = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return [initialConversation];
  });
  
  const [activeConversationId, setActiveConversationId] = useState<string>(conversations[0].id);

  const activeConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    return newConversation;
  }, []);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { ...conv, title, updatedAt: Date.now() } 
          : conv
      )
    );
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);
      if (id === activeConversationId && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        const newConv = {
          id: uuidv4(),
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return [newConv];
      }
      return filtered;
    });
  }, [activeConversationId]);

  // Update a message in the active conversation
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversationId 
          ? { 
              ...conv, 
              messages: conv.messages.map(msg => 
                msg.id === messageId 
                  ? { ...msg, ...updates } 
                  : msg
              ),
            } 
          : conv
      )
    );
  }, [activeConversationId]);

  // Poll for message processing status
  const pollMessageStatus = useCallback(async (requestId: string, placeholderId: string) => {
    try {
      const pollInterval = setInterval(async () => {
        const response = await fetch(`${API_BASE_URL}${paths.CHAT_STATUS_API}/${requestId}`);
        
        if (!response.ok) {
          clearInterval(pollInterval);
          throw new Error('Failed to poll message status');
        }
        
        const data = await response.json();
        
        // Update processing stage
        if (data.status === 'processing') {
          updateMessage(placeholderId, { processingStage: data.stage });
        } else if (data.status === 'complete') {
          clearInterval(pollInterval);
          
          // Fetch the complete response
          const responseData = await fetchResponseData(requestId);
          
          // Replace placeholder with actual response
          updateMessage(placeholderId, { 
            ...responseData,
            isLoading: false, 
            processingStage: undefined
          });
        }
      }, 1500); // Poll every 1.5 seconds
      
      // Clean up interval after 2 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 120000); // 2 minutes
      
      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Error polling message status:', error);
      updateMessage(placeholderId, { 
        content: 'Sorry, there was an error processing your request.', 
        isLoading: false,
        processingStage: undefined
      });
    }
  }, [updateMessage]);

  // Fetch complete response data
  const fetchResponseData = useCallback(async (requestId: string): Promise<Message> => {
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
  }, []);

  // Fetch analysis data
  const fetchAnalysisData = useCallback(async (messageId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}${paths.ANALYSIS_API}/${messageId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis data');
      }
      
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    // Create placeholder for assistant message
    const placeholderMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true,
      processingStage: 'Contemplating...',
    };
    
    // Update conversation with user message and placeholder
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversationId 
          ? { 
              ...conv, 
              messages: [...conv.messages, userMessage, placeholderMessage],
              updatedAt: Date.now(),
              // Set a title based on the first user message if it's the first message
              title: conv.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : conv.title
            } 
          : conv
      )
    );
    
    try {
      // Send the message to the chat API
      const response = await fetch(`${API_BASE_URL}${paths.CHAT_API}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          conversationId: activeConversationId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      const { requestId } = data;
      
      // Update placeholder with request ID
      updateMessage(placeholderMessage.id, { 
        requestId,
        processingStage: data.stage
      });
      
      // Start polling for status updates
      pollMessageStatus(requestId, placeholderMessage.id);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Update placeholder with error message
      updateMessage(placeholderMessage.id, { 
        content: 'Sorry, there was an error sending your message. Please try again.', 
        isLoading: false,
        processingStage: undefined
      });
    }
  }, [activeConversationId, updateMessage, pollMessageStatus]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage
  };
}
