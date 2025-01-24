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

    // Pre-initialize node positions
    useEffect(() => {
      nodes.forEach(node => {
        if (!node.x || !node.y || !node.z) {
          node.x = Math.random() * 100 - 50;
          node.y = Math.random() * 100 - 50;
          node.z = Math.random() * 100 - 50;
          // Initialize fixed positions if needed
          node.fx = undefined;
          node.fy = undefined;
          node.fz = undefined;
        }
      });
    }, [nodes]);

    // Initialize graph with optimized settings
    useEffect(() => {
      const fg = localRef.current;
      if (!fg) return;

      // Pause animation during initialization
      fg.pauseAnimation();
      
      // Set initial camera position
      fg.cameraPosition({ x: 0, y: 0, z: isMobile ? 300 : 200 });
      
      const forceStrength = isMobile ? -20 : -40;
      const distanceMax = isMobile ? 150 : 250;
      const linkDistance = isMobile ? 30 : 50;
      
      // Configure forces with safety checks
      const linkForce = fg.d3Force('link');
      if (linkForce) {
        linkForce.distance(linkDistance).strength(0.2);
      }

      const chargeForce = fg.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(forceStrength).distanceMax(distanceMax);
      }

      const centerForce = fg.d3Force('center');
      if (centerForce) {
        centerForce.strength(0.05);
      }

      // Add collision force
      fg.d3Force('collision', d3.forceCollide()
        .radius((node: NetworkNode) => {
          if (!node) return 3;
          switch (node.type) {
            case 'section': return 12;
            case 'category': return 8;
            case 'note': return 5;
            default: return 3;
          }
        })
        .strength(0.9)
        .iterations(1)
      );

      // Resume animation after a short delay
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
      if (!node) return '#22c55e';
      switch (node.type) {
        case 'section': return '#9333ea';
        case 'category': return '#f59e0b';
        case 'note': return '#ef4444';
        default: return '#22c55e';
      }
    }, []);

    const getNodeSize = useCallback((node: NetworkNode) => {
      if (!node) return isMobile ? 1.5 : 2;
      switch (node.type) {
        case 'section': return isMobile ? 4.5 : 6;
        case 'category': return isMobile ? 3.5 : 4.5;
        case 'note': return isMobile ? 2.5 : 3.5;
        default: return isMobile ? 1.5 : 2;
      }
    }, [isMobile]);

    // Optimized node object creation with safety checks
    const createNodeObject = useCallback((node: NetworkNode) => {
      if (!node) return null;
      
      const group = new THREE.Group();
      
      const sphereGeometry = new THREE.SphereGeometry(getNodeSize(node));
      const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshLambertMaterial({ 
          color: getNodeColor(node),
          transparent: true,
          opacity: 0.85
        })
      );
      group.add(sphere);
      
      if (!isMobile || ['section', 'category'].includes(node.type) || (node.connections?.length || 0) > 3) {
        const sprite = new SpriteText(node.name || '');
        sprite.color = '#ffffff';
        sprite.textHeight = isMobile ? 2 : 3;
        sprite.backgroundColor = 'rgba(0,0,0,0.6)';
        sprite.padding = isMobile ? 0.8 : 1.2;
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
          nodeLabel={(node: NetworkNode) => node ? `${node.type}: ${node.name}` : ''}
          nodeThreeObject={createNodeObject}
          nodeColor={getNodeColor}
          backgroundColor="#1B1B1F"
          linkColor={() => "#8E9196"}
          linkWidth={0.3}
          linkOpacity={0.4}
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