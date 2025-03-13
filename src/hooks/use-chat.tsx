
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Conversation, Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { paths } from '@/config/api-paths';

// Simulated API call for demo purposes - in real app, this would be a fetch to the actual API
const mockApiCall = (message: string, conversationId: string): Promise<any> => {
  return new Promise((resolve) => {
    // Request ID to track the chat processing
    const requestId = uuidv4();
    
    // Immediately return initial response with request ID
    setTimeout(() => {
      resolve({
        requestId,
        status: 'processing',
        stage: 'Contemplating...',
      });
    }, 500);
    
    // In a real implementation, you would connect to a streaming API or use polling
  });
};

// Mock function to simulate getting processing updates
const mockGetProcessingUpdates = (requestId: string): Promise<string> => {
  return new Promise((resolve) => {
    const stages = [
      'Analyzing query...',
      'Processing data...',
      'Generating insights...',
      'Preparing visualizations...',
      'Finalizing response...'
    ];
    
    const randomStage = stages[Math.floor(Math.random() * stages.length)];
    
    setTimeout(() => {
      resolve(randomStage);
    }, 1000);
  });
};

// Mock function for generating sample data (in a real app, this would be an API call)
const mockResponse = (message: string, requestId: string): Promise<Message> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: getRandomResponse(message),
        timestamp: Date.now(),
        requestId,
      };

      // Add sample chart data for certain queries
      if (message.toLowerCase().includes('revenue') || message.toLowerCase().includes('trend')) {
        assistantMsg.visuals = [{
          type: 'bar',
          title: 'Revenue by Sector',
          data: {
            labels: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Energy'],
            datasets: [{
              label: 'Revenue (millions)',
              data: [250, 180, 310, 150, 220],
              backgroundColor: [
                'rgba(59, 130, 246, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(249, 115, 22, 0.6)',
                'rgba(217, 70, 239, 0.6)',
                'rgba(245, 158, 11, 0.6)'
              ],
            }]
          }
        }];
      }

      // Add sample table data for certain queries
      if (message.toLowerCase().includes('companies') || message.toLowerCase().includes('comparison')) {
        assistantMsg.tables = [{
          title: 'Top Companies by Revenue',
          columns: [
            { id: 'rank', header: 'Rank', accessorKey: 'rank' },
            { id: 'company', header: 'Company', accessorKey: 'company' },
            { id: 'sector', header: 'Sector', accessorKey: 'sector' },
            { id: 'revenue', header: 'Revenue (M)', accessorKey: 'revenue' },
            { id: 'growth', header: 'YoY Growth', accessorKey: 'growth' },
          ],
          data: [
            { rank: 1, company: 'TechCorp', sector: 'Technology', revenue: 450, growth: '12.3%' },
            { rank: 2, company: 'FinGroup', sector: 'Finance', revenue: 380, growth: '8.7%' },
            { rank: 3, company: 'MediHealth', sector: 'Healthcare', revenue: 310, growth: '15.2%' },
            { rank: 4, company: 'EnerSol', sector: 'Energy', revenue: 290, growth: '5.1%' },
            { rank: 5, company: 'RetailGiant', sector: 'Retail', revenue: 270, growth: '7.8%' },
          ]
        }];
      }

      // Add sample analysis data
      assistantMsg.analysis = getRandomAnalysis(message);

      resolve(assistantMsg);
    }, 4000); // Longer delay to simulate processing time
  });
};

// Sample responses
const getRandomResponse = (query: string): string => {
  const responses = [
    "Based on the data analysis, I can provide the following insights about your query.",
    "I've analyzed the dataset and here's what I found for your question.",
    "The data shows the following trends related to your query.",
    "After examining the relevant metrics, here are the key insights.",
    "I've compiled the following information based on your question."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Sample analysis content
const getRandomAnalysis = (query: string): string => {
  const analyses = [
    "Deeper analysis reveals several insights:\n\n- Revenue growth is primarily driven by new product lines\n- Customer retention has a strong correlation with profitability\n- Market expansion efforts show diminishing returns in mature segments\n- Competitor analysis suggests opportunities in emerging markets\n\nRecommendation: Focus on customer retention strategies while exploring targeted expansion.",
    "Business intelligence analysis highlights:\n\n- Year-over-year growth exceeds industry average by 4.2%\n- Product mix optimization could increase margins by ~3%\n- Regional performance varies significantly with strongest results in EMEA\n- Operational efficiency metrics show room for improvement\n\nRecommendation: Review operational processes while maintaining current product strategy.",
    "Strategic insights from the data:\n\n- Current market positioning is strong against direct competitors\n- Price sensitivity analysis shows elasticity in mid-tier products\n- Customer segment analysis reveals untapped potential in SMB sector\n- Cost structure analysis identifies optimization opportunities\n\nRecommendation: Consider targeted price adjustments in mid-tier offerings while pursuing SMB expansion.",
  ];
  return analyses[Math.floor(Math.random() * analyses.length)];
};

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

  // Function to simulate processing stages updates
  const simulateProcessingStages = useCallback(async (placeholderId: string, requestId: string) => {
    // In a real implementation, this would be a streaming connection or polling
    for (let i = 0; i < 4; i++) {
      // Wait before updating to next stage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get next processing stage (in real app, this would be from API)
      const nextStage = await mockGetProcessingUpdates(requestId);
      
      // Update the placeholder message with new stage
      updateMessage(placeholderId, { processingStage: nextStage });
    }
  }, [updateMessage]);

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
      // Make initial API call (in a real app this would hit paths.CHAT_API)
      const initialResponse = await mockApiCall(content, activeConversationId);
      const { requestId } = initialResponse;
      
      // Update placeholder with request ID for tracking
      updateMessage(placeholderMessage.id, { 
        requestId,
        processingStage: initialResponse.stage
      });
      
      // Start simulating processing stages (in real app, this would be streaming or polling)
      simulateProcessingStages(placeholderMessage.id, requestId);
      
      // Get the full response once processing is complete
      const assistantMessage = await mockResponse(content, requestId);
      
      // Replace the placeholder with the actual response
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { 
                ...conv, 
                messages: conv.messages.map(msg => 
                  msg.id === placeholderMessage.id 
                    ? { ...assistantMessage, isLoading: false, processingStage: undefined }
                    : msg
                ),
              } 
            : conv
        )
      );
    } catch (error) {
      // Handle error by replacing placeholder with error message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { 
                ...conv, 
                messages: conv.messages.map(msg => 
                  msg.id === placeholderMessage.id 
                    ? { 
                        ...msg, 
                        content: 'Sorry, there was an error processing your request.', 
                        isLoading: false,
                        processingStage: undefined
                      } 
                    : msg
                ),
              } 
            : conv
        )
      );
    }
  }, [activeConversationId, updateMessage, simulateProcessingStages]);

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
