import { Card, CardHeader } from "@/components/ui/card";

interface NoteCardProps {
  title: string;
  content: string;
  onClick: () => void;
}

export const NoteCard = ({ title, content, onClick }: NoteCardProps) => {
  return (
    <Card 
      className="note-card bg-muted/50 border-border/10 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="p-3 md:p-4 space-y-2">
        <h3 className="font-medium text-sm md:text-base text-secondary line-clamp-1">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
          {content}
        </p>
      </CardHeader>
    </Card>
  );
};