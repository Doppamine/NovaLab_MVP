import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { interpolateStuntJump } from '../../../physics';

const CAR_MODEL_PATH = '/models/car_full.glb';
const CANYON_DEPTH = 30;
const RAMP_THICKNESS = 1.2;
const RAMP_WIDTH = 6;
const PAD_LENGTH = 40;
const PLATFORM_LENGTH = 8;

useGLTF.preload(CAR_MODEL_PATH);

// Descent ramp — anchor at the launch base (parent positions at (launchBaseX, 0)).
// Rotation by -angleRad swings the BACK of the box UP-LEFT to (descentTopX, height).
// Box extends to the LEFT of the parent origin (position X = -length/2).
function DescentRamp({ length, angleRad }) {
  return (
    <group rotation={[0, 0, -angleRad]}>
      <mesh position={[-length / 2, -RAMP_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, RAMP_THICKNESS, RAMP_WIDTH]} />
        <meshStandardMaterial color="#3b3b55" roughness={0.85} />
      </mesh>
    </group>
  );
}

// Launch ramp — same anchor (launchBaseX, 0). Rotation by +angleRad swings the
// FRONT of the box UP-RIGHT to the lip at (0, launchLipHeight). Box extends to
// the RIGHT of parent origin (position X = +length/2).
function LaunchRamp({ length, angleRad }) {
  return (
    <group rotation={[0, 0, angleRad]}>
      <mesh position={[length / 2, -RAMP_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, RAMP_THICKNESS, RAMP_WIDTH]} />
        <meshStandardMaterial color="#4a3b55" roughness={0.85} />
      </mesh>
      {/* Caution stripes painted on the top surface near the lip */}
      <mesh
        position={[length - 0.4, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.8, RAMP_WIDTH]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.5} />
      </mesh>
    </group>
  );
}

