import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { Note } from '@/types/graph';
import { NetworkNode, processNetworkData } from '@/utils/networkGraphUtils';

interface Network2DGraphProps {
  notes: Note[];
  onNodeSelect?: (node: NetworkNode) => void;
}

export const Network2DGraph = ({ notes, onNodeSelect }: Network2DGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown>>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, true);

  const focusNode = (node: NetworkNode) => {
    if (!svgRef.current || !zoomRef.current || !node.x || !node.y) {
      console.warn("Cannot focus on node, missing references or coordinates:", { node });
      return;
    }

    console.log("Focusing on 2D node:", node);

    const svg = d3.select(svgRef.current);
    const distance = node.type === 'section' ? 120 : 
                    node.type === 'category' ? 80 : 40;

    // Calculate the target transform
    const scale = 1.2;
    const x = dimensions.width / 2 - (node.x * scale);
    const y = dimensions.height / 2 - (node.y * scale);

    // Animate to the new position
    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(x, y).scale(scale)
      );
  };

  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = processNetworkData(notes);

    // Create a copy of the data to avoid mutation
    const nodesData = nodes.map(d => ({...d}));
    const linksData = links.map(d => ({...d}));

    // Create SVG with zoom support
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, dimensions.width, dimensions.height])
      .attr("style", "max-width: 100%; height: 100%;");

    // Add zoom behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    // Store zoom reference for later use
    zoomRef.current = zoom;

    // Set initial zoom level to show graph from further away
    svg.call(zoom as any)
      .call(zoom.transform as any, d3.zoomIdentity.scale(0.2));

    // Create the simulation with increased forces for better spacing
    const simulation = d3.forceSimulation(nodesData)
      .force("link", d3.forceLink(linksData).id((d: any) => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("x", d3.forceX(dimensions.width / 2))
      .force("y", d3.forceY(dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Add links with thinner width and less opacity
    const link = g.append("g")
      .selectAll("line")
      .data(linksData)
      .join("line")
      .attr("stroke", theme === 'dark' ? '#8E9196' : '#2A2A2E')
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 0.5);

    // Add nodes with different sizes for notes and tags
    const node = g.append("g")
      .selectAll("circle")
      .data(nodesData)
      .join("circle")
      .attr("r", (d: NetworkNode) => {
        if (d.type === 'section') return 16;
        if (d.type === 'category') return 12;
        if (d.type === 'note') return 8;
        return 4; // tags
      })
      .attr("fill", (d: NetworkNode) => {
        if (d.type === 'section') return '#9333EA';
        if (d.type === 'category') return '#2563EB';
        if (d.type === 'note') return '#EF7234';
        return '#E0E0D7'; // tags
      })
      .attr("stroke", theme === 'dark' ? '#1B1B1F' : '#ffffff')
      .attr("stroke-width", 1.5)
      .call(drag(simulation) as any);

    // Add node labels only for notes
    const labels = g.append("g")
      .selectAll("text")
      .data(nodesData.filter(d => d.type === 'note'))
      .join("text")
      .text((d: NetworkNode) => d.name)
      .attr("font-size", "8px")
      .attr("dx", 8)
      .attr("dy", 3)
      .style("pointer-events", "none")
      .style("fill", theme === 'dark' ? '#E0E0D7' : '#2A2A2E');

    // Add node click handler
    node.on("click", (event: MouseEvent, d: NetworkNode) => {
      if (onNodeSelect) {
        onNodeSelect(d);
      } else if (d.type === 'note' && d.originalNote) {
        navigate(`/note/${d.originalNote.id}`);
      } else {
        toast({
          title: `${d.type === 'tag' ? 'Tag' : 'Note'}: ${d.name}`,
          description: `Connected to ${d.connections?.length || 0} items`,
        });
      }
    });

    // Add double click to zoom
    svg.on("dblclick.zoom", null);
    
    // Reset zoom on double click
    svg.on("dblclick", () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity.scale(0.2));
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [dimensions, notes, theme, navigate, toast, onNodeSelect]);

  // Drag functions
  const drag = (simulation: d3.Simulation<any, undefined>) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};