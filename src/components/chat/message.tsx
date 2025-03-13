
import { useEffect, useRef, useState, useCallback } from "react";
import { Message as MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ChartDisplay } from "@/components/ui/chart-display";
import { Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from "@/components/ui/collapsible";
import { paths } from "@/config/api-paths";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const { id, role, content, visuals, tables, isLoading, processingStage, analysis: initialAnalysis } = message;
  const messageRef = useRef<HTMLDivElement>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(initialAnalysis || null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Fetch analysis when user opens the collapsible if analysis is not already loaded
  const handleOpenAnalysis = useCallback(async (open: boolean) => {
    setIsAnalysisOpen(open);
    
    // Only fetch analysis if opening and we don't already have it
    if (open && !analysis && !isLoadingAnalysis && !isLoading && role === 'assistant') {
      setIsLoadingAnalysis(true);
      
      try {
        const response = await fetch(`http://localhost:9800${paths.ANALYSIS_API}/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }
        
        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (error) {
        console.error('Error fetching analysis:', error);
        setAnalysis('Failed to load analysis. Please try again.');
      } finally {
        setIsLoadingAnalysis(false);
      }
    }
  }, [analysis, isLoadingAnalysis, isLoading, role, id]);

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
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

        {visuals && visuals.length > 0 && !isLoading && (
          <div className="w-full max-w-lg">
            {visuals.map((visual, index) => (
              <div key={index} className="mt-2">
                <ChartDisplay chartData={visual} />
              </div>
            ))}
          </div>
        )}

        {tables && tables.length > 0 && !isLoading && (
          <div className="w-full" style={{ maxWidth: '100%' }}>
            {tables.map((table, index) => (
              <div key={index} className="mt-2 overflow-auto">
                <DataTable tableData={table} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && role === 'assistant' && (
          <div className="w-full mt-2">
            <Collapsible
              open={isAnalysisOpen}
              onOpenChange={handleOpenAnalysis}
              className="border border-border rounded-lg overflow-hidden bg-card/70 backdrop-blur-sm"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>AI Analysis</span>
                </div>
                {isAnalysisOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 text-sm border-t border-border bg-card/30">
                {isLoadingAnalysis ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading analysis...</span>
                  </div>
                ) : analysis ? (
                  formatMessageContent(analysis)
                ) : (
                  <p>No additional analysis available for this response.</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  );
}
