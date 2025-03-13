
import { useState, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { InputBox } from "@/components/chat/input-box";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ChatLayout() {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  // Automatically close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const isWaitingForResponse = activeConversation.messages.some(
    (message) => message.isLoading
  );

  return (
    <div className="flex flex-col h-screen relative">
      <div className="flex flex-1 overflow-hidden">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={updateConversationTitle}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="h-14 flex items-center px-4 border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="font-semibold truncate">
              {activeConversation.title || "New Conversation"}
            </h1>
          </div>
          
          <div
            className={`
              fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 z-40
              ${isSidebarOpen && isMobile ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
            onClick={() => setIsSidebarOpen(false)}
          />
          
          <main className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
            <MessageList messages={activeConversation.messages} />
            
            <div className="p-4 md:p-6">
              <InputBox
                onSend={sendMessage}
                isWaitingForResponse={isWaitingForResponse}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
