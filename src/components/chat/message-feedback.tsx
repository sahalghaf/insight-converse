
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageFeedbackProps {
  messageId: string;
  feedbackSubmitted?: 'helpful' | 'unhelpful';
  onSubmitFeedback: (messageId: string, feedback: 'helpful' | 'unhelpful', comment?: string) => void;
}

export function MessageFeedback({ messageId, feedbackSubmitted, onSubmitFeedback }: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(
    feedbackSubmitted || null
  );
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleFeedback = (value: 'helpful' | 'unhelpful') => {
    // Toggle feedback if the same button is clicked again
    if (feedback === value) {
      setFeedback(null);
      setShowComment(false);
    } else {
      setFeedback(value);
      setShowComment(value === 'unhelpful');
    }
    
    // Submit immediately for 'helpful' feedback
    if (value === 'helpful' && feedback !== value) {
      onSubmitFeedback(messageId, value);
    }
  };

  const handleSubmitComment = () => {
    if (feedback) {
      onSubmitFeedback(messageId, feedback, comment);
      setShowComment(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full p-0 h-8 w-8",
            feedback === 'helpful' && "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
          )}
          onClick={() => handleFeedback('helpful')}
          disabled={!!feedbackSubmitted}
          title="Helpful"
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="sr-only">Helpful</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full p-0 h-8 w-8",
            feedback === 'unhelpful' && "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
          )}
          onClick={() => handleFeedback('unhelpful')}
          disabled={!!feedbackSubmitted}
          title="Not helpful"
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="sr-only">Not helpful</span>
        </Button>
        
        {feedbackSubmitted && (
          <span className="text-xs text-muted-foreground ml-2">
            {feedbackSubmitted === 'helpful' 
              ? "You found this helpful" 
              : "You didn't find this helpful"}
          </span>
        )}
      </div>

      {showComment && (
        <div className="flex flex-col gap-2 px-2 py-1 bg-secondary/50 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tell us why this wasn't helpful</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => setShowComment(false)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <Textarea
            className="min-h-[80px] text-sm"
            placeholder="What would have made this response more helpful?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!comment.trim()}
            >
              Submit feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
