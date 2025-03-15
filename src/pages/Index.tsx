
import { ChatLayout } from "@/components/layout/chat-layout";
import { useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";

const Index = () => {
  const { activeConversationId } = useChat();
  const [key, setKey] = useState<string | number>(0);
  
  useEffect(() => {
    // Set the HTML title
    document.title = "Enterprise ChatBot";
  }, []);
  
  // Update key when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setKey(activeConversationId);
    }
  }, [activeConversationId]);

  // Use the key to force the ChatLayout to remount
  // when a new conversation is created, which will generate new random questions
  return <ChatLayout key={key} />;
};

export default Index;
