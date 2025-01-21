import { useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTagCategories } from '@/hooks/useTagCategories';

interface Network3DGraphProps {
  notes: Note[];
}

export interface ForceGraphMethods {
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  cameraPosition: (position: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, transitionMs?: number) => void;
  d3Force: (forceName: string, force?: any) => any;
}

export const Network3DGraph = forwardRef<ForceGraphMethods, Network3DGraphProps>(
  ({ notes }, ref) => {
    const localRef = useRef<ForceGraphMethods>();
    const isMobile = useIsMobile();
    const { savedCategories, lifeSections } = useTagCategories();
    
    // Memoize graph data processing
    const graphData = useMemo(() => 
      processNetworkData(notes, savedCategories, lifeSections), 
      [notes, savedCategories, lifeSections]
    );
    
    const { nodes, links } = graphData;

    // Initialize graph with optimized settings
    useEffect(() => {
      const fg = localRef.current;
      if (!fg) return;

      // Ensure nodes have initial positions
      nodes.forEach(node => {
        node.x = node.x || Math.random() * 100 - 50;
        node.y = node.y || Math.random() * 100 - 50;
        node.z = node.z || Math.random() * 100 - 50;
      });

      fg.pauseAnimation();
      fg.cameraPosition({ x: 0, y: 0, z: isMobile ? 300 : 200 });
      
      const forceStrength = isMobile ? -20 : -40;
      const distanceMax = isMobile ? 150 : 250;
      const linkDistance = isMobile ? 30 : 50;
      
      fg.d3Force('link')?.distance(linkDistance).strength(0.2);
      fg.d3Force('charge')?.strength(forceStrength).distanceMax(distanceMax);
      fg.d3Force('center')?.strength(0.05);
      
      fg.d3Force('collision', d3.forceCollide()
        .radius((node: NetworkNode) => {
          switch (node.type) {
            case 'section': return 12;    // Increased from 8
            case 'category': return 8;    // Increased from 6
            case 'note': return 5;        // Increased from 4
            default: return 3;            // Tags stay the same size
          }
        })
        .strength(0.9)
        .iterations(1)
      );

      const timer = setTimeout(() => fg.resumeAnimation(), 50);

      return () => {
        clearTimeout(timer);
        if (fg) fg.pauseAnimation();
      };
    }, [isMobile, nodes]);

    // Handle ref assignment
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(localRef.current || null);
        } else {
          ref.current = localRef.current || null;
        }
      }
    }, [ref]);

    const getNodeColor = useCallback((node: NetworkNode) => {
      switch (node.type) {
        case 'section': return '#9333ea';     // Purple - more vibrant
        case 'category': return '#f59e0b';    // Amber - more vibrant
        case 'note': return '#ef4444';        // Red - more vibrant
        default: return '#22c55e';            // Green - more vibrant for tags
      }
    }, []);

    const getNodeSize = useCallback((node: NetworkNode) => {
      switch (node.type) {
        case 'section': return isMobile ? 4.5 : 6;     // Increased from 3/4
        case 'category': return isMobile ? 3.5 : 4.5;  // Increased from 2.5/3.5
        case 'note': return isMobile ? 2.5 : 3.5;      // Increased from 2/3
        default: return isMobile ? 1.5 : 2;            // Tags stay the same size
      }
    }, [isMobile]);

    // Optimized node object creation
    const createNodeObject = useCallback((node: NetworkNode) => {
      if (!node) return null;  // Safety check for null nodes
      
      const group = new THREE.Group();
      
      const sphereGeometry = new THREE.SphereGeometry(getNodeSize(node));
      const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshLambertMaterial({ 
          color: getNodeColor(node),
          transparent: true,
          opacity: 0.85  // Slightly increased opacity
        })
      );
      group.add(sphere);
      
      // Only add text sprites for important nodes or on desktop
      if (!isMobile || ['section', 'category'].includes(node.type) || node.connections?.length > 3) {
        const sprite = new SpriteText(node.name);
        sprite.color = '#ffffff';
        sprite.textHeight = isMobile ? 2 : 3;  // Increased text size
        sprite.backgroundColor = 'rgba(0,0,0,0.6)';  // More opaque background
        sprite.padding = isMobile ? 0.8 : 1.2;  // Increased padding
        sprite.borderRadius = 3;
        (sprite as unknown as THREE.Object3D).position.set(getNodeSize(node) + 2, 0, 0);
        group.add(sprite);
      }
      
      return group;
    }, [isMobile, getNodeColor, getNodeSize]);

    // Optimized node drag handler with safety checks
    const handleNodeDragEnd = useCallback((node: NetworkNode) => {
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number' || typeof node.z !== 'number') {
        console.warn('Invalid node position during drag end:', node);
        return;
      }
      
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    }, []);

    return (
      <div className="w-full h-full">
        <ForceGraph3D
          ref={localRef as any}
          graphData={{ nodes, links }}
          nodeLabel={(node: NetworkNode) => `${node.type}: ${node.name}`}
          nodeThreeObject={createNodeObject}
          nodeColor={getNodeColor}
          backgroundColor="#1B1B1F"
          linkColor={() => "#8E9196"}
          linkWidth={0.3}  // Slightly increased from 0.2
          linkOpacity={0.4}  // Slightly increased from 0.3
          linkDirectionalParticles={0}
          enableNavigationControls={true}
          enableNodeDrag={true}
          onNodeDragEnd={handleNodeDragEnd}
          forceEngine="d3"
          cooldownTime={isMobile ? 1500 : 1000}
          cooldownTicks={isMobile ? 100 : 50}
          warmupTicks={isMobile ? 50 : 25}
          d3AlphaDecay={isMobile ? 0.03 : 0.01}
          d3VelocityDecay={isMobile ? 0.4 : 0.2}
          rendererConfig={{
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'high-performance'
          }}
        />
      </div>
    );
  }
);

Network3DGraph.displayName = "Network3DGraph";