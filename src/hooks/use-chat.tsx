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
  const wsRef = useRef<WebSocket | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  const activeConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeConversationId]);

  const isConversationEmpty = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return true;
    
    const hasUserMessages = conversation.messages.some(
      msg => msg.role === 'user' && msg.content && msg.content.trim() !== ''
    );
    
    return !hasUserMessages;
  }, [conversations]);

  const fetchConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const data = await response.json();
      
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
      
      const newId = uuidv4();
      const newConversation: Conversation = {
        id: newId,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newId);
      
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
    updateLocalFirst = true
  ) => {
    if (!title.trim()) return;
    
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
      
      if (!updateLocalFirst) {
        toast({
          title: "Warning",
          description: "Failed to update conversation title on server.",
          variant: "default",
        });
      }
      
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
      
      const response = await fetch(`${API_BASE_URL}${paths.CONVERSATION_API}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
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
    } catch (error) {
      console.error('Error deleting conversation:', error);
      
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

  const fixConversationTopic = useCallback(async (conversationId: string, message: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title: "Generating title...", isGeneratingTitle: true } 
          : conv
      )
    );
    
    try {
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
        newTitle = `Chat ${new Date().toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        })}`;
      }
      
      await updateConversationTitle(conversationId, newTitle);
      return newTitle;
    } catch (error) {
      console.error('Error in fixConversationTopic:', error);
      
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

  const handleWebSocketChat = useCallback((
    placeholderId: string,
    requestId: string,
    conversationId: string
  ) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    let pingInterval: NodeJS.Timeout | null = null;

    try {
      const wsUrl = new URL(paths.WS_CHAT_REQUEST(requestId));
      wsUrl.searchParams.append('conversation_id', conversationId);
      const ws = new WebSocket(wsUrl.toString());
      
      wsRef.current = ws;
      activeRequestIdRef.current = requestId;

      ws.onopen = (event) => {
        console.log('WebSocket connection established for request:', requestId, event);
        
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ 
                type: "ping", 
                timestamp: Date.now(),
                requestId
              }));
              console.log('Ping sent for request:', requestId);
            } catch (pingError) {
              console.error('Error sending ping:', pingError);
            }
          } else {
            if (pingInterval) clearInterval(pingInterval);
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.type === 'pong') {
            console.log('Received pong response at:', new Date().toISOString());
            return;
          }

          if (data.status === 'processing') {
            updateMessage(placeholderId, { processingStage: data.stage || 'Processing...' });
          } else if (data.status === 'complete') {
            updateMessage(placeholderId, {
              content: data.content || '',
              visuals: data.visuals || [],
              tables: data.tables || [],
              isLoading: false,
              processingStage: undefined
            });

            if (pingInterval) {
              clearInterval(pingInterval);
              pingInterval = null;
            }

            ws.close();
            wsRef.current = null;
            activeRequestIdRef.current = null;
          } else if (data.status === 'error') {
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
            
            if (pingInterval) {
              clearInterval(pingInterval);
              pingInterval = null;
            }
            
            ws.close();
            wsRef.current = null;
            activeRequestIdRef.current = null;
          }
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError, 'Raw data:', event.data);
          updateMessage(placeholderId, {
            content: 'Error processing response from server.',
            isLoading: false,
            processingStage: undefined
          });
          
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }
          
          ws.close();
          wsRef.current = null;
          activeRequestIdRef.current = null;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error details:', error);
        console.error('WebSocket connection URL:', wsUrl.toString());
        console.error('WebSocket state:', ws.readyState);
        
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
        
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        
        pollMessageStatus(requestId, placeholderId);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason, 'For request:', requestId);
        
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        
        if (activeRequestIdRef.current === requestId) {
          setConversations(prev => {
            const activeConv = prev.find(conv => conv.id === conversationId);
            const placeholderMsg = activeConv?.messages.find(msg => msg.id === placeholderId);
            
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
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          wsRef.current = null;
          activeRequestIdRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      
      pollMessageStatus(requestId, placeholderId);
      
      return () => {};
    }
  }, [activeConversationId, updateMessage]);

  const pollMessageStatus = useCallback(async (requestId: string, placeholderId: string) => {
    try {
      const pollInterval = setInterval(async () => {
        const response = await fetch(`${API_BASE_URL}${paths.CHAT_STATUS_API}/${requestId}`);
        
        if (!response.ok) {
          clearInterval(pollInterval);
          throw new Error('Failed to poll message status');
        }
        
        const data = await response.json();
        
        if (data.status === 'processing') {
          updateMessage(placeholderId, { processingStage: data.stage });
        } else if (data.status === 'complete') {
          clearInterval(pollInterval);
          
          const responseData = await fetchResponseData(requestId);
          
          updateMessage(placeholderId, { 
            ...responseData,
            isLoading: false, 
            processingStage: undefined
          });
        }
      }, 1500);
      
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 120000);
      
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
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      
      const placeholderMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isLoading: true,
        processingStage: 'Contemplating...',
      };
      
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
        
        if (activeConversationId && activeConversationId === conversations[0].id) {
          fixConversationTopic(activeConversationId, content).catch(console.error);
        }
        
        return updated;
      });
      
      try {
        const wsUrl = new URL(paths.WS_CHAT);
        wsUrl.searchParams.append('conversation_id', activeConversationId);
        const wsConnection = new WebSocket(wsUrl.toString());

        let requestId: string | null = null;
        let trackingSetUp = false;
        let pingInterval: NodeJS.Timeout | null = null;
        
        wsConnection.onopen = (event) => {
          console.log('Initial WebSocket connection opened:', event);
          
          pingInterval = setInterval(() => {
            if (wsConnection.readyState === WebSocket.OPEN) {
              try {
                wsConnection.send(JSON.stringify({ 
                  type: "ping", 
                  timestamp: Date.now() 
                }));
                console.log('Ping sent on initial connection');
              } catch (pingError) {
                console.error('Error sending ping on initial connection:', pingError);
              }
            } else {
              if (pingInterval) clearInterval(pingInterval);
            }
          }, 30000);
          
          wsConnection.send(JSON.stringify({
            content,
            conversationId: activeConversationId
          }));
        };
        
        const wsTimeout = setTimeout(() => {
          if (wsConnection.readyState !== WebSocket.OPEN) {
            console.log('WebSocket connection timeout. Falling back to HTTP.');
            
            if (pingInterval) {
              clearInterval(pingInterval);
              pingInterval = null;
            }
            
            wsConnection.close();
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        }, 3000);
        
        wsConnection.onmessage = (event) => {
          clearTimeout(wsTimeout);
          try {
            const data = JSON.parse(event.data);
            
            if (data.requestId && !requestId) {
              requestId = data.requestId;
              console.log('Received request ID via WebSocket:', requestId);
              
              if (!trackingSetUp) {
                trackingSetUp = true;
                handleWebSocketChat(
                  placeholderMessage.id, 
                  requestId, 
                  activeConversationId
                );
                
                setTimeout(() => {
                  if (wsConnection.readyState === WebSocket.OPEN) {
                    wsConnection.close();
                  }
                }, 100);
              }
            }
          } catch (err) {
            console.error('Error processing WebSocket init message:', err, 'Raw data:', event.data);
            
            if (pingInterval) {
              clearInterval(pingInterval);
              pingInterval = null;
            }
            
            wsConnection.close();
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        };
        
        wsConnection.onerror = (error) => {
          clearTimeout(wsTimeout);
          console.error('WebSocket connection error details:', error);
          console.error('WebSocket connection URL:', wsUrl.toString());
          console.error('WebSocket state:', wsConnection.readyState);
          
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }
          
          sendMessageViaHttp(content, placeholderMessage.id);
        };
        
        wsConnection.onclose = (event) => {
          clearTimeout(wsTimeout);
          console.log('Initial WebSocket connection closed:', event.code, event.reason);
          
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }
          
          if (!requestId && !trackingSetUp) {
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        };
      } catch (wsError) {
        console.error('Error setting up initial WebSocket:', wsError);
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
      
      updateMessage(placeholderId, { 
        requestId,
        processingStage: data.stage || 'Processing...'
      });
      
      try {
        handleWebSocketChat(placeholderId, requestId, activeConversationId);
      } catch (wsError) {
        console.error('Error with WebSocket after HTTP request:', wsError);
        pollMessageStatus(requestId, placeholderId);
      }
    } catch (apiError) {
      console.error('Error sending message to API:', apiError);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
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
