import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";

interface LifeSectionsProps {
  sections: string[];
}

export const LifeSections = memo(({ sections }: LifeSectionsProps) => {
  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-secondary">Life Sections</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section} className="bg-muted/50 border-border/10">
            <CardHeader className="p-3 md:p-4">
              <h3 className="font-medium capitalize text-secondary">{section}</h3>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
});

LifeSections.displayName = "LifeSections";