import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

export const useTags = () => {
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log("Fetching notes for tags...");
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
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

  return { notes, tagMap, sortedTags };
};