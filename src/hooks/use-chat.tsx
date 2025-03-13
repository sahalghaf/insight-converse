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
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  // Fetch a specific conversation with its messages
  const fetchConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const data = await response.json();
      
      // Update the conversation in state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...data } : conv
        )
      );
      
      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversation. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(async (title = 'New Conversation') => {
    try {
      setIsLoading(true);
      
      // Create conversation on server
      const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation: Conversation = await response.json();
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // Fallback to local creation if API fails
      const fallbackConversation: Conversation = {
        id: uuidv4(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      setConversations(prev => [fallbackConversation, ...prev]);
      setActiveConversationId(fallbackConversation.id);
      
      toast({
        title: "Warning",
        description: "Created conversation locally due to server error.",
        variant: "default",
      });
      
      return fallbackConversation;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConversationTitle = useCallback(async (
    id: string, 
    title: string, 
    updateLocalFirst = true // Flag to control update order
  ) => {
    if (!title.trim()) return;
    
    // Update local state first for immediate feedback if specified
    if (updateLocalFirst) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id 
            ? { 
                ...conv, 
                title, 
                updatedAt: Date.now(),
                isGeneratingTitle: false 
              } 
            : conv
        )
      );
    }
    
    try {
      setIsLoading(true);
      
      // Update conversation on server
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
      
      const updatedConversation = await response.json();
      
      // Update local state if we didn't do it already or sync with server timestamp
      if (!updateLocalFirst) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === id 
              ? { 
                  ...conv, 
                  title: updatedConversation.title, 
                  updatedAt: updatedConversation.updatedAt,
                  isGeneratingTitle: false
                } 
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
      
      // Only show error if we didn't already update locally
      if (!updateLocalFirst) {
        toast({
          title: "Warning",
          description: "Failed to update conversation title on server.",
          variant: "default",
        });
      }
      
      // Always make sure we're not stuck in generating state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id && conv.isGeneratingTitle
            ? { ...conv, isGeneratingTitle: false } 
            : conv
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      
      // Delete conversation on server
      const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // Update local state
      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== id);
        if (id === activeConversationId && filtered.length > 0) {
          setActiveConversationId(filtered[0].id);
        } else if (filtered.length === 0) {
          // Create a new conversation if all were deleted
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
    } catch (error) {
      console.error('Error deleting conversation:', error);
      
      // Fallback to local deletion
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
      
      toast({
        title: "Warning",
        description: "Deleted conversation locally due to server error.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId]);

  // Fix/generate a topic based on the conversation content
  const fixConversationTopic = useCallback(async (conversationId: string, message: string) => {
    // 1. Optimistic update - Show a temporary indication right away
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title: "Generating title...", isGeneratingTitle: true } 
          : conv
      )
    );
    
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
      
      // 2. Smooth transition to the actual title
      if (data.title) {
        // Update server first
        await updateConversationTitle(conversationId, data.title, false);
        
        // Then update local state with animation flag
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { 
                  ...conv, 
                  title: data.title, 
                  isGeneratingTitle: false,
                  titleUpdated: true // Flag for animation
                } 
              : conv
          )
        );
        
        // Reset animation flag after transition
        setTimeout(() => {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversationId 
                ? { ...conv, titleUpdated: false } 
                : conv
            )
          );
        }, 2000);
        
        return data.title;
      }
      
      throw new Error('No title returned from API');
    } catch (error) {
      console.error('Error fixing topic:', error);
      
      // 3. Fallback to a generic title on error
      const fallbackTitle = `Chat ${new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}`;
      
      updateConversationTitle(conversationId, fallbackTitle);
      return fallbackTitle;
    }
  }, [updateConversationTitle]);

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

  // Submit feedback for a message
  const submitMessageFeedback = useCallback(async (messageId: string, feedback: 'helpful' | 'unhelpful', comment?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${paths.FEEDBACK_API}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          feedback,
          comment
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      // Update message locally
      updateMessage(messageId, { 
        feedbackSubmitted: feedback,
        feedbackComment: comment
      });
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback",
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateMessage]);

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
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === activeConversationId 
          ? { 
              ...conv, 
              messages: [...conv.messages, userMessage, placeholderMessage],
              updatedAt: Date.now(),
            } 
          : conv
      );
      
      // Check if this is the first message and generate a title
      const activeConv = updated.find(conv => conv.id === activeConversationId);
      if (activeConv && activeConv.messages.length === 2) {
        // Only user message and placeholder, meaning this is the first real message
        fixConversationTopic(activeConversationId, content);
      }
      
      return updated;
    });
    
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
  }, [activeConversationId, updateMessage, pollMessageStatus, fixConversationTopic]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    fetchConversation,
    sendMessage,
    submitMessageFeedback
  };
}
