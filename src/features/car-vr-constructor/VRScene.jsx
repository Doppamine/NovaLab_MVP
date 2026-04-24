import React, { useState } from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

export default function VRScene({ children }) {
  // We handle initial player positioning in VRLocomotion usually, 
  // but XROrigin handles teleportation if we use the store.
  // Wait, XROrigin is in VRLocomotion, so we don't render it here 
  // to avoid multiple XROrigins.

  return (
    <>
      <color attach="background" args={['#0a1220']} />
      <fog attach="fog" args={['#0a1220', 10, 50]} />

      {/* Lighting - slightly brighter for VR clarity */}
      <ambientLight intensity={1.1} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight position={[0, 20, 0]} intensity={0.5} penumbra={1} castShadow />
      
      {/* Sci-fi grid floor */}
      <Grid 
        args={[50, 50]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#6f6f6f" 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#9d4edd" 
        fadeDistance={30} 
        fadeStrength={1} 
      />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow pointerEventsType={{ teleport: true }}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0a1220" metalness={0.1} roughness={0.9} />
      </mesh>
      
      <axesHelper args={[5]} />
      {children}
    </>
  );
}
