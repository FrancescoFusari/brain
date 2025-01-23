import { useRef, useEffect, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Note } from '@/types/graph';
import { processNetworkData } from '@/utils/networkGraphUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NetworkThreeGraphProps {
  notes: Note[];
}

export interface ThreeGraphMethods {
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  focusNode: (nodeId: string) => void;
}

export const NetworkThreeGraph = forwardRef<ThreeGraphMethods, NetworkThreeGraphProps>(
  ({ notes }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const nodesRef = useRef<Map<string, THREE.Mesh>>(new Map());
    const animationFrameRef = useRef<number>();
    const isMobile = useIsMobile();

    useEffect(() => {
      if (!containerRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color('#1a1b1e');

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

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);

      // Process graph data
      const { nodes, links } = processNetworkData(notes);

      // Create nodes
      nodes.forEach(node => {
        const geometry = new THREE.SphereGeometry(
          node.type === 'section' ? 6 :
          node.type === 'category' ? 4 :
          node.type === 'note' ? 3 : 2
        );
        
        const material = new THREE.MeshPhongMaterial({
          color: node.type === 'section' ? 0x9333ea :
                 node.type === 'category' ? 0xf59e0b :
                 node.type === 'note' ? 0xef4444 : 0x22c55e
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random initial position
        mesh.position.x = (Math.random() - 0.5) * 200;
        mesh.position.y = (Math.random() - 0.5) * 200;
        mesh.position.z = (Math.random() - 0.5) * 200;
        
        scene.add(mesh);
        nodesRef.current.set(node.id, mesh);
      });

      // Create links
      links.forEach(link => {
        const sourceNode = nodesRef.current.get(link.source);
        const targetNode = nodesRef.current.get(link.target);
        
        if (sourceNode && targetNode) {
          const material = new THREE.LineBasicMaterial({ 
            color: 0x8E9196,
            opacity: 0.4,
            transparent: true
          });
          
          const points = [sourceNode.position, targetNode.position];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, material);
          scene.add(line);
        }
      });

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
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
    }, [notes, isMobile, ref]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

NetworkThreeGraph.displayName = "NetworkThreeGraph";