import * as THREE from 'three';
import { NetworkNode, NetworkLink } from '@/utils/networkGraphUtils';

export const createNodeMaterial = (nodeType: string, theme: 'dark' | 'light') => {
  const color = nodeType === 'section' ? 0x9333ea :
               nodeType === 'category' ? 0xf59e0b :
               nodeType === 'note' ? 0xef4444 : 0x22c55e;
               
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 50,
    transparent: true,
    opacity: 0.85
  });
};

export const createNodeGeometry = (nodeType: string) => {
  const radius = nodeType === 'section' ? 6 :
                nodeType === 'category' ? 4 :
                nodeType === 'note' ? 3 : 2;
                
  return new THREE.SphereGeometry(radius);
};

export const createLinkMaterial = () => {
  return new THREE.LineBasicMaterial({
    color: 0x8E9196,
    opacity: 0.4,
    transparent: true
  });
};

export const setupLights = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLights = [
    { position: [100, 100, 100], intensity: 1 },
    { position: [-100, -100, -100], intensity: 0.8 },
    { position: [0, 200, 0], intensity: 0.6 }
  ];

  pointLights.forEach(({ position, intensity }) => {
    const light = new THREE.PointLight(0xffffff, intensity);
    light.position.set(position[0], position[1], position[2]);
    scene.add(light);
  });
};

export const updateForces = (nodes: THREE.Mesh[], radius: number = 100) => {
  nodes.forEach(node => {
    if (!node.userData.velocity) {
      node.userData.velocity = new THREE.Vector3();
    }

    const velocity = node.userData.velocity as THREE.Vector3;
    const connections = node.userData.connections as THREE.Mesh[];

    // Spring force for connected nodes
    connections.forEach(connectedNode => {
      const distance = node.position.distanceTo(connectedNode.position);
      const direction = connectedNode.position.clone().sub(node.position).normalize();
      const force = direction.multiplyScalar((distance - 30) * 0.03);
      velocity.add(force);
    });

    // Weak spherical constraint force
    const toCenter = node.position.clone().normalize();
    const distanceToCenter = node.position.length();
    const sphereForce = toCenter.multiplyScalar((radius - distanceToCenter) * 0.01);
    velocity.add(sphereForce);

    // Apply velocity with damping
    velocity.multiplyScalar(0.98);
    node.position.add(velocity);
  });
};