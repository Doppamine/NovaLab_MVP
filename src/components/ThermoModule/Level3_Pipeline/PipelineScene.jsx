import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { XR } from '@react-three/xr';
import * as THREE from 'three';
import { useThermoStore } from '../_core/useThermoStore';
import { FlowMaterial } from '../_core/shaders';
import { thermoXRStore } from '../_core/thermoXRStore';
import HeatEngine from '../_core/HeatEngine';
import LossParticles from './LossParticles';

const PIPE_LENGTH = 5.0;
const PIPE_RADIUS = 0.18; // visual; not physical (real diameter is 2 cm)
const HEATER_X = 0;       // heater sits at midpoint

/**
 * Level 3 — Pipeline scene.
 * Glass pipe runs left-to-right. Heater coil at center. Inlet thermometer (blue),
 * outlet thermometer (warm). Loss particles show efficiency live.
 */
export default function PipelineScene() {
    return (
        <Canvas
            camera={{ position: [0, 2.2, 5.5], fov: 50 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'radial-gradient(circle at 50% 30%, #0d1f3a 0%, #050810 100%)' }}
        >
            <XR store={thermoXRStore}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[3, 6, 4]} intensity={1.0} />
                <pointLight position={[0, 1.5, 1]} intensity={0.8} color="#ff7040" />
                <pointLight position={[-3, 1, 0]} intensity={0.4} color="#4dc4ff" />
                <pointLight position={[3, 1, 0]} intensity={0.4} color="#ff8060" />

                <Floor />
                <PipeAssembly />
                <Heater />
                <LossParticles
                    heaterPos={[HEATER_X, 0.5, 0]}
                    pipeInlet={[-PIPE_LENGTH / 2 + 0.5, 0.5, 0]}
                />
                <SteamPlume />
                <Thermometers />
            </XR>

            <OrbitControls
                enablePan={false}
                minDistance={3}
                maxDistance={9}
                maxPolarAngle={Math.PI / 2.05}
                target={[0, 0.5, 0]}
            />

        </Canvas>
    );
}

function Floor() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[12, 6]} />
                <meshStandardMaterial color="#0e1428" roughness={0.85} />
            </mesh>
            <gridHelper args={[12, 24, '#1a2c4a', '#0f1830']} position={[0, 0.01, 0]} />
        </>
    );
}

/**
 * Glass pipe (outer cylinder) + flowing water shader (inner cylinder).
 */
function PipeAssembly() {
    const [flowMaterial] = useState(() => new FlowMaterial());

    /* eslint-disable react-hooks/immutability */
    useFrame((state, dt) => {
        const s = useThermoStore.getState();
        if (s.level !== 3 || !s.flow) return;
        flowMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        flowMaterial.uniforms.uFlowSpeed.value = s.flow.velocity;
        flowMaterial.uniforms.uTin.value = s.flow.T_in;
        flowMaterial.uniforms.uTout.value = Math.min(s.flow.T_out, 100);

        // Boiling check: if outlet temp would exceed 100, gradually fade boiling on
        const { boiling } = HeatEngine.checkBoiling({ material: 'water', temperature: s.flow.T_out });
        const target = boiling ? 1 : 0;
        const cur = flowMaterial.uniforms.uBoiling.value;
        flowMaterial.uniforms.uBoiling.value = cur + (target - cur) * Math.min(1, dt * 3);
    });
    /* eslint-enable react-hooks/immutability */

    return (
        <group position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            {/* Outer glass pipe */}
            <mesh>
                <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, PIPE_LENGTH, 48, 1, true]} />
                <meshPhysicalMaterial
                    color="#cbe7ff"
                    transmission={0.9}
                    roughness={0.05}
                    thickness={0.2}
                    transparent
                    opacity={0.32}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Inner flowing water with custom shader */}
            <mesh>
                <cylinderGeometry args={[PIPE_RADIUS * 0.85, PIPE_RADIUS * 0.85, PIPE_LENGTH * 0.99, 32]} />
                <primitive object={flowMaterial} attach="material" />
            </mesh>

            {/* End caps (flanges) */}
            <mesh position={[0, PIPE_LENGTH / 2 + 0.08, 0]}>
                <cylinderGeometry args={[PIPE_RADIUS * 1.25, PIPE_RADIUS * 1.25, 0.16, 24]} />
                <meshStandardMaterial color="#445566" metalness={0.85} roughness={0.3} />
            </mesh>
            <mesh position={[0, -PIPE_LENGTH / 2 - 0.08, 0]}>
                <cylinderGeometry args={[PIPE_RADIUS * 1.25, PIPE_RADIUS * 1.25, 0.16, 24]} />
                <meshStandardMaterial color="#445566" metalness={0.85} roughness={0.3} />
            </mesh>
        </group>
    );
}

/**
 * Heater coil — toroidal red-glowing ring around the pipe centerline.
 * Pulses at the rate proportional to total heater power.
 */
