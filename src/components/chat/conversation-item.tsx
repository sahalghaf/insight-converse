
import { cn } from "@/lib/utils";
import { Conversation } from "@/types/chat";
import { MessageSquare, Trash, Edit, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const handleRename = () => {
    if (title.trim()) {
      onRename(title);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTitle(conversation.title);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-sidebar-accent cursor-pointer",
        isActive ? "bg-sidebar-accent" : "transparent"
      )}
      onClick={!isEditing ? onClick : undefined}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sidebar-foreground border-b border-sidebar-primary/50 focus:outline-none focus:border-sidebar-primary"
            autoFocus
          />
          <div className="flex gap-1 ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-primary/20"
              onClick={handleRename}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-primary/20"
              onClick={() => {
                setIsEditing(false);
                setTitle(conversation.title);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate">{conversation.title}</span>
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDate(conversation.updatedAt)}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
