
import { ChatLayout } from "@/components/layout/chat-layout";
import { useEffect } from "react";
import { useChat } from "@/hooks/use-chat";

const Index = () => {
  const { activeConversationId } = useChat();
  
  useEffect(() => {
    // Set the HTML title
    document.title = "Enterprise ChatBot";
  }, []);

  // Use the active conversation ID as a key to force the ChatLayout to remount
  // when a new conversation is created, which will generate new random questions
  return <ChatLayout key={activeConversationId} />;
};

export default Index;
