import { useRef, useEffect, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { Note } from '@/types/graph';
import { processNetworkData } from '@/utils/networkGraphUtils';
import { useIsMobile } from '@/hooks/use-mobile';

import { createNodeGeometry, createNodeMaterial, createLinkMaterial, setupLights, updateForces } from '@/utils/threeGraphUtils';
import { useTheme } from 'next-themes';

interface ThreeGraphProps {
  notes: Note[];
}

export interface ThreeGraphMethods {
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  focusNode: (nodeId: string) => void;
}

export const ThreeGraph = forwardRef<ThreeGraphMethods, ThreeGraphProps>(
  ({ notes }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const dragControlsRef = useRef<DragControls | null>(null);
    const nodesRef = useRef<Map<string, THREE.Mesh>>(new Map());
    const animationFrameRef = useRef<number>();
    const isDraggingRef = useRef(false);
    const isMobile = useIsMobile();
    const { theme } = useTheme();

    useEffect(() => {
      if (!containerRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(theme === 'dark' ? '#1a1b1e' : '#ffffff');

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      cameraRef.current = camera;
      camera.position.z = isMobile ? 300 : 200;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current = renderer;
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Controls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Add lights
      setupLights(scene);

      // Process graph data
      const { nodes, links } = processNetworkData(notes);
      const nodeMeshes: THREE.Mesh[] = [];

      // Create nodes
      nodes.forEach((node, index) => {
        const geometry = createNodeGeometry(node.type);
        const material = createNodeMaterial(node.type, theme as 'dark' | 'light');
        const mesh = new THREE.Mesh(geometry, material);
        
        // Initial spherical distribution
        const phi = Math.acos(-1 + (2 * index) / nodes.length);
        const theta = Math.sqrt(nodes.length * Math.PI) * phi;
        const radius = 100;
        
        mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
        mesh.position.z = radius * Math.cos(phi);
        
        mesh.userData.velocity = new THREE.Vector3();
        mesh.userData.connections = [];
        mesh.userData.nodeId = node.id;
        
        scene.add(mesh);
        nodesRef.current.set(node.id, mesh);
        nodeMeshes.push(mesh);
      });

      // Create links
      const linkMaterial = createLinkMaterial();
      links.forEach(link => {
        const sourceNode = nodesRef.current.get(link.source);
        const targetNode = nodesRef.current.get(link.target);
        
        if (sourceNode && targetNode) {
          const points = [sourceNode.position, targetNode.position];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, linkMaterial);
          scene.add(line);

          sourceNode.userData.connections.push(targetNode);
          targetNode.userData.connections.push(sourceNode);
        }
      });

      // Setup drag controls
      const dragControls = new DragControls(nodeMeshes, camera, renderer.domElement);
      dragControlsRef.current = dragControls;

      dragControls.addEventListener('dragstart', () => {
        isDraggingRef.current = true;
        controls.enabled = false;
      });

      dragControls.addEventListener('dragend', () => {
        isDraggingRef.current = false;
        controls.enabled = true;
      });

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        if (!isDraggingRef.current) {
          updateForces(nodeMeshes);
        }

        // Update lines positions
        scene.children.forEach(child => {
          if (child instanceof THREE.Line) {
            const geometry = child.geometry as THREE.BufferGeometry;
            const positions = geometry.attributes.position.array;
            geometry.attributes.position.needsUpdate = true;
          }
        });

        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      // Expose methods via ref
      if (ref) {
        const methods: ThreeGraphMethods = {
          pauseAnimation: () => {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
          },
          resumeAnimation: () => {
            animate();
          },
          focusNode: (nodeId: string) => {
            const node = nodesRef.current.get(nodeId);
            if (node && controlsRef.current && cameraRef.current) {
              const position = node.position.clone();
              position.z += 50;
              cameraRef.current.position.copy(position);
              controlsRef.current.target.copy(node.position);
              controlsRef.current.update();
            }
          }
        };

        if (typeof ref === 'function') {
          ref(methods);
        } else {
          ref.current = methods;
        }
      }

      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (renderer && containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }, [notes, isMobile, theme, ref]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

ThreeGraph.displayName = "ThreeGraph";
