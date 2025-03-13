
import { useState, useCallback, useMemo } from 'react';
import { Conversation, Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

// Mock function for generating sample data (in a real app, this would be an API call)
const mockResponse = (message: string): Promise<Message> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: getRandomResponse(message),
        timestamp: Date.now(),
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

      resolve(assistantMsg);
    }, 2000);
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
      processingStage: 'Analyzing query...',
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
    
    // Simulate stages of processing
    setTimeout(() => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { 
                ...conv, 
                messages: conv.messages.map(msg => 
                  msg.id === placeholderMessage.id 
                    ? { ...msg, processingStage: 'Processing data...' } 
                    : msg
                ),
              } 
            : conv
        )
      );
    }, 1000);
    
    // Get the response (simulated in this example)
    try {
      const assistantMessage = await mockResponse(content);
      
      // Replace the placeholder with the actual response
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { 
                ...conv, 
                messages: conv.messages.map(msg => 
                  msg.id === placeholderMessage.id 
                    ? assistantMessage
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
  }, [activeConversationId]);

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
