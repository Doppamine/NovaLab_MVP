import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import EggPayload from './EggPayload';
import SplatterParticles from './SplatterParticles';

const CAR_MODEL_PATH = '/models/car_full.glb';

function TrackAndWall() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[100, 20]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      
      {/* Grid lines */}
      <gridHelper args={[100, 100, '#4f46e5', '#3730a3']} position={[0, -0.04, 0]} />

      {/* Solid Brick Wall */}
      <mesh position={[0, 2.5, 30]} castShadow receiveShadow>
        <boxGeometry args={[12, 5, 2]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.9} />
      </mesh>

      {/* Warning Stripes on wall */}
      <mesh position={[0, 2.5, 28.99]} receiveShadow>
        <planeGeometry args={[12, 1]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.5} />
      </mesh>
    </group>
  );
}

function CrashCar({ speed, bumperDistance, isSafe, simulationState, onFinish, simKey }) {
  const { scene } = useGLTF(CAR_MODEL_PATH);
  const carRef = useRef();
  const bumperRef = useRef();
  
  // Clone scene so we don't mutate the cached version
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Car animation state
  const [carZ, setCarZ] = useState(-20);
  const [crumple, setCrumple] = useState(1);
  const [splatterActive, setSplatterActive] = useState(false);

  // Reset on new key
  useEffect(() => {
    setCarZ(-20);
    setCrumple(1);
    setSplatterActive(false);
  }, [simKey]);

  useFrame((state, delta) => {
    if (simulationState === 'idle' || simulationState === 'finished') return;

    // Running state - drive forward
    if (simulationState === 'running') {
      const distanceThisFrame = speed * delta;
      const newZ = carZ + distanceThisFrame;
      
      // Check collision (Wall is at Z=30, car front is roughly +2.5 from center)
      const collisionZ = 29.5 - bumperDistance; // stop earlier for larger bumpers
      
      if (newZ >= collisionZ) {
        setCarZ(collisionZ);
        // Trigger impact sequence
        if (!isSafe) {
          setSplatterActive(true);
        }
        onFinish();
      } else {
        setCarZ(newZ);
      }
    }
  });

  // Animate crumple if finished
  useFrame((state, delta) => {
    if (simulationState === 'finished' && crumple > 0.1) {
      // Crumple speed depends on speed
      setCrumple(Math.max(0.1, crumple - delta * 5));
    }
  });

  return (
    <group ref={carRef} position={[0, 0, carZ]}>
      {/* The Car Body */}
      <group scale={[1, 1, crumple]} ref={bumperRef}>
        <primitive object={clonedScene} position={[0, 0.5, 0]} />
      </group>

      {/* The Payload (Strapped to the roof) */}
      {/* Positioned on roof of car_full, roughly y=2.2, z=0 */}
      <EggPayload 
        isSafe={isSafe} 
        simulationState={simulationState} 
        position={[0, 2.2, 0.5]} 
      />

      <SplatterParticles 
        active={splatterActive} 
        position={[0, 2.5, 1]} 
      />
    </group>
  );
}

useGLTF.preload(CAR_MODEL_PATH);

function CameraManager({ simulationState, simKey }) {
  const controlsRef = useRef();

  useEffect(() => {
    // Reset camera target
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1, 0);
    }
  }, [simKey]);

  useFrame((state) => {
    if (simulationState === 'running' || simulationState === 'finished') {
      // Slowly pan camera toward the wall during the run
      const targetZ = state.camera.position.z;
      if (controlsRef.current.target.z < 30) {
        controlsRef.current.target.z += 0.1;
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={10}
      maxDistance={40}
    />
  );
}

export default function CrashTestScene({ speed, bumperDistance, isSafe, simulationState, onFinish, simKey }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[-15, 8, -25]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <spotLight position={[-10, 15, -10]} intensity={1} penumbra={1} />

      <TrackAndWall />
      
      <CrashCar 
        speed={speed} 
        bumperDistance={bumperDistance} 
        isSafe={isSafe} 
        simulationState={simulationState} 
        onFinish={onFinish}
        simKey={simKey}
      />

      <CameraManager simulationState={simulationState} simKey={simKey} />
    </Canvas>
  );
}
