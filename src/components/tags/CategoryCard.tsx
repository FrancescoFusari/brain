import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  category: string;
  tags: string[];
  onTagClick: (tag: string) => void;
}

export const CategoryCard = ({ category, tags, onTagClick }: CategoryCardProps) => {
  return (
    <Card className="bg-muted/50 border-border/10">
      <CardHeader className="p-3 md:p-4">
        <h3 className="font-medium capitalize text-secondary mb-2">
          {category.split(': ')[1]}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge 
              key={tag}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
};