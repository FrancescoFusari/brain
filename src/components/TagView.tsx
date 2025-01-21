import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "./ui/skeleton";
import { useTags } from "@/hooks/useTags";
import { useTagCategories } from "@/hooks/useTagCategories";
import { NoteCard } from "./tags/NoteCard";
import { TagCategorization } from "./tags/TagCategorization";
import { LifeSections } from "./tags/LifeSections";
import { CategoriesGrid } from "./tags/CategoriesGrid";
import { TagsGrid } from "./tags/TagsGrid";

const BATCH_SIZE = 12;

export const TagView = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [displayedNotes, setDisplayedNotes] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.1,
    delay: 100,
  });

  const { tagMap, sortedTags } = useTags();
  const { savedCategories, lifeSections } = useTagCategories();

  const loadMoreNotes = useCallback(() => {
    if (!selectedTag) return;
    
    const tagNotes = tagMap.get(selectedTag) || [];
    const currentLength = displayedNotes.length;
    const nextBatch = tagNotes.slice(0, currentLength + BATCH_SIZE);
    
    setDisplayedNotes(nextBatch);
    setHasMore(nextBatch.length < tagNotes.length);
  }, [selectedTag, tagMap, displayedNotes.length]);

  const handleTagSelect = useCallback((tag: string) => {
    const tagNotes = tagMap.get(tag) || [];
    setSelectedTag(tag);
    setDisplayedNotes(tagNotes.slice(0, BATCH_SIZE));
    setHasMore(tagNotes.length > BATCH_SIZE);
  }, [tagMap]);

  // Load more notes when scrolling to the bottom
  useEffect(() => {
    if (inView && hasMore) {
      loadMoreNotes();
    }
  }, [inView, hasMore, loadMoreNotes]);

  if (selectedTag) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedTag(null)}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to all tags
          </Button>
          <Badge variant="outline" className="text-sm text-secondary">
            {selectedTag} ({tagMap.get(selectedTag)?.length || 0})
          </Badge>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {displayedNotes.map(note => (
            <NoteCard
              key={note.id}
              title={note.content.split('\n')[0]}
              content={note.content}
              onClick={() => navigate(`/note/${note.id}`)}
            />
          ))}
        </div>
        
        {hasMore && (
          <div 
            ref={intersectionRef}
            className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4"
          >
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TagCategorization />
      <LifeSections sections={lifeSections} />
      {savedCategories && (
        <CategoriesGrid 
          categories={savedCategories} 
          onTagClick={handleTagSelect} 
        />
      )}
      {(!savedCategories || Object.keys(savedCategories).length === 0) && (
        <TagsGrid 
          tags={sortedTags} 
          onTagClick={handleTagSelect} 
        />
      )}
    </div>
  );
};