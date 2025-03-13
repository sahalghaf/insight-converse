
import { Message } from "@/components/chat/message";
import { Message as MessageType } from "@/types/chat";

interface MessageListProps {
  messages: MessageType[];
  onSubmitFeedback?: (messageId: string, feedback: 'helpful' | 'unhelpful', comment?: string) => void;
}

export function MessageList({ messages, onSubmitFeedback }: MessageListProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 pt-4 pb-20">
      {messages.map((message) => (
        <Message 
          key={message.id} 
          message={message} 
          onSubmitFeedback={onSubmitFeedback}
        />
      ))}
    </div>
  );
}
