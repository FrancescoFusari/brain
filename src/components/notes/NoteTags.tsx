import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, RefreshCw } from "lucide-react";

interface NoteTagsProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onRenameTag: (originalTag: string, newTag: string) => void;
  onRegenerateTags: () => void;
  isRegeneratingTags: boolean;
}

export const NoteTags = ({ 
  tags, 
  onAddTag, 
  onRemoveTag, 
  onRenameTag,
  onRegenerateTags,
  isRegeneratingTags 
}: NoteTagsProps) => {
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<{ original: string; new: string } | null>(null);

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    onAddTag(newTag.trim());
    setNewTag("");
  };

  const handleRenameTag = (originalTag: string) => {
    if (!editingTag || !editingTag.new.trim() || editingTag.new === originalTag) {
      setEditingTag(null);
      return;
    }

    onRenameTag(originalTag, editingTag.new.trim());
    setEditingTag(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add new tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          className="max-w-[200px] text-sm"
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleAddTag}
          disabled={!newTag.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center">
            {editingTag?.original === tag ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editingTag.new}
                  onChange={(e) => setEditingTag({ ...editingTag, new: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameTag(tag)}
                  className="h-7 w-[150px] text-sm"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRenameTag(tag)}
                  className="text-xs"
                >
                  Save
                </Button>
              </div>
            ) : (
              <Badge 
                variant="secondary"
                className="pr-1 text-xs md:text-sm"
              >
                <span 
                  className="cursor-pointer mr-2"
                  onClick={() => setEditingTag({ original: tag, new: tag })}
                >
                  {tag}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRegenerateTags}
          disabled={isRegeneratingTags}
          className="text-xs md:text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRegeneratingTags ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};