function StartingPlatform({ topX, height }) {
  return (
    <group>
      <mesh
        position={[topX - PLATFORM_LENGTH / 2, height - RAMP_THICKNESS / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[PLATFORM_LENGTH, RAMP_THICKNESS, RAMP_WIDTH]} />
        <meshStandardMaterial color="#3b3b55" roughness={0.85} />
      </mesh>
      {/* Edge marker so the start point reads visually */}
      <mesh
        position={[topX - 0.4, height + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.8, RAMP_WIDTH]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.5} />
      </mesh>
    </group>
  );
}

function LandingPad({ canyonWidth, lipHeight }) {
  return (
    <group position={[canyonWidth, lipHeight, 0]}>
      <mesh position={[PAD_LENGTH / 2, -RAMP_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[PAD_LENGTH, RAMP_THICKNESS, RAMP_WIDTH]} />
        <meshStandardMaterial color="#2c4a3a" roughness={0.85} />
      </mesh>
      <mesh position={[0.4, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, RAMP_WIDTH]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Canyon({ canyonWidth, lipHeight }) {
  // Cliff faces extend from canyon floor up to the launch lip height
  const wallHeight = CANYON_DEPTH + lipHeight;
  return (
    <group>
      <mesh
        position={[canyonWidth / 2, -CANYON_DEPTH, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[canyonWidth + 4, RAMP_WIDTH * 4]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} />
      </mesh>
      <mesh position={[0, lipHeight - wallHeight / 2, 0]}>
        <boxGeometry args={[0.4, wallHeight, RAMP_WIDTH]} />
        <meshStandardMaterial color="#3a3a55" roughness={0.95} />
      </mesh>
      <mesh position={[canyonWidth, lipHeight - wallHeight / 2, 0]}>
        <boxGeometry args={[0.4, wallHeight, RAMP_WIDTH]} />
        <meshStandardMaterial color="#3a3a55" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[300, 32, 16]} />
      <meshBasicMaterial color="#1c2756" side={THREE.BackSide} />
    </mesh>
  );
}

function StuntCar({ jumpResult, simulationState, simKey, onFinish, onLiveSample }) {
  const { scene } = useGLTF(CAR_MODEL_PATH);
  const carRef = useRef();
  const startTimeRef = useRef(null);
  const finishedRef = useRef(false);
  const lastEmitRef = useRef(0);

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

  const placeAt = (sample, slopeRotZ) => {
    if (!carRef.current) return;
    carRef.current.position.set(sample.x, sample.y, 0);
    carRef.current.rotation.z = slopeRotZ;
  };

  useEffect(() => {
    startTimeRef.current = null;
    finishedRef.current = false;
    lastEmitRef.current = 0;
    if (jumpResult) {
      // Sit horizontally on the platform top
      placeAt(jumpResult.samples[0], 0);
    }
  }, [simKey, jumpResult]);

  useFrame((state) => {
    if (!jumpResult || !carRef.current) return;

    if (simulationState === 'idle') {
      placeAt(jumpResult.samples[0], 0);
      onLiveSample?.({ ...jumpResult.samples[0], isPreview: true });
      return;
    }
    if (simulationState === 'finished') return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const sample = interpolateStuntJump(jumpResult.samples, elapsed);
    if (!sample) return;

    let rotZ = carRef.current.rotation.z;
    const lookAhead = interpolateStuntJump(jumpResult.samples, elapsed + 0.05);
    if (lookAhead) {
      const dx = lookAhead.x - sample.x;
      const dy = lookAhead.y - sample.y;
      if (dx * dx + dy * dy > 1e-6) {
        rotZ = Math.atan2(dy, dx);
      }
    }
    placeAt(sample, rotZ);

    if (state.clock.elapsedTime - lastEmitRef.current > 0.033) {
      onLiveSample?.(sample);
      lastEmitRef.current = state.clock.elapsedTime;
    }

    if (elapsed >= jumpResult.totalTime && !finishedRef.current) {
      finishedRef.current = true;
      onLiveSample?.(jumpResult.samples[jumpResult.samples.length - 1]);
      onFinish?.();
    }
  });

  // Outer group: position + slope-tangent rotation around world Z.
  // Inner group: re-aligns the GLB's native +Z forward to world +X
  //   (rotation +π/2 around Y points the nose in the trajectory direction).
  // No vertical lift on the primitive — the car_full GLB has its origin at
  //   wheel level, so placing the outer group at the trajectory point puts
  //   the wheels exactly on the surface (descent ramp, launch ramp, or pad).
  return (
    <group ref={carRef}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

function CameraRig({ jumpResult, simulationState, simKey }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = null;
    if (controlsRef.current && jumpResult) {
      const midX = (jumpResult.descentTopX + jumpResult.range + 10) / 2;
      controlsRef.current.target.set(midX, jumpResult.launchLipHeight + 4, 0);
      controlsRef.current.update();
    }
  }, [simKey, jumpResult]);

  useFrame((state) => {
    if (!jumpResult || !controlsRef.current) return;
    if (simulationState === 'running') {
      if (startTimeRef.current === null) {
        startTimeRef.current = state.clock.elapsedTime;
      }
      const elapsed = state.clock.elapsedTime - startTimeRef.current;
      const sample = interpolateStuntJump(jumpResult.samples, elapsed);
      if (sample) {
        const targetX = sample.x;
        const targetY = Math.max(jumpResult.launchLipHeight + 2, sample.y);
        controlsRef.current.target.x +=
          (targetX - controlsRef.current.target.x) * 0.08;
        controlsRef.current.target.y +=
          (targetY - controlsRef.current.target.y) * 0.08;
        controlsRef.current.update();
      }
    }
  });

  useEffect(() => {
    if (!jumpResult) return;
    const span = Math.max(40, jumpResult.range + Math.abs(jumpResult.descentTopX) + 20);
    const dist = Math.min(140, span * 1.1);
    camera.position.set(jumpResult.descentTopX + 8, jumpResult.samples[0].y + 8, dist);
    camera.updateProjectionMatrix();
  }, [jumpResult, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={20}
      maxDistance={250}
    />
  );
}

export default function StuntJumpScene({
  jumpResult,
  simulationState,
  simKey,
  onFinish,
  onLiveSample,
}) {
  const canyonWidth = jumpResult?.formula_trace.substitutions.canyon_width ?? 0;
  const heightAbove = jumpResult?.formula_trace.substitutions.h ?? 0;

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 15, 80]} fov={45} far={500} />
      <Sky />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[20, 40, 30]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      {jumpResult && (
        <>
          {/* Descent ramp anchored at the launch base */}
          <group position={[jumpResult.launchBaseX, 0, 0]}>
            <DescentRamp
              length={jumpResult.descentLength}
              angleRad={jumpResult.rampAngleRad}
            />
          </group>

          {/* Launch ramp anchored at the launch base, rotating UP toward the lip */}
          <group position={[jumpResult.launchBaseX, 0, 0]}>
            <LaunchRamp
              length={jumpResult.launchRampLength}
              angleRad={jumpResult.rampAngleRad}
            />
          </group>

          <StartingPlatform topX={jumpResult.descentTopX} height={heightAbove} />

          <Canyon canyonWidth={canyonWidth} lipHeight={jumpResult.launchLipHeight} />
          <LandingPad canyonWidth={canyonWidth} lipHeight={jumpResult.launchLipHeight} />

          <StuntCar
            jumpResult={jumpResult}
            simulationState={simulationState}
            simKey={simKey}
            onFinish={onFinish}
            onLiveSample={onLiveSample}
          />
          <CameraRig
            jumpResult={jumpResult}
            simulationState={simulationState}
            simKey={simKey}
          />
        </>
      )}
    </Canvas>
  );
}
