import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';

interface TagRelationship {
  id: string;
  parent_tag: string;
  child_tag: string;
  user_id: string;
}

interface TagHierarchyDendrogramProps {
  relationships: TagRelationship[];
}

export const TagHierarchyDendrogram = ({ relationships }: TagHierarchyDendrogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!svgRef.current || relationships.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data into hierarchical structure
    const hierarchyData: { name: string; children?: any[] } = { name: "Tags" };
    const parentNodes = new Map<string, { name: string; children: any[] }>();

    relationships.forEach(rel => {
      if (!parentNodes.has(rel.parent_tag)) {
        parentNodes.set(rel.parent_tag, { name: rel.parent_tag, children: [] });
      }
      parentNodes.get(rel.parent_tag)?.children.push({ name: rel.child_tag });
    });

    hierarchyData.children = Array.from(parentNodes.values());

    // Setup dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const radius = Math.min(width, height) / 2;

    // Create the radial cluster layout
    const tree = d3.cluster()
      .size([2 * Math.PI, radius - 100]);

    const root = d3.hierarchy(hierarchyData);
    tree(root);

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    // Create links
    svg.selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", d3.linkRadial()
        .angle((d: any) => d.x)
        .radius((d: any) => d.y))
      .attr("fill", "none")
      .attr("stroke", theme === 'dark' ? '#475569' : '#94a3b8')
      .attr("stroke-width", 1);

    // Create nodes
    const nodes = svg.selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => 
        `translate(${d3.pointRadial(d.x, d.y)[0]},${d3.pointRadial(d.x, d.y)[1]})`
      );

    // Add circles at nodes
    nodes.append("circle")
      .attr("r", 4)
      .attr("fill", theme === 'dark' ? '#e2e8f0' : '#1e293b');

    // Add labels
    nodes.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => d.x < Math.PI ? 6 : -6)
      .attr("text-anchor", (d: any) => d.x < Math.PI ? "start" : "end")
      .attr("transform", (d: any) => d.x >= Math.PI ? "rotate(180)" : null)
      .text((d: any) => d.data.name)
      .attr("fill", theme === 'dark' ? '#e2e8f0' : '#1e293b')
      .attr("font-size", "12px");

  }, [relationships, theme]);

  return (
    <div className="w-full h-[500px] relative">
      <svg 
        ref={svgRef}
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      />
    </div>
  );
};