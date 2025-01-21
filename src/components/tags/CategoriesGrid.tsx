import { CategoryCard } from "./CategoryCard";
import { memo } from "react";

interface CategoriesGridProps {
  categories: Record<string, string[]>;
  onTagClick: (tag: string) => void;
}

export const CategoriesGrid = memo(({ categories, onTagClick }: CategoriesGridProps) => {
  if (!categories) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-secondary">Categories and Tags</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categories).map(([category, tags]) => (
          <CategoryCard
            key={category}
            category={category}
            tags={tags}
            onTagClick={onTagClick}
          />
        ))}
      </div>
    </div>
  );
});

CategoriesGrid.displayName = "CategoriesGrid";