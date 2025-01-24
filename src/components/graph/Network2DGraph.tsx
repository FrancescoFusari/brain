import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { Note } from '@/types/graph';
import { NetworkNode, processNetworkData } from '@/utils/networkGraphUtils';
import { useTagCategories } from '@/hooks/useTagCategories';

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
  const { savedCategories, lifeSections } = useTagCategories();

  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data with categories and sections
    const { nodes, links } = processNetworkData(notes, savedCategories, lifeSections);

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

    // Set initial zoom level
    svg.call(zoom as any)
      .call(zoom.transform as any, d3.zoomIdentity.scale(0.2));

    // Create the simulation with adjusted forces
    const simulation = d3.forceSimulation(nodesData)
      .force("link", d3.forceLink(linksData).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("x", d3.forceX(dimensions.width / 2))
      .force("y", d3.forceY(dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(d => getNodeRadius(d as NetworkNode) * 1.5));

    // Add links with thinner width and less opacity
    const link = g.append("g")
      .selectAll("line")
      .data(linksData)
      .join("line")
      .attr("stroke", theme === 'dark' ? '#8E9196' : '#2A2A2E')
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", 0.5);

    // Helper function to get node radius based on type
    const getNodeRadius = (d: NetworkNode) => {
      switch (d.type) {
        case 'section': return 16;
        case 'category': return 12;
        case 'note': return 10;
        default: return 6;
      }
    };

    // Helper function to get node color based on type
    const getNodeColor = (d: NetworkNode) => {
      switch (d.type) {
        case 'section': return '#9333ea';   // Purple for sections
        case 'category': return '#f59e0b';  // Amber for categories
        case 'note': return '#ef4444';      // Red for notes
        default: return '#22c55e';          // Green for tags
      }
    };

    // Add nodes with different sizes based on type
    const node = g.append("g")
      .selectAll("circle")
      .data(nodesData)
      .join("circle")
      .attr("r", d => getNodeRadius(d as NetworkNode))
      .attr("fill", d => getNodeColor(d as NetworkNode))
      .attr("stroke", theme === 'dark' ? '#1B1B1F' : '#ffffff')
      .attr("stroke-width", 1.5)
      .call(drag(simulation) as any);

    // Add node labels with different sizes based on type
    const labels = g.append("g")
      .selectAll("text")
      .data(nodesData)
      .join("text")
      .text((d: NetworkNode) => d.name)
      .attr("font-size", (d: NetworkNode) => {
        switch (d.type) {
          case 'section': return '12px';
          case 'category': return '10px';
          case 'note': return '9px';
          default: return '8px';
        }
      })
      .attr("dx", (d: NetworkNode) => getNodeRadius(d) + 4)
      .attr("dy", 3)
      .style("pointer-events", "none")
      .style("fill", theme === 'dark' ? '#E0E0D7' : '#2A2A2E');

    // Add node click handler
    node.on("click", (event: MouseEvent, d: NetworkNode) => {
      if (d.type === 'note' && d.originalNote) {
        navigate(`/note/${d.originalNote.id}`);
      } else {
        toast({
          title: `${d.type.charAt(0).toUpperCase() + d.type.slice(1)}: ${d.name}`,
          description: `Connected to ${d.connections?.length || 0} items`,
        });
      }
    });

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
  }, [dimensions, notes, theme, navigate, toast, savedCategories, lifeSections]);

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