import { useEffect, useRef, useState, useCallback } from "react";
import { Message as MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ChartDisplay } from "@/components/ui/chart-display";
import { Loader2, ChevronDown, ChevronUp, Zap, AlertCircle } from "lucide-react";
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from "@/components/ui/collapsible";
import { paths } from "@/config/api-paths";
import { MessageFeedback } from "@/components/chat/message-feedback";

const API_BASE_URL = 'http://localhost:9800';

// Helper functions to check data availability
const hasVisualData = (message: MessageType) => 
  message.visuals && message.visuals.length > 0;
  
const hasTableData = (message: MessageType) => 
  message.tables && message.tables.length > 0;

const hasAnalysisData = (message: MessageType) =>
  message.analysis !== undefined && message.analysis !== null;

interface MessageProps {
  message: MessageType;
  onSubmitFeedback?: (messageId: string, feedback: 'helpful' | 'unhelpful', comment?: string) => void;
}

export function Message({ message, onSubmitFeedback }: MessageProps) {
  const { id, role, content, visuals, tables, isLoading, processingStage, analysis: initialAnalysis, feedbackSubmitted } = message;
  const messageRef = useRef<HTMLDivElement>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(initialAnalysis || null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleOpenAnalysis = useCallback(async (open: boolean) => {
    setIsAnalysisOpen(open);
    
    if (open && !analysis && !isLoadingAnalysis && !isLoading && role === 'assistant' && !analysisError) {
      setIsLoadingAnalysis(true);
      
      // Create new AbortController for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        const response = await fetch(
          `${API_BASE_URL}${paths.ANALYSIS_API}/${id}`, 
          { signal: abortControllerRef.current.signal }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }
        
        const data = await response.json();
        setAnalysis(data.analysis);
        
        // Reset error state if we succeed
        setAnalysisError(null);
      } catch (error) {
        // Only set error if it's not an abort error
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching analysis:', error);
          setAnalysisError('Failed to load analysis. Please try again.');
        }
      } finally {
        setIsLoadingAnalysis(false);
      }
    }
  }, [analysis, isLoadingAnalysis, isLoading, role, id, analysisError]);

  const formatMessageContent = (content: string) => {
    if (!content || typeof content !== 'string') {
      return null;
    }
    
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

        {!isLoading && role === 'assistant' && (
          <>
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
                  ) : analysisError ? (
                    <div className="flex items-center gap-2 py-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{analysisError}</span>
                    </div>
                  ) : analysis ? (
                    formatMessageContent(analysis)
                  ) : (
                    <div className="flex items-center gap-2 py-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>No additional analysis available for this response.</span>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
            
            {/* Message Feedback */}
            {!isLoading && onSubmitFeedback && (
              <div className="mt-2 ml-auto">
                <MessageFeedback 
                  messageId={id}
                  feedbackSubmitted={feedbackSubmitted}
                  onSubmitFeedback={onSubmitFeedback}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
