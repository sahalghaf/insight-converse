
import { useEffect, useRef, useState } from "react";
import { Message } from "@/components/chat/message";
import { Message as MessageType } from "@/types/chat";
import { MessageCircleQuestion } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getRandomQuestions } from "@/utils/sample-questions";

interface MessageListProps {
  messages: MessageType[];
  onSendSuggestion?: (suggestion: string) => void;
}

export function MessageList({ messages, onSendSuggestion }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  // Get 3 random questions when the component mounts
  const [randomQuestions] = useState(() => getRandomQuestions(3));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset isSending when messages array changes (new conversation)
  useEffect(() => {
    setIsSending(false);
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [messages.length === 0]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    // Don't proceed if already sending or no handler provided
    if (!onSendSuggestion || isSending) return;
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Set sending state immediately
    setIsSending(true);

    try {
      // Process the suggestion
      onSendSuggestion(suggestion);
    } catch (error) {
      console.error("Error sending suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to send suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure we reset the sending state after a delay
      debounceTimerRef.current = setTimeout(() => {
        setIsSending(false);
        debounceTimerRef.current = null;
      }, 500);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto pt-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent px-4 md:px-8"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome to Enterprise ChatBot
            </h2>
            <p className="text-muted-foreground">
              Ask questions about your data to get insights, visualizations, and analysis.
            </p>
            <div className="grid gap-2 mt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Try asking:</p>
                <div className="flex flex-col gap-2">
                  {randomQuestions.map((question, index) => (
                    <div 
                      key={index}
                      className="bg-secondary text-secondary-foreground p-3 rounded-lg text-sm hover:bg-secondary/80 transition-colors cursor-pointer flex items-center gap-2"
                      onClick={() => handleSuggestionClick(question)}
                    >
                      <MessageCircleQuestion className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
