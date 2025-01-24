import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraphSearch } from "@/components/graph/GraphSearch";
import { NetworkNode } from "@/utils/networkGraphUtils";

const NotesListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log('Fetching notes...');
      try {
        const { data, error } = await supabase
          .from('combined_notes_view')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Notes fetched successfully:', data);
        return data || [];
      } catch (err) {
        console.error('Error fetching notes:', err);
        toast({
          title: "Error fetching notes",
          description: "Please try again later or check your connection",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  // Convert notes to network nodes format for search
  const networkNodes: NetworkNode[] = notes?.map(note => ({
    id: note.id,
    name: note.content?.split('\n')[0].substring(0, 30) + '...' || '',
    type: 'note',
    value: 1,
    originalNote: note,
    connections: note.tags || []
  })) || [];

  const filteredNotes = notes?.filter(note => 
    searchQuery ? (
      note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : true
  );

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1">
        <div className="container mx-auto pt-2 pb-4 md:pt-4 md:pb-8 px-2 md:px-4">
          <div className="flex flex-col space-y-2 md:space-y-6">
            <h1 className="text-2xl font-semibold text-secondary">Vault</h1>
            <div className="relative w-full">
              <GraphSearch 
                nodes={networkNodes}
                onNodeSelect={(node) => {
                  if (node.type === 'note') {
                    setSearchQuery(node.name);
                  }
                }}
              />
            </div>
            {isLoading ? (
              <div className="text-center py-12 text-secondary">Loading notes...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-12">
                Error loading notes. Please try refreshing the page.
              </div>
            ) : (
              <NoteList notes={filteredNotes || []} />
            )}
          </div>
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default NotesListPage;