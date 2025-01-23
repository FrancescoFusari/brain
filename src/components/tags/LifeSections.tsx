import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";

interface LifeSectionsProps {
  sections: Record<string, string[]>;
}

export const LifeSections = memo(({ sections }: LifeSectionsProps) => {
  if (Object.keys(sections).length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-secondary">Life Sections</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(sections).map(([section, categories]) => (
          <Card key={section} className="bg-muted/50 border-border/10">
            <CardHeader className="p-3 md:p-4">
              <h3 className="font-medium capitalize text-secondary mb-2">{section}</h3>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(category => (
                  <Badge 
                    key={category}
                    variant="outline"
                    className="capitalize text-xs"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
});

LifeSections.displayName = "LifeSections";