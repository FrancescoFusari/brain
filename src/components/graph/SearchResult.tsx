import { useState } from "react";
import { NetworkNode } from "@/utils/networkGraphUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  ExternalLink,
  FileText,
  Link2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SearchResultProps {
  node: NetworkNode;
  relatedNodes: NetworkNode[];
  onSelect: (node: NetworkNode) => void;
}

export const SearchResult = ({ node, relatedNodes, onSelect }: SearchResultProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  const handleToggle = () => setIsExpanded(!isExpanded);
  const handleSelect = (selectedNode: NetworkNode) => onSelect(selectedNode);
  const handleViewNote = (noteId: string) => navigate(`/note/${noteId.replace('note-', '')}`);

  const relatedTags = relatedNodes.filter(n => n.type === 'tag');
  const relatedNotes = relatedNodes.filter(n => n.type === 'note');

  const NodeIcon = node.type === 'tag' ? Tag : FileText;

  const renderConnectedItems = (items: NetworkNode[], type: 'tag' | 'note') => {
    if (items.length === 0) {
      return <span className="text-xs text-muted-foreground">No {type}s connected</span>;
    }

    if (type === 'tag') {
      return items.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="cursor-pointer text-xs py-0 h-5 flex items-center gap-1"
          onClick={() => handleSelect(tag)}
        >
          <Tag className="h-3 w-3" />
          {tag.name}
        </Badge>
      ));
    }

    return items.map((note) => (
      <div key={note.id} className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start text-xs font-normal h-7 truncate gap-1.5"
          onClick={() => handleSelect(note)}
        >
          <ArrowRight className="h-3 w-3" />
          {note.name}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewNote(note.id)}
          className="h-7 w-7 p-0"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    ));
  };

  // Different styling for tag vs note results
  const containerClasses = cn(
    "bg-background/95 backdrop-blur-sm border rounded-lg transition-all duration-200",
    node.type === 'tag' 
      ? isExpanded ? "p-2" : "p-1.5" 
      : isExpanded ? "p-3" : "p-2"
  );

  const headerButtonClasses = cn(
    "flex-1 justify-start font-medium truncate gap-2",
    node.type === 'tag' 
      ? "text-xs h-7" 
      : "text-sm h-8"
  );

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={headerButtonClasses}
          onClick={handleToggle}
        >
          <NodeIcon className={cn("w-4 h-4", node.type === 'tag' && "w-3 h-3")} />
          {node.name}
        </Button>
        {node.type === 'note' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewNote(node.id)}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn("p-0", node.type === 'tag' ? "h-7 w-7" : "h-8 w-8")}
        >
          {isExpanded ? (
            <ChevronUp className={cn("w-4 h-4", node.type === 'tag' && "w-3 h-3")} />
          ) : (
            <ChevronDown className={cn("w-4 h-4", node.type === 'tag' && "w-3 h-3")} />
          )}
        </Button>
      </div>

      <div className={cn("space-y-2", !isExpanded && "mt-1.5")}>
        {/* Only show tags section for notes */}
        {node.type === 'note' && (
          <div className="space-y-1.5">
            <div className="flex items-center text-xs text-muted-foreground">
              <Tag className="h-3 w-3 mr-1.5" />
              {isExpanded ? 'Connected Tags' : 'Tags'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {renderConnectedItems(relatedTags, 'tag')}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Link2 className="h-3 w-3 mr-1.5" />
              Connected Notes
            </div>
            <div className="space-y-0.5">
              {renderConnectedItems(relatedNotes, 'note')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};