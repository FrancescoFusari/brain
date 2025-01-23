import { useRef, useState, Suspense } from "react";
import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { ThreeGraph } from "@/components/graph/ThreeGraph";
import { GraphSearch } from "@/components/graph/GraphSearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ForceGraphMethods } from "react-force-graph-3d";
import { ThreeGraphMethods } from "@/components/graph/NetworkThreeGraph";
import { NetworkNode, processNetworkData } from "@/utils/networkGraphUtils";
import { Button } from "@/components/ui/button";
import { Box, Square } from "lucide-react";
import { Network2DGraph } from "@/components/graph/Network2DGraph";
import { NetworkFourGraph, FourGraphMethods } from "@/components/graph/NetworkFourGraph";

const GraphLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const Network3DPage = () => {
  const forceGraphRef = useRef<ForceGraphMethods>();
  const threeGraphRef = useRef<ThreeGraphMethods>();
  const fourGraphRef = useRef<FourGraphMethods>();
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'three' | 'four'>('three');
  
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
    if (!forceGraphRef.current || viewMode !== '3d') return;
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    forceGraphRef.current.cameraPosition(
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
          {viewMode === '3d' && (
            <Network3DGraph ref={forceGraphRef} notes={notes} />
          )}
          {viewMode === '2d' && (
            <Network2DGraph notes={notes} />
          )}
          {viewMode === 'three' && (
            <ThreeGraph ref={threeGraphRef} notes={notes} />
          )}
          {viewMode === 'four' && (
            <NetworkFourGraph ref={fourGraphRef} notes={notes} />
          )}
        </Suspense>
      </div>
      <div className="absolute inset-x-0 top-0 z-10">
        <GraphSearch nodes={nodes} onNodeSelect={handleNodeSelect} />
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
        >
          {viewMode === '3d' ? <Square className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => setViewMode(viewMode === 'three' ? '3d' : 'three')}
        >
          <Box className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm font-medium"
          onClick={() => setViewMode(viewMode === 'four' ? '3d' : 'four')}
        >
          4
        </Button>
      </div>
    </div>
  );
};

export default Network3DPage;