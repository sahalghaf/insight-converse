import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  // WebSocket connection references
  const wsRef = useRef<WebSocket | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  const activeConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  // Clean up WebSocket connection on unmount or conversation change
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeConversationId]);

  // Add a function to check if a conversation is empty (has no user messages)
  const isConversationEmpty = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return true;
    
    // Check for user messages (ignore placeholder/loading messages)
    const hasUserMessages = conversation.messages.some(
      msg => msg.role === 'user' && msg.content && msg.content.trim() !== ''
    );
    
    return !hasUserMessages;
  }, [conversations]);

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
      
      // Create a new conversation locally first to ensure we have a valid state
      const newId = uuidv4();
      const newConversation: Conversation = {
        id: newId,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // Update state with the new conversation
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newId);
      
      // Then try to create on server
      try {
        const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: newId,
            title 
          }),
        });
        
        if (!response.ok) {
          console.warn('Could not create conversation on server, using local version');
          return newConversation;
        }
        
        const serverConversation = await response.json();
        
        // Update with server data if available
        setConversations(prev => 
          prev.map(conv => 
            conv.id === newId ? { ...serverConversation } : conv
          )
        );
        
        return serverConversation;
      } catch (error) {
        console.warn('Could not create conversation on server, using local version', error);
        return newConversation;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      toast({
        title: "Warning",
        description: "Created conversation locally due to an error.",
        variant: "default",
      });
      
      // Ensure we always have a local fallback
      const fallbackConversation: Conversation = {
        id: uuidv4(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      setConversations(prev => [fallbackConversation, ...prev]);
      setActiveConversationId(fallbackConversation.id);
      
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
      // Safely handle API request
      let newTitle = '';
      
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
          newTitle = data.title;
        } else {
          throw new Error('No title returned from API');
        }
      } catch (apiError) {
        console.error('Error fixing topic:', apiError);
        // Generate a fallback title
        newTitle = `Chat ${new Date().toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        })}`;
      }
      
      // Update conversation title with the new title
      await updateConversationTitle(conversationId, newTitle);
      return newTitle;
    } catch (error) {
      console.error('Error in fixConversationTopic:', error);
      
      // Final fallback to ensure we always update the title
      const fallbackTitle = `Chat ${new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}`;
      
      updateConversationTitle(conversationId, fallbackTitle);
      return fallbackTitle;
    }
  }, []);

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

  // WebSocket handler for chat messages
  const handleWebSocketChat = useCallback((
    placeholderId: string,
    requestId: string,
    conversationId: string
  ) => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // Create a new WebSocket connection for this specific request
      const wsUrl = `${paths.WS_CHAT_REQUEST(requestId)}?conversation_id=${conversationId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      activeRequestIdRef.current = requestId;

      ws.onopen = () => {
        console.log('WebSocket connection established for request:', requestId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.status === 'processing') {
            // Update the placeholder message with the current processing stage
            updateMessage(placeholderId, { processingStage: data.stage || 'Processing...' });
          } else if (data.status === 'complete') {
            // Update with the final message content, visuals, tables
            updateMessage(placeholderId, {
              content: data.content || '',
              visuals: data.visuals || [],
              tables: data.tables || [],
              isLoading: false,
              processingStage: undefined
            });

            // Close the WebSocket as we've received the complete response
            ws.close();
            wsRef.current = null;
            activeRequestIdRef.current = null;
          } else if (data.status === 'error') {
            // Handle error case
            updateMessage(placeholderId, {
              content: data.message || 'Sorry, there was an error processing your request.',
              isLoading: false,
              processingStage: undefined
            });
            
            toast({
              title: "Error",
              description: data.message || "An error occurred while processing your request.",
              variant: "destructive",
            });
            
            ws.close();
            wsRef.current = null;
            activeRequestIdRef.current = null;
          }
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
          updateMessage(placeholderId, {
            content: 'Error processing response from server.',
            isLoading: false,
            processingStage: undefined
          });
          ws.close();
          wsRef.current = null;
          activeRequestIdRef.current = null;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateMessage(placeholderId, {
          content: 'Connection error. Please try again later.',
          isLoading: false,
          processingStage: undefined
        });
        
        toast({
          title: "Connection Error",
          description: "Failed to establish WebSocket connection. Falling back to standard method.",
          variant: "destructive",
        });
        
        // If WebSocket fails, we can fall back to the polling method
        pollMessageStatus(requestId, placeholderId);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        
        // If closed unexpectedly and we were still processing
        if (activeRequestIdRef.current === requestId) {
          // Check if the placeholder still shows loading
          setConversations(prev => {
            const activeConv = prev.find(conv => conv.id === conversationId);
            const placeholderMsg = activeConv?.messages.find(msg => msg.id === placeholderId);
            
            // If still loading, fall back to polling
            if (placeholderMsg?.isLoading) {
              console.log('WebSocket closed while still loading, falling back to polling');
              pollMessageStatus(requestId, placeholderId);
            }
            
            return prev;
          });
          
          activeRequestIdRef.current = null;
        }
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          wsRef.current = null;
          activeRequestIdRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      // Fall back to polling if WebSocket setup fails
      pollMessageStatus(requestId, placeholderId);
      
      return () => {};
    }
  }, [activeConversationId, updateMessage]);

  // Keep the polling implementation as a fallback
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

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
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
          fixConversationTopic(activeConversationId, content).catch(console.error);
        }
        
        return updated;
      });
      
      // Try to use WebSockets first with fallback to HTTP API
      try {
        // Method 1: Try the WebSocket-first approach
        const wsConnection = new WebSocket(`${paths.WS_CHAT}?conversation_id=${activeConversationId}`);
        
        wsConnection.onopen = () => {
          console.log('Initial WebSocket connection opened');
          // Send the message through WebSocket
          wsConnection.send(JSON.stringify({
            content,
            conversationId: activeConversationId
          }));
        };
        
        // Set a timeout to fall back to HTTP if WebSocket is taking too long
        const wsTimeout = setTimeout(() => {
          if (wsConnection.readyState !== WebSocket.OPEN) {
            console.log('WebSocket connection timeout. Falling back to HTTP.');
            wsConnection.close();
            // Fall back to HTTP
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        }, 3000); // 3 second timeout
        
        wsConnection.onmessage = (event) => {
          clearTimeout(wsTimeout);
          try {
            const data = JSON.parse(event.data);
            if (data.requestId) {
              console.log('Received request ID via WebSocket:', data.requestId);
              // Close this initial connection as we'll establish a new one for updates
              wsConnection.close();
              // Set up the WebSocket handler for continuous updates
              handleWebSocketChat(
                placeholderMessage.id, 
                data.requestId, 
                activeConversationId
              );
            }
          } catch (err) {
            console.error('Error processing WebSocket init message:', err);
            wsConnection.close();
            // Fall back to HTTP
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        };
        
        wsConnection.onerror = (error) => {
          clearTimeout(wsTimeout);
          console.error('WebSocket connection error:', error);
          // Fall back to HTTP
          sendMessageViaHttp(content, placeholderMessage.id);
        };
        
        wsConnection.onclose = (event) => {
          clearTimeout(wsTimeout);
          console.log('Initial WebSocket connection closed:', event);
          // Only fall back if we haven't received a request ID
          if (!activeRequestIdRef.current) {
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        };
      } catch (wsError) {
        console.error('Error setting up initial WebSocket:', wsError);
        // Fall back to HTTP
        sendMessageViaHttp(content, placeholderMessage.id);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }, [activeConversationId, updateMessage, pollMessageStatus, fixConversationTopic, handleWebSocketChat]);

  // HTTP fallback method
  const sendMessageViaHttp = useCallback(async (content: string, placeholderId: string) => {
    try {
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
      
      if (!requestId) {
        throw new Error('No request ID returned');
      }
      
      // Update placeholder with request ID
      updateMessage(placeholderId, { 
        requestId,
        processingStage: data.stage || 'Processing...'
      });
      
      // Try WebSocket first for updates, with polling as fallback
      try {
        handleWebSocketChat(placeholderId, requestId, activeConversationId);
      } catch (wsError) {
        console.error('Error with WebSocket after HTTP request:', wsError);
        // Fall back to polling
        pollMessageStatus(requestId, placeholderId);
      }
    } catch (apiError) {
      console.error('Error sending message to API:', apiError);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Update placeholder with error message
      updateMessage(placeholderId, { 
        content: 'Sorry, there was an error sending your message. Please try again.', 
        isLoading: false,
        processingStage: undefined
      });
    }
  }, [activeConversationId, updateMessage, handleWebSocketChat, pollMessageStatus]);

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
    isConversationEmpty
  };
}
