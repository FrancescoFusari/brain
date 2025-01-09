import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
  };
}

export const NoteCard = ({ note }: NoteCardProps) => {
  return (
    <Card className="note-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-primary">
            {note.category}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-1 h-4 w-4" />
          {new Date(note.created_at).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{note.content}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="tag">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};