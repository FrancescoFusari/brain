import { useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { Note } from '@/types/graph';
import { NetworkNode, processNetworkData } from '@/utils/networkGraphUtils';

interface Network2DGraphProps {
  notes: Note[];
}

export const Network2DGraph = ({ notes }: Network2DGraphProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, true);

  // Initialize graph with optimized settings
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    // Wait for the next tick to ensure D3 forces are initialized
    setTimeout(() => {
      const charge = fg.d3Force('charge');
      if (charge) {
        charge.strength(-100)
              .distanceMax(200);
      }

      const link = fg.d3Force('link');
      if (link) {
        link.distance(40)
            .strength(0.2);
      }

      const collision = fg.d3Force('collision');
      if (collision) {
        collision.radius(20)
                .strength(0.7)
                .iterations(1);
      }

      const center = fg.d3Force('center');
      if (center) {
        center.strength(0.05);
      }

      // Zoom to fit after forces are configured
      fg.zoomToFit(250, 10);
    }, 250);

    return () => {
      if (fg) {
        fg.pauseAnimation();
      }
    };
  }, []);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      navigate(`/note/${node.originalNote.id}`);
    } else {
      toast({
        title: `${node.type === 'tag' ? 'Tag' : 'Note'}: ${node.name}`,
        description: `Connected to ${node.connections?.length || 0} items`,
      });
    }
  }, [navigate, toast]);

  const { nodes, links } = processNetworkData(notes);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeLabel="name"
        nodeRelSize={6}
        linkWidth={1}
        nodeColor={(node: NetworkNode) => node.type === 'note' ? '#EF7234' : '#E0E0D7'}
        linkColor={() => theme === 'dark' ? '#8E9196' : '#2A2A2E'}
        backgroundColor={theme === 'dark' ? '#1B1B1F' : '#ffffff'}
        onNodeClick={handleNodeClick}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={50}
        cooldownTime={2000}
        warmupTicks={20}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};