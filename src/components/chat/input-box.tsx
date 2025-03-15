
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface InputBoxProps {
  onSend: (message: string) => void;
  isWaitingForResponse?: boolean;
}

export function InputBox({ onSend, isWaitingForResponse = false }: InputBoxProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Adjust textarea height on input change
    if (textareaRef.current) {
      textareaRef.current.style.height = "0";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight > 200 ? "200px" : `${scrollHeight}px`;
    }
  }, [input]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !isWaitingForResponse && !isSending) {
      // Prevent multiple rapid clicks
      setIsSending(true);
      
      try {
        const message = input.trim();
        setInput("");
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        
        // Clear any existing timeout
        if (sendTimeoutRef.current) {
          clearTimeout(sendTimeoutRef.current);
        }
        
        // Debounce sending messages
        sendTimeoutRef.current = setTimeout(() => {
          onSend(message);
          sendTimeoutRef.current = null;
        }, 100);
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      } finally {
        // Allow sending again after a short delay
        setTimeout(() => {
          setIsSending(false);
        }, 500);
      }
    }
  };

  return (
    <div className="relative border border-border bg-card rounded-lg overflow-hidden shadow-sm transition-all animate-fade-in will-change-transform">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your data..."
          className="w-full px-4 py-3 pr-12 resize-none max-h-[200px] bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
          rows={1}
          disabled={isWaitingForResponse || isSending}
        />
        <Button
          onClick={handleSend}
          size="icon"
          className={cn(
            "absolute right-2 bottom-2 transition-opacity",
            (!input.trim() || isWaitingForResponse || isSending) ? "opacity-50 cursor-not-allowed" : "opacity-100"
          )}
          disabled={!input.trim() || isWaitingForResponse || isSending}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
