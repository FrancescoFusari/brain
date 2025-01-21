import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const formatContent = (content: string) => {
    const formattedContent = content
      .replace(/\n\s*\n/g, '\n\n')
      .split('\n\n')
      .filter(para => para.trim() !== '')
      .join('\n\n');
    
    return formattedContent;
  };

  return (
    <div className="whitespace-pre-wrap mb-4 text-sm md:text-base leading-relaxed break-words max-w-full overflow-hidden px-1">
      <div className="w-[94vw] lg:max-w-[65ch] mx-auto">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[200px]"
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
            {formatContent(content).split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
            <Button
              variant="outline"
              className="mt-4"
              onClick={onEdit}
            >
              Edit Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};