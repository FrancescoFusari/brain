import { TagCard } from "./TagCard";
import { memo } from "react";
import { Note } from "@/types/note";

interface TagsGridProps {
  tags: [string, Note[]][];
  onTagClick: (tag: string) => void;
}

export const TagsGrid = memo(({ tags, onTagClick }: TagsGridProps) => {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {tags.map(([tag, notes]) => (
        <TagCard
          key={tag}
          tag={tag}
          count={notes.length}
          onClick={() => onTagClick(tag)}
        />
      ))}
    </div>
  );
});

TagsGrid.displayName = "TagsGrid";