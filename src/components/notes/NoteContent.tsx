import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NoteContentProps {
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onContentChange: (content: string) => void;
}

export const NoteContent = ({
  content,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onContentChange,
}: NoteContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatContent = (content: string) => {
    const formattedContent = content
      .replace(/\n\s*\n/g, '\n\n')
      .split('\n\n')
      .filter(para => para.trim() !== '')
      .join('\n\n');
    
    return formattedContent;
  };

  const shouldCollapse = content.length > 250;
  const displayContent = shouldCollapse && !isExpanded 
    ? content.slice(0, 250) + "..." 
    : content;

  return (
    <div className="whitespace-pre-wrap mb-4 text-sm md:text-base leading-relaxed break-words w-full overflow-hidden">
      <div className="max-w-full md:max-w-[65ch] mx-auto px-4">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[200px] w-full"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button onClick={onSave}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {formatContent(displayContent).split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0 break-words">
                {paragraph}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 mt-4">
              {shouldCollapse && (
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      Show Less
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show More
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onEdit}
              >
                Edit Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};