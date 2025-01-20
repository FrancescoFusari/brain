import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { GraphSearch } from "@/components/graph/GraphSearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";
import { ForceGraphMethods } from "react-force-graph-3d";
import { NetworkNode, processNetworkData } from "@/utils/networkGraphUtils";
import { useToast } from "@/hooks/use-toast";

const Network3DPage = () => {
  const graphRef = useRef<ForceGraphMethods>();
  const { toast } = useToast();
  
  const { data: notes = [], error, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log('Fetching notes...');
      try {
        const { data, error } = await supabase
          .from('notes')
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
          description: "Please try refreshing the page or check your connection",
          variant: "destructive",
        });
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const { nodes } = processNetworkData(notes);

  const handleNodeSelect = (node: NetworkNode) => {
    if (!graphRef.current) return;
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    graphRef.current.cameraPosition(
      { 
        x: (node.x || 0) * distRatio, 
        y: (node.y || 0) * distRatio, 
        z: (node.z || 0) * distRatio 
      },
      { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
      1000
    );
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error loading graph data.</p>
          <p>Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-secondary">Loading graph data...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <GraphSearch nodes={nodes} onNodeSelect={handleNodeSelect} />
      <div className="w-full h-screen pt-16 pb-16 md:pb-0">
        <Network3DGraph ref={graphRef} notes={notes} />
      </div>
    </div>
  );
};

export default Network3DPage;