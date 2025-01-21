import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueueTable } from "@/components/queue/QueueTable";
import { QueueMobileView } from "@/components/queue/QueueMobileView";
import { QueueFilters } from "@/components/queue/QueueFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";

const QueuePage = () => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["queue-items"],
    queryFn: async () => {
      console.log("Fetching queue items...");
      const { data, error } = await supabase
        .from("email_processing_queue")
        .select("*")
        .order("received_at", { ascending: false });

      if (error) {
        console.error("Error fetching queue items:", error);
        throw error;
      }

      console.log("Queue items fetched:", data);
      return data;
    },
    refetchInterval: 5000,
  });

  const processEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Processing email:', emailId);
      const { data, error } = await supabase.functions.invoke('process-email-to-note', {
        body: { emailId, userId: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, emailId) => {
      queryClient.invalidateQueries({ queryKey: ["queue-items"] });
      toast({
        title: "Email processed successfully",
        description: "The email has been converted to a note",
      });
      navigate(`/note/${data.note.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error processing email",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Memoized sender statistics
  const senderStats = useMemo(() => {
    if (!queueItems) return [];
    
    const stats: Record<string, number> = {};
    queueItems.forEach(item => {
      const senderName = extractSenderName(item.sender);
      stats[senderName] = (stats[senderName] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([sender, count]) => ({ sender, count }))
      .sort((a, b) => b.count - a.count);
  }, [queueItems]);

  // Memoized filtered queue items
  const filteredQueueItems = useMemo(() => {
    if (!queueItems) return [];
    
    let filtered = queueItems;
    
    if (selectedSender) {
      filtered = filtered.filter(item => 
        extractSenderName(item.sender) === selectedSender
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.sender.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.email_body && item.email_body.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [queueItems, searchQuery, selectedSender]);

  return (
    <div className="container mx-auto p-4 md:mt-16">
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-semibold">Processing Queue</h1>
        
        <QueueFilters
          senderStats={senderStats}
          selectedSender={selectedSender}
          setSelectedSender={setSelectedSender}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {isMobile ? (
          <QueueMobileView
            items={filteredQueueItems}
            onProcess={(id) => processEmailMutation.mutate(id)}
            isProcessing={processEmailMutation.isPending}
            processingId={processEmailMutation.variables}
          />
        ) : (
          <QueueTable
            items={filteredQueueItems}
            onProcess={(id) => processEmailMutation.mutate(id)}
            isProcessing={processEmailMutation.isPending}
            processingId={processEmailMutation.variables}
          />
        )}
      </div>
    </div>
  );
};

export default QueuePage;