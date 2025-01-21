import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { RefreshCw, Link2Icon, ImageIcon, MailIcon, TextIcon } from "lucide-react";

interface NoteHeaderProps {
  category: string;
  inputType?: string;
  createdAt: string;
  onRegenerateTitle: () => void;
  isRegeneratingTitle: boolean;
}

export const NoteHeader = ({
  category,
  inputType,
  createdAt,
  onRegenerateTitle,
  isRegeneratingTitle
}: NoteHeaderProps) => {
  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'url':
        return <Link2Icon className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'email':
        return <MailIcon className="h-4 w-4" />;
      default:
        return <TextIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'url':
        return 'URL Note';
      case 'image':
        return 'Image Note';
      case 'email':
        return 'Email Note';
      default:
        return 'Text Note';
    }
  };

  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-primary text-sm md:text-lg font-semibold">
          {category}
        </Badge>
        <Badge 
          variant="secondary"
          className="flex items-center gap-1 text-xs md:text-sm"
        >
          {getTypeIcon(inputType)}
          {getTypeLabel(inputType)}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRegenerateTitle}
          disabled={isRegeneratingTitle}
        >
          <RefreshCw className={`h-4 w-4 ${isRegeneratingTitle ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="flex items-center text-xs md:text-sm text-muted-foreground">
        <CalendarIcon className="mr-1 h-4 w-4" />
        {new Date(createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};