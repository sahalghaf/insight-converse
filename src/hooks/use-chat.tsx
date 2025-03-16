
import { useState, useCallback, useMemo, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { paths } from '@/config/api-paths';
import { toast } from '@/components/ui/use-toast';
import { useWebSocket } from './use-websocket';
import { 
  fetchConversationById, 
  createConversationOnServer, 
  updateConversationTitleOnServer, 
  deleteConversationOnServer,
  fixConversationTopicOnServer,
  sendMessageToApi
} from '@/utils/api-utils';
import { pollMessageStatus } from '@/utils/polling-utils';
import { 
  createEmptyConversation, 
  createUserMessage, 
  createAssistantPlaceholder,
  isConversationEmpty as checkIsConversationEmpty,
  getDefaultTitle
} from '@/utils/conversation-utils';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const initialConversation = createEmptyConversation();
    return [initialConversation];
  });
  
  const [activeConversationId, setActiveConversationId] = useState<string>(conversations[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  const activeConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  // Cleanup WebSocket on conversation change
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const isConversationEmpty = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    return checkIsConversationEmpty(conversation);
  }, [conversations]);

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
    cleanupWebSocket();
    
    try {
      const wsUrl = new URL(paths.WS_CHAT_REQUEST(requestId));
      wsUrl.searchParams.append('conversation_id', conversationId);
      
      const { wsRef: ws } = useWebSocket({
        url: wsUrl.toString(),
        autoConnect: false,
        onOpen: (event) => {
          console.log('WebSocket tracking connection established for request:', requestId, event);
          activeRequestIdRef.current = requestId;
        },
        onMessage: (data) => {
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
            
            activeRequestIdRef.current = null;
          }
        },
        onError: (error) => {
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
          
          // Fall back to polling
          const handlePollStatus = () => {
            const stopPolling = pollMessageStatus(
              requestId,
              (stage) => updateMessage(placeholderId, { processingStage: stage }),
              (responseData) => updateMessage(placeholderId, { 
                ...responseData,
                isLoading: false, 
                processingStage: undefined
              }),
              (error) => {
                console.error('Error polling message status:', error);
                updateMessage(placeholderId, { 
                  content: 'Sorry, there was an error processing your request.', 
                  isLoading: false,
                  processingStage: undefined
                });
              }
            );
            return stopPolling;
          };
          
          handlePollStatus();
        },
        onClose: (event) => {
          console.log('WebSocket tracking connection closed:', event.code, event.reason, 'For request:', requestId);
          
          if (activeRequestIdRef.current === requestId) {
            setConversations(prev => {
              const activeConv = prev.find(conv => conv.id === conversationId);
              const placeholderMsg = activeConv?.messages.find(msg => msg.id === placeholderId);
              
              if (placeholderMsg?.isLoading) {
                console.log('WebSocket closed while still loading, falling back to polling');
                // Fall back to polling
                const handlePollStatus = () => {
                  const stopPolling = pollMessageStatus(
                    requestId,
                    (stage) => updateMessage(placeholderId, { processingStage: stage }),
                    (responseData) => updateMessage(placeholderId, { 
                      ...responseData,
                      isLoading: false, 
                      processingStage: undefined
                    }),
                    (error) => {
                      console.error('Error polling message status:', error);
                      updateMessage(placeholderId, { 
                        content: 'Sorry, there was an error processing your request.', 
                        isLoading: false,
                        processingStage: undefined
                      });
                    }
                  );
                  return stopPolling;
                };
                
                handlePollStatus();
              }
              
              return prev;
            });
            
            activeRequestIdRef.current = null;
          }
        }
      });
      
      wsRef.current = ws.current;
      ws.connect();
      
      return () => ws.disconnect();
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      
      // Fall back to polling
      const handlePollStatus = () => {
        const stopPolling = pollMessageStatus(
          requestId,
          (stage) => updateMessage(placeholderId, { processingStage: stage }),
          (responseData) => updateMessage(placeholderId, { 
            ...responseData,
            isLoading: false, 
            processingStage: undefined
          }),
          (error) => {
            console.error('Error polling message status:', error);
            updateMessage(placeholderId, { 
              content: 'Sorry, there was an error processing your request.', 
              isLoading: false,
              processingStage: undefined
            });
          }
        );
        return stopPolling;
      };
      
      handlePollStatus();
      
      return () => {};
    }
  }, [activeConversationId, updateMessage, cleanupWebSocket]);

  const sendMessageViaHttp = useCallback(async (content: string, placeholderId: string) => {
    try {
      const data = await sendMessageToApi(content, activeConversationId);
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
        
        // Fall back to polling
        pollMessageStatus(
          requestId,
          (stage) => updateMessage(placeholderId, { processingStage: stage }),
          (responseData) => updateMessage(placeholderId, { 
            ...responseData,
            isLoading: false, 
            processingStage: undefined
          }),
          (error) => {
            console.error('Error polling message status:', error);
            updateMessage(placeholderId, { 
              content: 'Sorry, there was an error processing your request.', 
              isLoading: false,
              processingStage: undefined
            });
          }
        );
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
  }, [activeConversationId, updateMessage, handleWebSocketChat]);

  const fetchConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const data = await fetchConversationById(id);
      
      if (data) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === id ? { ...data } : conv
          )
        );
      }
      
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(async (title = 'New Conversation') => {
    try {
      setIsLoading(true);
      
      const newConversation = createEmptyConversation(title);
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      
      try {
        const serverConversation = await createConversationOnServer(newConversation.id, title);
        
        if (serverConversation) {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === newConversation.id ? { ...serverConversation } : conv
            )
          );
          
          return serverConversation;
        }
        
        return newConversation;
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
      
      const fallbackConversation = createEmptyConversation(title);
      
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
      
      const updatedConversation = await updateConversationTitleOnServer(id, title);
      
      if (!updateLocalFirst && updatedConversation) {
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
      
      await deleteConversationOnServer(id);
      
      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== id);
        if (id === activeConversationId && filtered.length > 0) {
          setActiveConversationId(filtered[0].id);
        } else if (filtered.length === 0) {
          const newConv = createEmptyConversation();
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
          const newConv = createEmptyConversation();
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
        newTitle = await fixConversationTopicOnServer(conversationId, message) || '';
      } catch (apiError) {
        console.error('Error fixing topic:', apiError);
        newTitle = getDefaultTitle();
      }
      
      if (!newTitle) {
        newTitle = getDefaultTitle();
      }
      
      await updateConversationTitle(conversationId, newTitle);
      return newTitle;
    } catch (error) {
      console.error('Error in fixConversationTopic:', error);
      
      const fallbackTitle = getDefaultTitle();
      
      updateConversationTitle(conversationId, fallbackTitle);
      return fallbackTitle;
    }
  }, [updateConversationTitle]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      const userMessage = createUserMessage(content);
      const placeholderMessage = createAssistantPlaceholder();
      
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
        
        const { wsRef: ws, send } = useWebSocket({
          url: wsUrl.toString(),
          autoConnect: false,
          onOpen: (event) => {
            console.log('Initial WebSocket connection opened:', event);
            send({
              content,
              conversationId: activeConversationId
            });
          },
          onMessage: (data) => {
            if (data.requestId) {
              const requestId = data.requestId;
              console.log('Received request ID via WebSocket:', requestId);
              
              // Set up tracking connection
              const trackingUrl = new URL(paths.WS_CHAT_REQUEST(requestId));
              trackingUrl.searchParams.append('conversation_id', activeConversationId);
              
              const trackingWs = new WebSocket(trackingUrl.toString());
              
              trackingWs.onopen = () => {
                console.log(`Tracking connection established for requestId: ${requestId}`);
                
                // Set up WebSocket chat handling
                handleWebSocketChat(
                  placeholderMessage.id, 
                  requestId, 
                  activeConversationId
                );
                
                // Small delay to ensure backend processes connection before closing the other
                setTimeout(() => {
                  if (ws.current?.readyState === WebSocket.OPEN) {
                    console.log('Closing initial connection now that tracking connection is open');
                    ws.disconnect();
                  }
                }, 500);
              };
              
              trackingWs.onerror = (error) => {
                console.error('Error establishing tracking connection:', error);
                console.error('Tracking WebSocket URL:', trackingUrl.toString());
                console.error('Tracking WebSocket state:', trackingWs?.readyState);
                
                ws.disconnect();
                sendMessageViaHttp(content, placeholderMessage.id);
              };
            }
          },
          onError: (error) => {
            console.error('WebSocket connection error details:', error);
            sendMessageViaHttp(content, placeholderMessage.id);
          },
          onClose: (event) => {
            console.log('Initial WebSocket connection closed:', event.code, event.reason);
          }
        });
        
        ws.connect();
        
        // Set timeout for fallback to HTTP
        const wsTimeout = setTimeout(() => {
          if (ws.current?.readyState !== WebSocket.OPEN) {
            console.log('WebSocket connection timeout. Falling back to HTTP.');
            ws.disconnect();
            sendMessageViaHttp(content, placeholderMessage.id);
          }
        }, 3000);
        
        return () => {
          clearTimeout(wsTimeout);
          ws.disconnect();
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
  }, [activeConversationId, conversations, fixConversationTopic, handleWebSocketChat, sendMessageViaHttp]);

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
