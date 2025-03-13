
import { Button } from "@/components/ui/button";
import { Conversation } from "@/types/chat";
import { ConversationItem } from "@/components/chat/conversation-item";
import { PlusCircle, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`
        ${isMobile ? "fixed inset-y-0 left-0 z-50 w-64" : "h-full w-full"}
        bg-sidebar flex flex-col border-r border-sidebar-border
        ${isMobile ? `transform transition-transform duration-300 ease-spring ${isOpen ? "translate-x-0" : "-translate-x-full"}` : ""}
      `}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground">Conversations</h2>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
      
      <div className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-sidebar-accent/50 hover:bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
          onClick={onNewConversation}
        >
          <PlusCircle className="h-4 w-4" />
          New Conversation
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => onSelectConversation(conversation.id)}
            onDelete={() => onDeleteConversation(conversation.id)}
            onRename={(title) => onRenameConversation(conversation.id, title)}
          />
        ))}
      </div>
    </div>
  );
}
