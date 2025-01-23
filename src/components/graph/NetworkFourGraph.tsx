import { useRef, useEffect, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Note } from '@/types/graph';
import { processNetworkData } from '@/utils/networkGraphUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NetworkFourGraphProps {
  notes: Note[];
}

export interface FourGraphMethods {
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  focusNode: (nodeId: string) => void;
}

interface PhysicsParams {
  linkDistance: number;
  chargeForce: number;
  centerForce: number;
  collisionRadius: Record<string, number>;
  damping: number;
  iterations: number;
}

export const NetworkFourGraph = forwardRef<FourGraphMethods, NetworkFourGraphProps>(
  ({ notes }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
      if (!containerRef.current) return;

      console.log("Initializing NetworkFourGraph with notes:", notes.length);
      
      graphRef.current = new Network3DGraph(
        containerRef.current,
        notes,
        {},  // savedCategories - empty for now
        {},  // lifeSections - empty for now
        isMobile
      );

      // Expose methods via ref
      if (ref) {
        const methods: FourGraphMethods = {
          pauseAnimation: () => {
            if (graphRef.current) {
              graphRef.current.stopAnimation();
            }
          },
          resumeAnimation: () => {
            if (graphRef.current) {
              graphRef.current.startAnimation();
            }
          },
          focusNode: (nodeId: string) => {
            if (graphRef.current) {
              const node = graphRef.current.nodes.find((n: any) => n.id === nodeId);
              if (node) {
                graphRef.current.resetCamera(
                  { x: node.mesh.position.x, y: node.mesh.position.y, z: node.mesh.position.z + 50 },
                  { x: node.mesh.position.x, y: node.mesh.position.y, z: node.mesh.position.z }
                );
              }
            }
          }
        };
        
        if (typeof ref === 'function') {
          ref(methods);
        } else {
          ref.current = methods;
        }
      }

      return () => {
        if (graphRef.current) {
          graphRef.current.dispose();
        }
      };
    }, [notes, isMobile, ref]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

NetworkFourGraph.displayName = "NetworkFourGraph";

class Network3DGraph {
  container: HTMLDivElement;
  isMobile: boolean;
  nodes: any[];
  links: any[];
  draggedNode: any;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  font: any;
  linkSystem: THREE.LineSegments;
  physicsParams: PhysicsParams;
  #raycaster = new THREE.Raycaster();
  #mouse = new THREE.Vector2();
  #frameId: number | null = null;
  #physicsEnabled = true;
  nodePositions: Map<string, THREE.Vector3> = new Map();

  constructor(container: HTMLDivElement, notes: Note[], savedCategories: any, lifeSections: any, isMobile: boolean) {
    console.log("Constructing Network3DGraph");
    this.container = container;
    this.isMobile = isMobile;
    this.nodes = [];
    this.links = [];
    this.draggedNode = null;

    // Initialize physics parameters first
    this.physicsParams = {
      linkDistance: this.isMobile ? 30 : 50,
      chargeForce: this.isMobile ? -20 : -40,
      centerForce: 0.05,
      collisionRadius: this.getCollisionRadii(),
      damping: 0.9,
      iterations: 2
    };

    // Initialize scene, camera, and renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b1b1f);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Reset camera position
    this.resetCamera();

    // Initialize the rest
    this.initLights();
    this.initEventListeners();
    this.loadResources(() => {
      console.log("Resources loaded, processing data");
      this.processData(notes, savedCategories, lifeSections);
      this.initGraph();
      this.startAnimation();
    });

    // Add controls change listener
    this.controls.addEventListener('change', () => {
      if (this.#physicsEnabled && this.physicsParams) {
        this.updatePhysics();
      }
    });
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    this.scene.add(directionalLight);
  }

  initEventListeners() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  async loadResources(callback: () => void) {
    try {
      console.log("Loading font resources");
      const loader = new FontLoader();
      this.font = await loader.loadAsync('https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/helvetiker_regular.typeface.json');
      callback();
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  }

  processData(notes: Note[], savedCategories: any, lifeSections: any) {
    console.log("Processing graph data");
    const graphData = processNetworkData(notes, savedCategories, lifeSections);
    this.nodes = graphData.nodes;
    this.links = graphData.links;
  }

  createNodes() {
    console.log("Creating nodes:", this.nodes.length);
    
    const typeGeometry = {
      section: new THREE.SphereGeometry(this.getNodeSize('section')),
      category: new THREE.SphereGeometry(this.getNodeSize('category')),
      note: new THREE.SphereGeometry(this.getNodeSize('note')),
      default: new THREE.SphereGeometry(this.getNodeSize('default'))
    };

    this.nodes.forEach(node => {
      try {
        const geometry = typeGeometry[node.type] || typeGeometry.default;
        const material = new THREE.MeshLambertMaterial({
          color: this.getNodeColor(node.type),
          transparent: true,
          opacity: 0.85
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Ensure initial position
        const initialPosition = new THREE.Vector3(
          node.x || Math.random() * 100 - 50,
          node.y || Math.random() * 100 - 50,
          node.z || Math.random() * 100 - 50
        );
        
        mesh.position.copy(initialPosition);
        node.mesh = mesh;
        this.scene.add(mesh);
        
        // Initialize force vector
        node.force = new THREE.Vector3();
        
        if (this.shouldAddLabel(node)) {
          this.createTextLabel(node);
        }
        
        this.nodePositions.set(node.id, mesh.position.clone());
      } catch (error) {
        console.error("Error creating node:", node, error);
      }
    });
  }

  createTextLabel(node) {
    const textGeometry = new TextGeometry(node.name, {
      font: this.font,
      size: this.isMobile ? 1.5 : 2,
      height: 0.01
    });

    textGeometry.computeBoundingBox();
    const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    
    textMesh.position.copy(node.mesh.position);
    textMesh.position.x += this.getNodeSize(node.type) + 2;
    textMesh.position.x += centerOffset;
    
    node.textMesh = textMesh;
    this.scene.add(textMesh);
  }

  createLinks() {
    console.log("Creating links with count:", this.links.length);
    
    // Remove existing link system if it exists
    if (this.linkSystem) {
      this.scene.remove(this.linkSystem);
    }

    const linkGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.links.length * 6);
    const colors = new Float32Array(this.links.length * 6);
    
    linkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    linkGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const linkMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      opacity: 0.4,
      transparent: true
    });

    this.linkSystem = new THREE.LineSegments(linkGeometry, linkMaterial);
    this.scene.add(this.linkSystem);
    console.log("Link system created:", this.linkSystem);
    this.updateLinks();
  }

  updateLinks() {
    console.log("Updating links");
    if (!this.linkSystem || !this.linkSystem.geometry) {
      console.warn("Link system not initialized");
      return;
    }

    const positions = this.linkSystem.geometry.attributes.position.array;
    const colors = this.linkSystem.geometry.attributes.color.array;

    this.links.forEach((link, i) => {
      if (!link.source?.mesh?.position || !link.target?.mesh?.position) {
        console.warn("Invalid link source or target:", link);
        return;
      }

      const baseIndex = i * 6;
      const sourcePos = link.source.mesh.position;
      const targetPos = link.target.mesh.position;

      positions[baseIndex] = sourcePos.x;
      positions[baseIndex + 1] = sourcePos.y;
      positions[baseIndex + 2] = sourcePos.z;
      positions[baseIndex + 3] = targetPos.x;
      positions[baseIndex + 4] = targetPos.y;
      positions[baseIndex + 5] = targetPos.z;

      const color = new THREE.Color(0x8e9196);
      colors[baseIndex] = color.r;
      colors[baseIndex + 1] = color.g;
      colors[baseIndex + 2] = color.b;
      colors[baseIndex + 3] = color.r;
      colors[baseIndex + 4] = color.g;
      colors[baseIndex + 5] = color.b;
    });

    this.linkSystem.geometry.attributes.position.needsUpdate = true;
    this.linkSystem.geometry.attributes.color.needsUpdate = true;
  }

  initPhysics() {
    console.log("Initializing physics");
    this.nodes.forEach(node => {
      node.velocity = new THREE.Vector3();
      node.force = new THREE.Vector3();
      this.nodePositions.set(node.id, node.mesh.position.clone());
    });
  }

  updatePhysics() {
    if (!this.#physicsEnabled || !this.physicsParams) return;

    for (let iter = 0; iter < this.physicsParams.iterations; iter++) {
      this.applyForces();
      this.resolveCollisions();
      this.updatePositions();
    }

    this.updateLinks();
  }

  applyForces() {
    console.log("Applying forces to nodes:", this.nodes.length);
    
    this.nodes.forEach(node => {
      if (!node.mesh?.position || node.fixed) {
        console.log("Skipping node without position or fixed:", node.id);
        return;
      }
      
      // Initialize force if not exists
      if (!node.force) {
        node.force = new THREE.Vector3();
      }
      
      // Apply repulsive forces
      this.nodes.forEach(other => {
        if (node === other || !other.mesh?.position) return;
        
        try {
          const delta = new THREE.Vector3().subVectors(
            other.mesh.position,
            node.mesh.position
          );
          
          const distanceSq = delta.lengthSq();
          if (distanceSq < 1e-6) return;
          
          const force = this.physicsParams.chargeForce / distanceSq;
          delta.multiplyScalar(force);
          node.force.sub(delta);
        } catch (error) {
          console.warn("Error calculating repulsive force:", error);
        }
      });
    });

    // Apply link forces
    this.links.forEach(link => {
      if (!link.source?.mesh?.position || !link.target?.mesh?.position) {
        console.log("Skipping link with invalid source/target:", link);
        return;
      }

      try {
        const delta = new THREE.Vector3().subVectors(
          link.target.mesh.position,
          link.source.mesh.position
        );
        
        const distance = delta.length();
        if (distance === 0) return;
        
        const normDistance = (distance - this.physicsParams.linkDistance) / distance;
        
        if (!link.source.fixed) {
          if (!link.source.force) {
            link.source.force = new THREE.Vector3();
          }
          link.source.force.add(delta.clone().multiplyScalar(normDistance * 0.1));
        }
        
        if (!link.target.fixed) {
          if (!link.target.force) {
            link.target.force = new THREE.Vector3();
          }
          link.target.force.sub(delta.clone().multiplyScalar(normDistance * 0.1));
        }
      } catch (error) {
        console.warn("Error calculating link force:", error);
      }
    });
  }

  resolveCollisions() {
    this.nodes.forEach(node => {
      if (node.fixed) return;

      this.nodes.forEach(other => {
        if (node === other) return;

        const delta = new THREE.Vector3().subVectors(
          other.mesh.position,
          node.mesh.position
        );
        
        const distance = delta.length();
        const minDist = this.getCollisionRadii()[node.type] + this.getCollisionRadii()[other.type];
        
        if (distance < minDist) {
          const correction = delta.normalize().multiplyScalar((minDist - distance) * 0.5);
          node.mesh.position.sub(correction);
          other.mesh.position.add(correction);
        }
      });
    });
  }

  updatePositions() {
    this.nodes.forEach(node => {
      if (node.fixed) return;

      node.velocity.add(node.force);
      node.velocity.multiplyScalar(this.physicsParams.damping);
      node.mesh.position.add(node.velocity);
      node.force.set(0, 0, 0);

      if (node.textMesh) {
        node.textMesh.position.copy(node.mesh.position);
        node.textMesh.position.x += this.getNodeSize(node.type) + 2;
      }
    });
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  handleMouseDown(event: MouseEvent) {
    this.#mouse.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    this.#raycaster.setFromCamera(this.#mouse, this.camera);
    const intersects = this.#raycaster.intersectObjects(this.nodes.map(n => n.mesh));

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object;
      this.draggedNode = this.nodes.find(n => n.mesh === intersectedMesh);
      if (this.draggedNode) {
        this.draggedNode.fixed = true;
        this.controls.enabled = false;
      }
    }
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.draggedNode) return;

    this.#mouse.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    this.#raycaster.setFromCamera(this.#mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    this.#raycaster.ray.intersectPlane(plane, intersectPoint);
    
    this.draggedNode.mesh.position.copy(intersectPoint);
    this.updatePhysics();
  }

  handleMouseUp() {
    if (this.draggedNode) {
      this.draggedNode.fixed = false;
      this.draggedNode = null;
      this.controls.enabled = true;
    }
  }

  startAnimation() {
    console.log("Starting animation");
    if (!this.#frameId) {
      const animate = () => {
        this.#frameId = requestAnimationFrame(animate);
        this.updatePhysics();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      animate();
    }
  }

  stopAnimation() {
    cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }

  resetCamera(position = { x: 0, y: 0, z: 200 }, lookAt = { x: 0, y: 0, z: 0 }) {
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    if (this.controls) {
      this.controls.target.set(lookAt.x, lookAt.y, lookAt.z);
      this.controls.update();
    }
  }

  togglePhysics(enabled) {
    this.#physicsEnabled = enabled;
  }

  getNodeColor(type) {
    const colors = {
      section: 0x9333ea,
      category: 0xf59e0b,
      note: 0xef4444,
      default: 0x22c55e
    };
    return colors[type] || colors.default;
  }

  getNodeSize(type) {
    const sizes = this.isMobile ? 
      { section: 4.5, category: 3.5, note: 2.5, default: 1.5 } :
      { section: 6, category: 4.5, note: 3.5, default: 2 };
    
    return sizes[type] || sizes.default;
  }

  getCollisionRadii() {
    return this.isMobile ?
      { section: 12, category: 8, note: 5, default: 3 } :
      { section: 15, category: 10, note: 7, default: 3 };
  }

  shouldAddLabel(node) {
    return !this.isMobile || ['section', 'category'].includes(node.type) || node.connections?.length > 3;
  }

  initGraph() {
    console.log("Initializing graph");
    this.createNodes();
    this.createLinks();
    this.initPhysics();
  }

  dispose() {
    this.stopAnimation();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    this.scene.clear();
    this.container.removeChild(this.renderer.domElement);
  }
}