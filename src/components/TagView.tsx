import { useState, useCallback, useEffect, memo } from "react";
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
import { saveNotesToOfflineStorage } from "@/utils/offlineStorage";
import { useToast } from "./ui/use-toast";
import { Note } from "@/types/note";

const BATCH_SIZE = 12;

// Memoize the main content component
const TagViewContent = memo(({ selectedTag, displayedNotes, hasMore, intersectionRef }: any) => {
  const navigate = useNavigate();

  if (!selectedTag) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to all tags
        </Button>
        <Badge variant="outline" className="text-sm text-secondary">
          {selectedTag} ({displayedNotes.length})
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
});

TagViewContent.displayName = "TagViewContent";

// Memoize the overview component
const TagOverview = memo(({ savedCategories, lifeSections, onTagClick, sortedTags }: {
  savedCategories: Record<string, string[]> | null;
  lifeSections: string[];
  onTagClick: (tag: string) => void;
  sortedTags: [string, Note[]][];
}) => {
  return (
    <div className="space-y-6">
      <TagCategorization />
      <LifeSections sections={lifeSections} />
      {savedCategories && (
        <CategoriesGrid 
          categories={savedCategories} 
          onTagClick={onTagClick} 
        />
      )}
      {(!savedCategories || Object.keys(savedCategories).length === 0) && (
        <TagsGrid 
          tags={sortedTags} 
          onTagClick={onTagClick} 
        />
      )}
    </div>
  );
});

TagOverview.displayName = "TagOverview";

export const TagView = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [displayedNotes, setDisplayedNotes] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.1,
    delay: 100,
  });

  const { tagMap, sortedTags, notes } = useTags();
  const { savedCategories, lifeSections } = useTagCategories();

  // Save notes to offline storage whenever they change
  useEffect(() => {
    if (notes && notes.length > 0) {
      saveNotesToOfflineStorage(notes)
        .then(() => {
          console.log('Notes saved to offline storage');
        })
        .catch(error => {
          console.error('Error saving notes to offline storage:', error);
          toast({
            title: "Offline Storage Error",
            description: "Failed to save notes for offline access",
            variant: "destructive",
          });
        });
    }
  }, [notes, toast]);

  const handleTagSelect = useCallback((tag: string) => {
    const tagNotes = tagMap.get(tag) || [];
    setSelectedTag(tag);
    setDisplayedNotes(tagNotes.slice(0, BATCH_SIZE));
    setHasMore(tagNotes.length > BATCH_SIZE);
  }, [tagMap]);

  const loadMoreNotes = useCallback(() => {
    if (!selectedTag || !hasMore) return;
    
    const tagNotes = tagMap.get(selectedTag) || [];
    const currentLength = displayedNotes.length;
    const nextBatch = tagNotes.slice(0, currentLength + BATCH_SIZE);
    
    setDisplayedNotes(nextBatch);
    setHasMore(nextBatch.length < tagNotes.length);
  }, [selectedTag, tagMap, displayedNotes.length, hasMore]);

  // Load more notes when scrolling to the bottom
  useEffect(() => {
    if (inView && hasMore) {
      loadMoreNotes();
    }
  }, [inView, hasMore, loadMoreNotes]);

  if (selectedTag) {
    return (
      <TagViewContent 
        selectedTag={selectedTag}
        displayedNotes={displayedNotes}
        hasMore={hasMore}
        intersectionRef={intersectionRef}
      />
    );
  }

  return (
    <TagOverview
      savedCategories={savedCategories}
      lifeSections={lifeSections}
      onTagClick={handleTagSelect}
      sortedTags={sortedTags}
    />
  );
};