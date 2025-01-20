import { useState } from "react";
import { NetworkNode } from "@/utils/networkGraphUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultProps {
  node: NetworkNode;
  relatedNodes: NetworkNode[];
  onSelect: (node: NetworkNode) => void;
}

export const SearchResult = ({ node, relatedNodes, onSelect }: SearchResultProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  console.log('SearchResult render:', { node, isExpanded, relatedNodesCount: relatedNodes.length });

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    console.log('Toggle expanded state:', !isExpanded);
  };

  const handleSelect = (selectedNode: NetworkNode) => {
    console.log('Node selected:', selectedNode);
    onSelect(selectedNode);
  };

  const relatedTags = relatedNodes.filter(n => n.type === 'tag');
  const relatedNotes = relatedNodes.filter(n => n.type === 'note');

  console.log('Related nodes:', { tags: relatedTags.length, notes: relatedNotes.length });

  return (
    <div 
      className={cn(
        "bg-background/95 backdrop-blur-sm border rounded-lg transition-all duration-200 w-full max-w-full overflow-hidden",
        isExpanded ? "p-3" : "p-2"
      )}
    >
      <div className="flex items-center justify-between gap-1 w-full">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start font-medium truncate text-sm h-8"
          onClick={handleToggle}
        >
          {node.name}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8 w-8 p-0 shrink-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className={cn("space-y-3 w-full", !isExpanded && "mt-2")}>
        <div className="space-y-1.5">
          <div className="flex items-center text-xs text-muted-foreground">
            <Tag className="h-3 w-3 mr-1.5" />
            {isExpanded ? 'Connected Tags' : 'Tags'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relatedTags.length > 0 ? (
              relatedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="cursor-pointer text-xs py-0 h-5"
                  onClick={() => handleSelect(tag)}
                >
                  {tag.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No tags connected</span>
            )}
          </div>
        </div>

        {isExpanded && relatedNotes.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">
              Notes with Common Tags
            </div>
            <div className="space-y-0.5">
              {relatedNotes.map((note) => (
                <Button
                  key={note.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-normal h-7 truncate"
                  onClick={() => handleSelect(note)}
                >
                  {note.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};