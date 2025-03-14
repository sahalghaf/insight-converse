
import { useEffect, useRef } from "react";
import { Message as MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ChartDisplay } from "@/components/ui/chart-display";
import { Loader2 } from "lucide-react";

// Helper functions to check data availability
const hasVisualData = (message: MessageType) => 
  message.visuals && message.visuals.length > 0;
  
const hasTableData = (message: MessageType) => 
  message.tables && message.tables.length > 0;

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const { role, content, visuals, tables, isLoading, processingStage } = message;
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const formatMessageContent = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => (
        <span key={i} className="block">
          {line || <br />}
        </span>
      ));
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "py-6 flex w-full",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div 
        className={cn(
          "flex flex-col gap-3", 
          role === "user" ? "items-end" : "items-start",
          "max-w-full w-full md:max-w-4xl"
        )}
      >
        <div
          className={cn(
            "will-change-transform",
            role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
          )}
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{processingStage || "Processing..."}</span>
              </div>
              <div className="w-32 h-2 bg-muted/50 rounded-full shimmer-effect" />
              <div className="w-48 h-2 bg-muted/50 rounded-full shimmer-effect" />
              <div className="w-40 h-2 bg-muted/50 rounded-full shimmer-effect" />
            </div>
          ) : (
            <div>{formatMessageContent(content)}</div>
          )}
        </div>

        {!isLoading && hasVisualData(message) && (
          <div className="w-full max-w-lg">
            {visuals!.map((visual, index) => (
              <div key={index} className="mt-2">
                <ChartDisplay chartData={visual} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && hasTableData(message) && (
          <div className="w-full" style={{ maxWidth: '100%' }}>
            {tables!.map((table, index) => (
              <div key={index} className="mt-2 overflow-auto">
                <DataTable tableData={table} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
