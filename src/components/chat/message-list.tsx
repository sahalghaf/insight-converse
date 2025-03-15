
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

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    if (!onSendSuggestion || isSending) return;
    
    try {
      setIsSending(true);
      onSendSuggestion(suggestion);
    } catch (error) {
      console.error("Error sending suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to send suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Prevent multiple rapid clicks
      setTimeout(() => {
        setIsSending(false);
      }, 500);
    }
  };

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
