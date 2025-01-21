import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "./ui/skeleton";
import { useTags } from "@/hooks/useTags";
import { useTagCategories } from "@/hooks/useTagCategories";
import { TagCard } from "./tags/TagCard";
import { CategoryCard } from "./tags/CategoryCard";
import { NoteCard } from "./tags/NoteCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader } from "@/components/ui/card";

const BATCH_SIZE = 12;

export const TagView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [displayedNotes, setDisplayedNotes] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.1,
    delay: 100,
  });

  const { tagMap, sortedTags } = useTags();
  const { savedCategories, saveCategoriesMutation, lifeSections } = useTagCategories();

  const shouldShowCategorizeButton = () => {
    return sortedTags.length > 0 && (!savedCategories || Object.keys(savedCategories).length === 0);
  };

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

  const categorizeTags = async () => {
    setIsLoading(true);
    try {
      const allTags = Array.from(tagMap.keys());
      const { data, error } = await supabase.functions.invoke('categorize-tags', {
        body: { tags: allTags }
      });

      if (error) throw error;
      
      await saveCategoriesMutation.mutateAsync(data);
      
      toast({
        title: "Tags categorized",
        description: "Your tags have been organized and saved",
      });
    } catch (error) {
      console.error('Error categorizing tags:', error);
      toast({
        title: "Error",
        description: "Failed to categorize tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeCategories = async () => {
    if (!savedCategories) return;
    
    setIsCategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('categorize-categories', {
        body: { categories: savedCategories }
      });

      if (error) throw error;
      
      await saveCategoriesMutation.mutateAsync(data);
      
      toast({
        title: "Categories organized",
        description: "Your categories have been organized into life sections",
      });
    } catch (error) {
      console.error('Error categorizing categories:', error);
      toast({
        title: "Error",
        description: "Failed to organize categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
    }
  };

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
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {shouldShowCategorizeButton() && (
          <Button 
            onClick={categorizeTags} 
            disabled={isLoading}
            variant="outline"
            className="text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Categorizing...
              </>
            ) : (
              "Categorize Tags"
            )}
          </Button>
        )}
        {savedCategories && (
          <Button
            onClick={categorizeCategories}
            disabled={isCategorizing}
            variant="outline"
            className="text-sm"
          >
            {isCategorizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Organizing...
              </>
            ) : (
              "Organize Categories"
            )}
          </Button>
        )}
      </div>

      {Object.keys(lifeSections).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-secondary">Life Sections</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(lifeSections).map(([section, categories]) => (
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
      )}

      {savedCategories && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-secondary">Categories and Tags</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(savedCategories).map(([category, tags]) => (
              <CategoryCard
                key={category}
                category={category}
                tags={tags}
                onTagClick={handleTagSelect}
              />
            ))}
          </div>
        </div>
      )}

      {(!savedCategories || shouldShowCategorizeButton()) && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTags.map(([tag, notes]) => (
            <TagCard
              key={tag}
              tag={tag}
              count={notes.length}
              onClick={() => handleTagSelect(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
