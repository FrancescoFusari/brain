import { Note } from '@/types/graph';
import * as d3 from 'd3';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag' | 'category' | 'section';
  value: number;
  originalNote?: Note;
  connections?: string[];
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  tagUsageCount: Map<string, number>;
  colorScale: d3.ScaleLinear<string, string>;
}

export const processNetworkData = (notes: Note[], categories?: Record<string, string[]>, lifeSections?: Record<string, string[]>): NetworkData => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const nodeMap = new Map<string, NetworkNode>();
  const tagUsageCount = new Map<string, number>();

  // Add life sections first (highest level)
  if (lifeSections) {
    Object.entries(lifeSections).forEach(([section, _]) => {
      const sectionNode: NetworkNode = {
        id: `section-${section}`,
        name: section,
        type: 'section',
        value: 3,
        connections: []
      };
      nodes.push(sectionNode);
      nodeMap.set(sectionNode.id, sectionNode);
    });
  }

  // Add categories (second level)
  if (categories) {
    Object.entries(categories).forEach(([category, tags]) => {
      const [section] = category.split(': ');
      const categoryNode: NetworkNode = {
        id: `category-${category}`,
        name: category.split(': ')[1] || category,
        type: 'category',
        value: 2,
        connections: []
      };
      nodes.push(categoryNode);
      nodeMap.set(categoryNode.id, categoryNode);

      // Link category to section
      if (section && nodeMap.has(`section-${section}`)) {
        links.push({
          source: `section-${section}`,
          target: categoryNode.id,
          value: 2
        });
      }
    });
  }

  // Process notes and tags
  notes.forEach(note => {
    const noteNode: NetworkNode = {
      id: `note-${note.id}`,
      name: note.tags[0] || note.content.split('\n')[0].substring(0, 30) + '...',
      type: 'note',
      value: 2,
      originalNote: note,
      connections: note.tags.map(tag => `tag-${tag}`)
    };
    nodes.push(noteNode);
    nodeMap.set(noteNode.id, noteNode);

    // Process tags
    note.tags.forEach(tag => {
      const tagId = `tag-${tag}`;
      const currentCount = (tagUsageCount.get(tag) || 0) + 1;
      tagUsageCount.set(tag, currentCount);
      
      let tagNode = nodeMap.get(tagId);
      if (!tagNode) {
        tagNode = {
          id: tagId,
          name: tag,
          type: 'tag',
          value: 1,
          connections: []
        };
        nodes.push(tagNode);
        nodeMap.set(tagId, tagNode);
      }
      
      if (tagNode.connections) {
        tagNode.connections.push(noteNode.id);
      }

      // Link tag to note
      links.push({
        source: noteNode.id,
        target: tagId,
        value: 1
      });

      // Link tag to category if it exists in the categories
      if (categories) {
        Object.entries(categories).forEach(([category, categoryTags]) => {
          if (categoryTags.includes(tag)) {
            links.push({
              source: `category-${category}`,
              target: tagId,
              value: 1.5
            });
          }
        });
      }
    });
  });

  const maxUsage = Math.max(...Array.from(tagUsageCount.values()));
  const colorScale = d3.scaleLinear<string>()
    .domain([0, maxUsage])
    .range(['#60a5fa', '#f59e0b'])
    .interpolate(d3.interpolateHcl);

  return { nodes, links, tagUsageCount, colorScale };
};