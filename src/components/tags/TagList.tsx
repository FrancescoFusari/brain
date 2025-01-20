import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

export const TagList = () => {
  const navigate = useNavigate();
  
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log('Fetching notes for tags...');
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }
      console.log('Notes fetched successfully:', data);
      return data as Note[];
    }
  });

  // Create a map of tags to notes
  const tagMap = new Map<string, Note[]>();
  notes.forEach(note => {
    note.tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)?.push(note);
    });
  });

  // Sort tags by number of notes (most used first)
  const sortedTags = Array.from(tagMap.entries())
    .sort((a, b) => b[1].length - a[1].length);

  if (isLoading) {
    return <div className="text-center text-secondary py-12">Loading tags...</div>;
  }

  if (sortedTags.length === 0) {
    return (
      <div className="text-center text-secondary py-12">
        No tags yet. Start by adding some notes!
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {sortedTags.map(([tag, tagNotes]) => (
        <Card 
          key={tag}
          className="bg-muted/50 border-border/10 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={() => navigate(`/tag/${tag}`)}
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
  );
};