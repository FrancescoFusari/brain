import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { processGraphData, getNodeColor, getLinkColor, getLinkWidth } from '@/utils/graphUtils';
import { GraphNode, GraphData, Note } from '@/types/graph';

interface NoteGraphProps {
  notes: Note[];
  highlightedNoteId?: string;
}

export const NoteGraph = ({ notes, highlightedNoteId }: NoteGraphProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.type === 'note') {
      navigate(`/note/${node.id}`);
    } else {
      toast({
        title: `${node.type === 'category' ? 'Category' : 'Tag'}: ${node.name}`,
        description: `Connected to ${
          graphData.links.filter(link => 
            link.source === node.id || link.target === node.id
          ).length
        } nodes`,
      });
    }
  }, [navigate, toast, graphData.links]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(isMobile ? -100 : -150);
      graphRef.current.d3Force('link').distance(isMobile ? 60 : 100);
    }
  }, [isMobile]);

  useEffect(() => {
    setGraphData(processGraphData(notes, highlightedNoteId, theme, isMobile));
  }, [notes, highlightedNoteId, theme, isMobile]);

  useEffect(() => {
    if (highlightedNoteId && graphRef.current) {
      const node = graphData.nodes.find((n: GraphNode) => n.id === highlightedNoteId);
      if (node) {
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(2.5, 1000);
      }
    }
  }, [highlightedNoteId, graphData]);

  return (
    <div 
      ref={containerRef} 
      className="w-full border rounded-lg overflow-hidden bg-background"
      style={{ height: dimensions.height }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => getNodeColor(node as GraphNode, hoveredNode, graphData, theme)}
        nodeRelSize={isMobile ? 4 : 6}
        linkColor={link => getLinkColor(link, hoveredNode, theme)}
        linkWidth={link => getLinkWidth(link, hoveredNode)}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNode}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={isMobile ? 50 : 100}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(400, 50);
        }}
      />
    </div>
  );
};