import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SplatterParticles({ position, count = 40, active = false }) {
  const particlesRef = useRef();

  // Create initial particle data
  const particlesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      // Random spread mostly forward and slightly outward/upward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8, // x spread
        Math.random() * 8 + 2,     // y upward
        Math.random() * 10 + 5     // z forward (along impact)
      );
      
      // Random colors for egg white / yolk
      const color = Math.random() > 0.8 ? '#fbbf24' : '#fffbeb'; // 20% yolk, 80% white
      
      data.push({
        position: new THREE.Vector3(0, 0, 0),
        velocity,
        color,
        scale: Math.random() * 0.15 + 0.05
      });
    }
    return data;
  }, [count]);

  // InstancedMesh setup
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (!particlesRef.current) return;
    particlesData.forEach((particle, i) => {
      colorObj.set(particle.color);
      particlesRef.current.setColorAt(i, colorObj);
    });
    particlesRef.current.instanceColor.needsUpdate = true;
  }, [particlesData]);

  useFrame((state, delta) => {
    if (!active || !particlesRef.current) return;

    // Update each particle's position with gravity
    particlesData.forEach((particle, i) => {
      // Apply gravity
      particle.velocity.y -= 25 * delta;
      
      // Update position
      particle.position.addScaledVector(particle.velocity, delta);

      // Floor collision
      if (particle.position.y < -1.5) {
        particle.position.y = -1.5;
        particle.velocity.y = 0;
        particle.velocity.x *= 0.8; // friction
        particle.velocity.z *= 0.8;
      }

      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <group position={position}>
      <instancedMesh ref={particlesRef} args={[null, null, count]} castShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial roughness={0.1} metalness={0.1} vertexColors={false} />
      </instancedMesh>
    </group>
  );
}
