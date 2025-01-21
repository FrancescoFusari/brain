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
}

export const Network2DGraph = ({ notes }: Network2DGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, true);

  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = processNetworkData(notes);

    // Create a copy of the data to avoid mutation
    const nodesData = nodes.map(d => ({...d}));
    const linksData = links.map(d => ({...d}));

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height])
      .attr("style", "max-width: 100%; height: auto;");

    // Create the simulation
    const simulation = d3.forceSimulation(nodesData)
      .force("link", d3.forceLink(linksData).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force("collision", d3.forceCollide().radius(30));

    // Add links
    const link = svg.append("g")
      .selectAll("line")
      .data(linksData)
      .join("line")
      .attr("stroke", theme === 'dark' ? '#8E9196' : '#2A2A2E')
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    // Add nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodesData)
      .join("circle")
      .attr("r", 6)
      .attr("fill", (d: NetworkNode) => d.type === 'note' ? '#EF7234' : '#E0E0D7')
      .attr("stroke", theme === 'dark' ? '#1B1B1F' : '#ffffff')
      .attr("stroke-width", 1.5)
      .call(drag(simulation) as any);

    // Add node labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(nodesData)
      .join("text")
      .text((d: NetworkNode) => d.name)
      .attr("font-size", "8px")
      .attr("dx", 8)
      .attr("dy", 3)
      .style("pointer-events", "none")
      .style("fill", theme === 'dark' ? '#E0E0D7' : '#2A2A2E');

    // Add node click handler
    node.on("click", (event: MouseEvent, d: NetworkNode) => {
      if (d.type === 'note' && d.originalNote) {
        navigate(`/note/${d.originalNote.id}`);
      } else {
        toast({
          title: `${d.type === 'tag' ? 'Tag' : 'Note'}: ${d.name}`,
          description: `Connected to ${d.connections?.length || 0} items`,
        });
      }
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
  }, [dimensions, notes, theme, navigate, toast]);

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
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
};