import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { interpolateDragRace } from '../../../physics';

const CAR_MODEL_PATH = '/models/car_full.glb';
const TRUCK_MODEL_PATH = '/models/truck.glb';
const LANE_WIDTH = 5;
const LANE_OFFSET_X = 3;     // distance from track centre to each lane
const ROAD_WIDTH = LANE_OFFSET_X * 2 + LANE_WIDTH;

useGLTF.preload(CAR_MODEL_PATH);
useGLTF.preload(TRUCK_MODEL_PATH);

function Track({ trackLength }) {
  // Road runs along +Z, length = trackLength + a bit of run-off past the line.
  const totalLength = trackLength + 30;
  return (
    <group position={[0, 0, totalLength / 2 - 5]}>
      {/* Road slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, totalLength]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.85} />
      </mesh>
      {/* Lane divider — short dashed segments along Z */}
      {Array.from({ length: Math.ceil(totalLength / 4) }).map((_, i) => (
        <mesh
          key={i}
          position={[0, -0.04, -totalLength / 2 + i * 4 + 1]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 2]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function StartLine() {
  return (
    <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[ROAD_WIDTH, 0.6]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
  );
}

function FinishLine({ z }) {
  // Checkered finish: alternating black and white squares across the road
  const squares = 8;
  const sq = ROAD_WIDTH / squares;
  return (
    <group position={[0, -0.03, z]}>
      {Array.from({ length: squares * 2 }).map((_, i) => {
        const row = Math.floor(i / squares);
        const col = i % squares;
        const isWhite = (row + col) % 2 === 0;
        return (
          <mesh
            key={i}
            position={[-ROAD_WIDTH / 2 + col * sq + sq / 2, 0, row * sq - sq / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[sq, sq]} />
            <meshStandardMaterial color={isWhite ? '#ffffff' : '#0d0d18'} roughness={0.5} />
          </mesh>
        );
      })}
      {/* Finish banner posts */}
      <mesh position={[-ROAD_WIDTH / 2, 3, 0]}>
        <boxGeometry args={[0.4, 6, 0.4]} />
        <meshStandardMaterial color="#cc3333" />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2, 3, 0]}>
        <boxGeometry args={[0.4, 6, 0.4]} />
        <meshStandardMaterial color="#cc3333" />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#cc3333" />
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

// car_full and truck GLBs both have nose at +Z natively (matches CrashTestScene).
// Track runs in +Z direction so no Y rotation needed.
const RaceVehicle = React.forwardRef(function RaceVehicle({ modelPath, laneX }, ref) {
  const { scene } = useGLTF(modelPath);

  const cloned = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <group ref={ref} position={[laneX, 0, 0]}>
      <primitive object={cloned} />
    </group>
  );
});

function CameraRig({ trackLength, simulationState, simKey, samples }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = null;
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1, trackLength * 0.35);
      controlsRef.current.update();
    }
    // Side-on starting view that frames the start line + first stretch of track
    camera.position.set(-trackLength * 0.35, trackLength * 0.18, -trackLength * 0.15);
    camera.updateProjectionMatrix();
  }, [simKey, trackLength, camera]);

  useFrame((state) => {
    if (!controlsRef.current || !samples) return;
    if (simulationState !== 'running') return;
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const sample = interpolateDragRace(samples, elapsed);
    if (sample) {
      const leadZ = Math.max(sample.xA, sample.xB);
      controlsRef.current.target.z += (leadZ - controlsRef.current.target.z) * 0.06;
      controlsRef.current.target.y = 1;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={20}
      maxDistance={300}
    />
  );
}

function Racers({ raceResult, simulationState, simKey, onLiveSample, onFinish }) {
  const carRef = useRef();
  const truckRef = useRef();
  const startTimeRef = useRef(null);
  const finishedRef = useRef(false);
  const lastEmitRef = useRef(0);

  // Reset on simKey change
  useEffect(() => {
    startTimeRef.current = null;
    finishedRef.current = false;
    lastEmitRef.current = 0;
    if (carRef.current) carRef.current.position.z = 0;
    if (truckRef.current) truckRef.current.position.z = 0;
    onLiveSample?.({ t: 0, xA: 0, xB: 0, vA: 0, vB: 0, isPreview: true });
  }, [simKey, raceResult, onLiveSample]);

  useFrame((state) => {
    if (!raceResult) return;

    if (simulationState === 'idle') {
      if (carRef.current) carRef.current.position.z = 0;
      if (truckRef.current) truckRef.current.position.z = 0;
      return;
    }
    if (simulationState === 'finished') return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const sample = interpolateDragRace(raceResult.samples, elapsed);
    if (sample) {
      if (carRef.current) carRef.current.position.z = sample.xA;
      if (truckRef.current) truckRef.current.position.z = sample.xB;
      if (state.clock.elapsedTime - lastEmitRef.current > 0.033) {
        onLiveSample?.(sample);
        lastEmitRef.current = state.clock.elapsedTime;
      }
    }

    if (elapsed >= raceResult.totalTime && !finishedRef.current) {
      finishedRef.current = true;
      const last = raceResult.samples[raceResult.samples.length - 1];
      onLiveSample?.(last);
      onFinish?.();
    }
  });

  return (
    <>
      <RaceVehicle ref={carRef} modelPath={CAR_MODEL_PATH} laneX={-LANE_OFFSET_X} />
      <RaceVehicle ref={truckRef} modelPath={TRUCK_MODEL_PATH} laneX={+LANE_OFFSET_X} />
    </>
  );
}

export default function DragRaceScene({
  raceResult,
  simulationState,
  simKey,
  onFinish,
  onLiveSample,
}) {
  const trackLength = raceResult?.trackLength ?? 100;
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault fov={45} far={1000} />
      <Sky />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[40, 60, 20]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      <Track trackLength={trackLength} />
      <StartLine />
      <FinishLine z={trackLength} />

      {raceResult && (
        <>
          <Racers
            raceResult={raceResult}
            simulationState={simulationState}
            simKey={simKey}
            onLiveSample={onLiveSample}
            onFinish={onFinish}
          />
          <CameraRig
            trackLength={trackLength}
            simulationState={simulationState}
            simKey={simKey}
            samples={raceResult.samples}
          />
        </>
      )}
    </Canvas>
  );
}
