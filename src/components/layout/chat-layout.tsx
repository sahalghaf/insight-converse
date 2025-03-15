
import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/hooks/use-chat";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { InputBox } from "@/components/chat/input-box";
import { Button } from "@/components/ui/button";
import { Menu, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { toast } from "@/components/ui/use-toast";

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
  const [isSending, setIsSending] = useState(false);
  const isMobile = useIsMobile();
  const { isOnline } = useConnectionStatus();

  // Automatically close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  // Safely check if activeConversation and messages exist
  const isWaitingForResponse = activeConversation?.messages?.some(
    (message) => message?.isLoading
  ) || false;

  // Function to handle suggestion clicks with error handling
  const handleSendSuggestion = useCallback((suggestion: string) => {
    if (!suggestion || isSending || !isOnline) return;
    
    try {
      setIsSending(true);
      sendMessage(suggestion);
    } catch (err) {
      console.error("Error sending suggestion:", err);
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
  }, [sendMessage, isSending, isOnline]);

  // Function to handle message sending with error handling
  const handleSendMessage = useCallback((message: string) => {
    if (!message || isSending || !isOnline) return;
    
    try {
      setIsSending(true);
      sendMessage(message);
    } catch (err) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Prevent multiple rapid clicks
      setTimeout(() => {
        setIsSending(false);
      }, 500);
    }
  }, [sendMessage, isSending, isOnline]);

  // Function to handle new conversation safely
  const handleNewConversation = useCallback(() => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot create a new conversation while offline.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      createNewConversation().catch(err => {
        console.error("Error creating new conversation:", err);
        toast({
          title: "Error",
          description: "Failed to create a new conversation. Please try again.",
          variant: "destructive",
        });
      });
    } catch (err) {
      console.error("Error initiating new conversation:", err);
      toast({
        title: "Error",
        description: "Failed to create a new conversation. Please try again.",
        variant: "destructive",
      });
    }
  }, [createNewConversation, isOnline]);

  return (
    <div className="flex flex-col h-screen relative">
      {/* Logo Header */}
      <header className="h-16 flex items-center px-4 border-b bg-card/60 backdrop-blur-sm z-20">
        <div className="flex items-center space-x-2 mx-auto md:mx-0">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">Enterprise ChatBot</span>
        </div>
        
        {/* Add the theme toggle to the header */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <ThemeToggle />
        </div>
      </header>

      <ResizablePanelGroup 
        direction="horizontal" 
        className="flex-1 overflow-hidden"
      >
        {isSidebarOpen && !isMobile && (
          <>
            <ResizablePanel 
              defaultSize={20} 
              minSize={15} 
              maxSize={40}
              className="relative"
            >
              <ConversationSidebar
                conversations={conversations || []}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversationId}
                onNewConversation={handleNewConversation}
                onDeleteConversation={deleteConversation}
                onRenameConversation={updateConversationTitle}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        
        <ResizablePanel defaultSize={isSidebarOpen && !isMobile ? 80 : 100}>
          <div className="flex-1 flex flex-col overflow-hidden relative h-full">
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
                {activeConversation?.title || "New Conversation"}
              </h1>
              
              {!isOnline && (
                <div className="ml-auto mr-4">
                  <span className="text-sm font-medium text-destructive-foreground bg-destructive px-2 py-0.5 rounded-full">
                    Offline
                  </span>
                </div>
              )}
            </div>
            
            {/* Mobile sidebar overlay */}
            {isMobile && (
              <div
                className={`
                  fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 z-40
                  ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            {/* Mobile sidebar */}
            {isMobile && isSidebarOpen && (
              <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
                <ConversationSidebar
                  conversations={conversations || []}
                  activeConversationId={activeConversationId}
                  onSelectConversation={setActiveConversationId}
                  onNewConversation={handleNewConversation}
                  onDeleteConversation={deleteConversation}
                  onRenameConversation={updateConversationTitle}
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            )}
            
            <main className="flex-1 overflow-hidden flex flex-col w-full">
              <MessageList 
                messages={activeConversation?.messages || []} 
                onSendSuggestion={handleSendSuggestion}
              />
              
              <div className="p-4 md:p-6">
                <InputBox
                  onSend={handleSendMessage}
                  isWaitingForResponse={isWaitingForResponse}
                />
              </div>
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
