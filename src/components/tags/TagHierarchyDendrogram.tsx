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

interface HierarchyData {
  name: string;
  children?: HierarchyData[];
}

export const TagHierarchyDendrogram = ({ relationships }: TagHierarchyDendrogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!svgRef.current || relationships.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data into hierarchical structure
    const hierarchyData: HierarchyData = { name: "Tags" };
    const parentNodes = new Map<string, HierarchyData>();

    relationships.forEach(rel => {
      if (!parentNodes.has(rel.parent_tag)) {
        parentNodes.set(rel.parent_tag, { name: rel.parent_tag, children: [] });
      }
      parentNodes.get(rel.parent_tag)?.children?.push({ name: rel.child_tag });
    });

    hierarchyData.children = Array.from(parentNodes.values());

    // Setup dimensions with more space
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const cx = width * 0.5;
    const cy = height * 0.54;
    // Increased radius to give more space
    const radius = Math.min(width, height) / 2 - 120;

    // Create the radial cluster layout with increased separation
    const tree = d3.cluster<HierarchyData>()
      .size([2 * Math.PI, radius])
      // Increased separation between nodes
      .separation((a, b) => (a.parent == b.parent ? 1.5 : 3) / a.depth);

    // Sort and apply the layout
    const root = tree(d3.hierarchy(hierarchyData)
      .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

    // Create the SVG container with more padding
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-cx, -cy, width, height])
      .attr("style", "width: 100%; height: auto; font: 13px sans-serif;"); // Increased font size

    // Create links
    const linkGenerator = d3.linkRadial<any, any>()
      .angle((d: any) => d.x)
      .radius((d: any) => d.y);

    svg.append("g")
      .attr("fill", "none")
      .attr("stroke", theme === 'dark' ? '#475569' : '#94a3b8')
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", linkGenerator);

    // Create nodes with larger radius
    svg.append("g")
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
      .attr("fill", d => d.children ? 
        (theme === 'dark' ? '#e2e8f0' : '#1e293b') : 
        (theme === 'dark' ? '#94a3b8' : '#475569'))
      .attr("r", d => d.children ? 4 : 3); // Increased node sizes

    // Add labels with more spacing
    svg.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90}) 
        translate(${d.y},0) 
        rotate(${d.x >= Math.PI ? 180 : 0})
      `)
      .attr("dy", "0.31em")
      .attr("x", d => d.x < Math.PI === !d.children ? 8 : -8) // Increased text offset
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("paint-order", "stroke")
      .attr("stroke", theme === 'dark' ? '#1B1B1F' : '#ffffff')
      .attr("fill", theme === 'dark' ? '#e2e8f0' : '#1e293b')
      .text(d => d.data.name);

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