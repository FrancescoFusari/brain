import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { NoteCard } from "./NoteCard";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "./ui/skeleton";

interface Note {
  id: string;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  input_type?: string | null;
  source_url?: string | null;
  source_image_path?: string | null;
}

interface NoteListProps {
  notes: Note[];
}

const BATCH_SIZE = 12;

export const NoteList = ({ notes }: NoteListProps) => {
  const [displayedNotes, setDisplayedNotes] = useState<Note[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.1,
    delay: 100,
  });

  // Memoize sorted notes
  const sortedNotes = useMemo(() => {
    if (!notes || notes.length === 0) return [];
    return [...notes].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notes]);

  // Initialize with first batch
  useEffect(() => {
    if (!sortedNotes.length) return;
    setDisplayedNotes(sortedNotes.slice(0, BATCH_SIZE));
    setHasMore(sortedNotes.length > BATCH_SIZE);
    loadingRef.current = false;
  }, [sortedNotes]);

  // Memoize load more callback
  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    
    loadingRef.current = true;
    setTimeout(() => {
      setDisplayedNotes(prev => {
        const nextBatch = sortedNotes.slice(0, prev.length + BATCH_SIZE);
        setHasMore(nextBatch.length < sortedNotes.length);
        loadingRef.current = false;
        return nextBatch;
      });
    }, 300);
  }, [hasMore, sortedNotes]);

  // Load more notes when scrolling to the bottom
  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No notes yet. Start by adding one above!
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {displayedNotes.map((note) => (
          <NoteCard 
            key={note.id} 
            note={{
              ...note,
              content: note.content || '',
              tags: note.tags || []
            }} 
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
    </>
  );
};