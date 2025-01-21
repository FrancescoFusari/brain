import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TagCardProps {
  tag: string;
  count: number;
  onClick: () => void;
}

export const TagCard = ({ tag, count, onClick }: TagCardProps) => {
  return (
    <Card 
      className="bg-muted/50 border-border/10 cursor-pointer hover:bg-muted/70 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="p-3 md:p-4 space-y-2">
        <Badge variant="outline" className="text-xs inline-block">
          {tag}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {count} note{count !== 1 ? 's' : ''}
        </p>
      </CardHeader>
    </Card>
  );
};