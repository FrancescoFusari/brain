import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { GraphSearch } from "@/components/graph/GraphSearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState, Suspense } from "react";
import { ForceGraphMethods } from "react-force-graph-3d";
import { NetworkNode, processNetworkData } from "@/utils/networkGraphUtils";
import { Button } from "@/components/ui/button";
import { Box, Square } from "lucide-react";
import { Network2DGraph } from "@/components/graph/Network2DGraph";

// Loading component for the graph
const GraphLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const Network3DPage = () => {
  const graphRef = useRef<ForceGraphMethods>();
  const [is3D, setIs3D] = useState(true);
  
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { nodes } = processNetworkData(notes);

  const handleNodeSelect = (node: NetworkNode) => {
    if (!graphRef.current || !is3D) return;
    
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

  if (isLoading) {
    return <GraphLoader />;
  }

  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0">
        <Suspense fallback={<GraphLoader />}>
          {is3D ? (
            <Network3DGraph ref={graphRef} notes={notes} />
          ) : (
            <Network2DGraph notes={notes} />
          )}
        </Suspense>
      </div>
      <div className="absolute inset-x-0 top-0 z-10">
        <GraphSearch nodes={nodes} onNodeSelect={handleNodeSelect} />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
        onClick={() => setIs3D(!is3D)}
      >
        {is3D ? <Square className="h-4 w-4" /> : <Box className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default Network3DPage;