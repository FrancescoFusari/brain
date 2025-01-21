import { useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

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
    
    // Memoize graph data processing
    const graphData = useMemo(() => processNetworkData(notes), [notes]);
    const { nodes, links } = graphData;

    // Initialize graph with optimized settings
    useEffect(() => {
      const fg = localRef.current;
      if (!fg) return;

      // Reset camera and controls
      fg.pauseAnimation();
      fg.cameraPosition({ x: 0, y: 0, z: isMobile ? 250 : 150 });
      
      // Optimized force parameters
      const forceStrength = isMobile ? -15 : -30;
      const distanceMax = isMobile ? 120 : 200;
      const linkDistance = isMobile ? 25 : 40;
      
      fg.d3Force('link')?.distance(linkDistance).strength(0.15);
      fg.d3Force('charge')?.strength(forceStrength).distanceMax(distanceMax);
      fg.d3Force('center')?.strength(0.05);
      
      fg.d3Force('collision', d3.forceCollide()
        .radius(node => (node as NetworkNode).type === 'note' ? 4 : 2)
        .strength(0.9)
        .iterations(1)
      );

      setTimeout(() => fg.resumeAnimation(), 50);

      return () => {
        if (fg) fg.pauseAnimation();
      };
    }, [isMobile]);

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

    // Optimized node object creation
    const createNodeObject = useCallback((node: NetworkNode) => {
      if (node.type === 'note') {
        const group = new THREE.Group();
        
        const sphereGeometry = new THREE.SphereGeometry(isMobile ? 2 : 3);
        const sphere = new THREE.Mesh(
          sphereGeometry,
          new THREE.MeshLambertMaterial({ 
            color: '#EF7234',
            transparent: true,
            opacity: 0.8
          })
        );
        group.add(sphere);
        
        const sprite = new SpriteText(node.name);
        sprite.color = '#ffffff';
        sprite.textHeight = isMobile ? 1.2 : 2;
        sprite.backgroundColor = 'rgba(0,0,0,0.5)';
        sprite.padding = isMobile ? 0.3 : 1;
        sprite.borderRadius = 2;
        (sprite as unknown as THREE.Object3D).position.set(4, 0, 0);
        
        group.add(sprite);
        
        return group;
      } else {
        // Simplified tag representation without labels
        return new THREE.Mesh(
          new THREE.SphereGeometry(isMobile ? 1 : 1.5),
          new THREE.MeshLambertMaterial({ 
            color: '#E0E0D7',
            transparent: true,
            opacity: 0.6
          })
        );
      }
    }, [isMobile]);

    // Handle node drag
    const handleNodeDragEnd = useCallback((node: NetworkNode) => {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    }, []);

    return (
      <div className="w-full h-full">
        <ForceGraph3D
          ref={localRef as any}
          graphData={{ nodes, links }}
          nodeLabel={(node: NetworkNode) => node.type === 'note' ? node.name : ''}
          nodeThreeObject={createNodeObject}
          nodeColor={(node: NetworkNode) => node.type === 'note' ? '#EF7234' : '#E0E0D7'}
          backgroundColor="#1B1B1F"
          linkColor={() => "#8E9196"}
          linkWidth={0.15}
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