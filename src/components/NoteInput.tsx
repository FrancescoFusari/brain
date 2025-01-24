import { memo, useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

interface NoteInputProps {
  onNoteSubmit: (content: string) => Promise<void>;
}

export const NoteInput = memo(({ onNoteSubmit }: NoteInputProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: "Note cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onNoteSubmit(content);
      setContent("");
      toast({
        title: "Note saved successfully",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Failed to save note",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [content, onNoteSubmit, toast]);

  return (
    <div className="space-y-4 w-full">
      <Textarea
        placeholder="Drop your thoughts, links, or anything else..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] resize-none bg-background/50 backdrop-blur-sm"
      />
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting || !content.trim()}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Note'
        )}
      </Button>
    </div>
  );
});

NoteInput.displayName = "NoteInput";