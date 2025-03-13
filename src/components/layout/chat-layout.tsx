
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { InputBox } from "@/components/chat/input-box";
import { useChat } from "@/hooks/use-chat";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ChatLayout() {
  const {
    conversations,
    activeConversation,
    setActiveConversationId,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    sendMessage,
    submitMessageFeedback
  } = useChat();
  
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation.messages]);

  // Close sidebar by default on mobile
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="flex h-screen bg-background">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation.id}
        onSelectConversation={setActiveConversationId}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={updateConversationTitle}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <MessageList 
              messages={activeConversation.messages} 
              onSubmitFeedback={submitMessageFeedback}
            />
            <div ref={messagesEndRef} />
          </div>
        </main>
        
        <div className="border-t border-border bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/50">
          <div className="max-w-3xl mx-auto p-4">
            <InputBox onSend={sendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}
