import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "./ui/skeleton";
import type { Json } from "@/integrations/supabase/types";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface Categories {
  [key: string]: string[];
}

const BATCH_SIZE = 12;

export const TagView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [displayedNotes, setDisplayedNotes] = useState<Note[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.1,
    delay: 100,
  });

  // Add the missing mutation with proper types
  const saveCategoriesMutation = useMutation({
    mutationFn: async (categories: Categories) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const { data: existingData } = await supabase
        .from('tag_categories')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('tag_categories')
          .update({ categories: categories as Json })
          .eq('id', existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tag_categories')
          .insert([{ 
            categories: categories as Json,
            user_id: session.session.user.id 
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-categories'] });
    }
  });

  // Add the missing function
  const shouldShowCategorizeButton = () => {
    return sortedTags.length > 0 && (!savedCategories || Object.keys(savedCategories).length === 0);
  };

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log("Fetching notes for tags view...");
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    }
  });

  const { data: savedCategories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('categories')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.categories as Categories | null;
    }
  });

  const tagMap = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (!map.has(tag)) {
          map.set(tag, []);
        }
        map.get(tag)?.push(note);
      });
    });
    return map;
  }, [notes]);

  const sortedTags = useMemo(() => 
    Array.from(tagMap.entries())
      .sort((a, b) => b[1].length - a[1].length),
    [tagMap]
  );

  const lifeSections = useMemo(() => {
    if (!savedCategories) return {};
    
    const sections: Record<string, string[]> = {};
    Object.entries(savedCategories).forEach(([category]) => {
      const [section, name] = category.split(': ');
      if (!sections[section]) {
        sections[section] = [];
      }
      if (name && !sections[section].includes(name)) {
        sections[section].push(name);
      }
    });
    return sections;
  }, [savedCategories]);

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

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreNotes();
    }
  }, [inView, hasMore, loadMoreNotes]);

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

  const getPreviewContent = (content: string) => {
    const words = content.split(' ');
    return words.slice(0, 18).join(' ') + (words.length > 18 ? '...' : '');
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
            <Card 
              key={note.id}
              className="note-card bg-muted/50 border-border/10 cursor-pointer"
              onClick={() => navigate(`/note/${note.id}`)}
            >
              <CardHeader className="p-3 md:p-4 space-y-2">
                <h3 className="font-medium text-sm md:text-base text-secondary line-clamp-1">
                  {note.content.split('\n')[0]}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {getPreviewContent(note.content)}
                </p>
              </CardHeader>
            </Card>
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
              <Card key={category} className="bg-muted/50 border-border/10">
                <CardHeader className="p-3 md:p-4">
                  <h3 className="font-medium capitalize text-secondary mb-2">{category.split(': ')[1]}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <Badge 
                        key={tag}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!savedCategories || shouldShowCategorizeButton()) && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTags.map(([tag, tagNotes]) => (
            <Card 
              key={tag}
              className="bg-muted/50 border-border/10 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => handleTagSelect(tag)}
            >
              <CardHeader className="p-3 md:p-4 space-y-2">
                <Badge variant="outline" className="text-xs inline-block">
                  {tag}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {tagNotes.length} note{tagNotes.length !== 1 ? 's' : ''}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
