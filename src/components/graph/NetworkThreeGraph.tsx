import { useRef, useEffect, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

      // Enhanced lighting setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add multiple point lights for better illumination
      const pointLight1 = new THREE.PointLight(0xffffff, 1);
      pointLight1.position.set(100, 100, 100);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xffffff, 0.8);
      pointLight2.position.set(-100, -100, -100);
      scene.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0xffffff, 0.6);
      pointLight3.position.set(0, 200, 0);
      scene.add(pointLight3);

      // Process graph data
      const { nodes, links } = processNetworkData(notes);
      const radius = 100; // Radius of the sphere

      // Create nodes with spherical distribution
      nodes.forEach((node, index) => {
        const phi = Math.acos(-1 + (2 * index) / nodes.length);
        const theta = Math.sqrt(nodes.length * Math.PI) * phi;

        const geometry = new THREE.SphereGeometry(
          node.type === 'section' ? 6 :
          node.type === 'category' ? 4 :
          node.type === 'note' ? 3 : 2
        );
        
        const material = new THREE.MeshPhongMaterial({
          color: node.type === 'section' ? 0x9333ea :
                 node.type === 'category' ? 0xf59e0b :
                 node.type === 'note' ? 0xef4444 : 0x22c55e,
          shininess: 50
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position on sphere surface
        mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
        mesh.position.z = radius * Math.cos(phi);
        
        // Add velocity for force simulation
        mesh.userData.velocity = new THREE.Vector3();
        mesh.userData.connections = [];
        
        scene.add(mesh);
        nodesRef.current.set(node.id, mesh);
      });

      // Create links with curved lines
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

          // Store connection for force calculation
          sourceNode.userData.connections.push(targetNode);
          targetNode.userData.connections.push(sourceNode);
        }
      });

      // Animation loop with forces
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Apply forces between nodes
        nodesRef.current.forEach((node) => {
          const connections = node.userData.connections;
          const velocity = node.userData.velocity;

          // Spring force for connected nodes
          connections.forEach((connectedNode: THREE.Mesh) => {
            const distance = node.position.distanceTo(connectedNode.position);
            const direction = connectedNode.position.clone().sub(node.position).normalize();
            const force = direction.multiplyScalar((distance - 30) * 0.03);
            velocity.add(force);
          });

          // Spherical constraint force
          const toCenter = node.position.clone().normalize();
          const distanceToCenter = node.position.length();
          const sphereForce = toCenter.multiplyScalar((radius - distanceToCenter) * 0.1);
          velocity.add(sphereForce);

          // Apply velocity with damping
          velocity.multiplyScalar(0.95);
          node.position.add(velocity);
        });

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
    }, [notes, isMobile, ref]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

NetworkThreeGraph.displayName = "NetworkThreeGraph";