function Heater() {
    const matRef = useRef();
    useFrame((state) => {
        if (!matRef.current) return;
        const t = state.clock.elapsedTime;
        const pulse = 0.6 + 0.4 * Math.sin(t * 4);
        matRef.current.emissiveIntensity = 1.4 + pulse * 0.6;
    });

    return (
        <group position={[HEATER_X, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
                <torusGeometry args={[PIPE_RADIUS * 1.6, 0.06, 16, 32]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#ff5020"
                    emissive="#ff5020"
                    emissiveIntensity={1.5}
                    metalness={0.5}
                    roughness={0.4}
                />
            </mesh>
            {/* Coil cage */}
            <mesh>
                <torusGeometry args={[PIPE_RADIUS * 1.85, 0.015, 8, 24]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.3} />
            </mesh>

            <Html position={[0, 0, 0.5]} center distanceFactor={6}>
                <div className="thermo-heater-tag">
                    🔥 НАГРЕВАТЕЛЬ <strong>50 кВт</strong>
                </div>
            </Html>
        </group>
    );
}

const STEAM_COUNT = 140;

function createSteamBuffers() {
    const positions = new Float32Array(STEAM_COUNT * 3);
    const seeds = new Float32Array(STEAM_COUNT);
    for (let i = 0; i < STEAM_COUNT; i++) {
        seeds[i] = pseudoRandom(i + 1);
        positions[i * 3] = PIPE_LENGTH / 2 - 0.45;
        positions[i * 3 + 1] = 0.8;
        positions[i * 3 + 2] = 0;
    }
    return { positions, seeds };
}

function pseudoRandom(seed) {
    return Math.sin(seed * 127.1) * 43758.5453 % 1;
}

/**
 * Steam plume appears only when the projected outlet temperature crosses
 * 100°C. It is deliberately cheap: one Points draw call, deterministic seeds,
 * and per-frame buffer mutation.
 */
function SteamPlume() {
    const pointsRef = useRef();
    const materialRef = useRef();
    const [buffers] = useState(createSteamBuffers);

    /* eslint-disable react-hooks/immutability */
    useFrame((state) => {
        const flow = useThermoStore.getState().flow;
        if (!flow) return;
        const boiling = Math.max(0, Math.min(1, (flow.T_out - 96) / 28));
        const time = state.clock.elapsedTime;

        for (let i = 0; i < STEAM_COUNT; i++) {
            const seed = Math.abs(buffers.seeds[i]);
            const phase = (time * (0.18 + seed * 0.35) + seed) % 1;
            const swirl = Math.sin((phase + seed) * Math.PI * 2);
            const i3 = i * 3;
            buffers.positions[i3] = PIPE_LENGTH / 2 - 0.55 + swirl * 0.28 * phase;
            buffers.positions[i3 + 1] = 0.75 + phase * (1.35 + seed * 0.45);
            buffers.positions[i3 + 2] = Math.cos((phase + seed * 0.7) * Math.PI * 2) * 0.24 * phase;
        }

        const geom = pointsRef.current?.geometry;
        if (geom) geom.attributes.position.needsUpdate = true;
        if (materialRef.current) {
            materialRef.current.opacity = 0.55 * boiling;
            materialRef.current.size = 0.06 + boiling * 0.05;
        }
    });
    /* eslint-enable react-hooks/immutability */

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={STEAM_COUNT}
                    array={buffers.positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                ref={materialRef}
                color="#eaf8ff"
                transparent
                opacity={0}
                depthWrite={false}
                size={0.08}
                sizeAttenuation
            />
        </points>
    );
}

/**
 * Two thermometers above the pipe: inlet (cold, fixed) and outlet (live).
 */
function Thermometers() {
    const inRef = useRef();
    const outRef = useRef();
    useFrame(() => {
        const s = useThermoStore.getState();
        if (!s.flow) return;
        if (inRef.current) inRef.current.textContent = `${s.flow.T_in.toFixed(0)}°C`;
        if (outRef.current) outRef.current.textContent = s.flow.T_out >= 100 ? '100°C+' : `${s.flow.T_out.toFixed(0)}°C`;
    });

    return (
        <>
            <Html position={[-PIPE_LENGTH / 2, 1.1, 0]} center>
                <div className="thermo-pipe-thermo cold">
                    <div className="thermo-pipe-thermo-label">Вход</div>
                    <div ref={inRef} className="thermo-pipe-thermo-value">15°C</div>
                </div>
            </Html>
            <Html position={[PIPE_LENGTH / 2, 1.1, 0]} center>
                <div className="thermo-pipe-thermo hot">
                    <div className="thermo-pipe-thermo-label">Выход</div>
                    <div ref={outRef} className="thermo-pipe-thermo-value">35°C</div>
                </div>
            </Html>
        </>
    );
}
