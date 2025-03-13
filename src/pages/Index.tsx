
import { ChatLayout } from "@/components/layout/chat-layout";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Set the HTML title
    document.title = "Enterprise ChatBot";
  }, []);

  return <ChatLayout />;
};

export default Index;
