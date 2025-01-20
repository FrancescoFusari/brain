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
  MessageCircle,
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
  
  console.log('SearchResult render:', { node, isExpanded, relatedNodesCount: relatedNodes.length });

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    console.log('Toggle expanded state:', !isExpanded);
  };

  const handleSelect = (selectedNode: NetworkNode) => {
    console.log('Node selected:', selectedNode);
    onSelect(selectedNode);
  };

  const handleViewNote = (noteId: string) => {
    const id = noteId.replace('note-', '');
    navigate(`/note/${id}`);
  };

  const relatedTags = relatedNodes.filter(n => n.type === 'tag');
  const relatedNotes = relatedNodes.filter(n => n.type === 'note');

  console.log('Related nodes:', { tags: relatedTags.length, notes: relatedNotes.length });

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'tag':
        return <Tag className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

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
          className="flex-1 justify-start font-medium truncate text-sm h-8 gap-2"
          onClick={handleToggle}
        >
          {getNodeIcon(node.type)}
          {node.name}
        </Button>
        {node.type === 'note' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewNote(node.id)}
            className="h-8 w-8 p-0 shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
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
                  className="cursor-pointer text-xs py-0 h-5 flex items-center gap-1"
                  onClick={() => handleSelect(tag)}
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No tags connected</span>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-1.5">
            <div className="flex items-center text-xs text-muted-foreground">
              <Link2 className="h-3 w-3 mr-1.5" />
              Connected Notes
            </div>
            <div className="space-y-0.5">
              {relatedNotes.length > 0 ? (
                relatedNotes.map((note) => (
                  <div key={note.id} className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start text-xs font-normal h-7 truncate gap-2"
                      onClick={() => handleSelect(note)}
                    >
                      <ArrowRight className="h-3 w-3" />
                      {note.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewNote(note.id)}
                      className="h-7 w-7 p-0 shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No notes connected</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};