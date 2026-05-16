import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import { XR } from '@react-three/xr';
import * as THREE from 'three';
import { useThermoStore } from '../_core/useThermoStore';
import { temperatureToColor } from '../_core/materials';
import { thermoXRStore } from '../_core/thermoXRStore';
import IRWavefront from './IRWavefront';

/**
 * Level 2 — Kitchen scene.
 * Kettle on a table inside a translucent room. On simulate, an IR shell
 * expands outward. The walls progressively glow as their surface heats up.
 */
export default function KitchenScene() {
    const room = useThermoStore(s => s.room);
    if (!room) return null;

    return (
        <Canvas
            camera={{ position: [4, 3.5, 5.5], fov: 50 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'radial-gradient(circle at 50% 30%, #1a1530 0%, #050307 100%)' }}
        >
            <XR store={thermoXRStore}>
                <ambientLight intensity={0.35} />
                <directionalLight position={[3, 6, 3]} intensity={0.9} />
                <pointLight position={[0, 2.6, 0]} intensity={0.7} color="#ffaa66" />

                <Floor room={room} />
                <RoomShell room={room} />
                <Table />
                <Kettle />
                <IRWavefront origin={[0, 0.95, 0]} maxRadius={Math.max(room.width, room.depth, room.height) * 0.85} />
                <RoomThermometer room={room} />
            </XR>

            <OrbitControls
                enablePan={false}
                minDistance={3}
                maxDistance={12}
                maxPolarAngle={Math.PI / 2.05}
                target={[0, 1, 0]}
            />

        </Canvas>
    );
}

// ──────────────────────────────────────────────────────────────

function Floor({ room }) {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[room.width * 1.4, room.depth * 1.4]} />
                <meshStandardMaterial color="#1c1f2e" roughness={0.85} />
            </mesh>
            <gridHelper args={[Math.max(room.width, room.depth) * 1.4, 14, '#2a3a55', '#15203a']} position={[0, 0.01, 0]} />
        </>
    );
}

/**
 * Room shell — six wall planes (BackSide so we see them from inside).
 * Each wall reads the current air temp from the store and tints its emissive.
 */
function RoomShell({ room }) {
    const wallRefs = useRef([]);

    useFrame(() => {
        const air = useThermoStore.getState().airTemp;
        const col = temperatureToColor(air, 20, 100);
        const intensity = Math.min(1.4, (air - 20) / 60);
        wallRefs.current.forEach(m => {
            if (m) {
                m.emissive.set(col);
                m.emissiveIntensity = intensity;
            }
        });
    });

    const wallMat = (idx) => (
        <meshStandardMaterial
            ref={(m) => { wallRefs.current[idx] = m; }}
            color="#2a2540"
            transparent
            opacity={0.18}
            side={THREE.BackSide}
            roughness={0.8}
        />
    );

    const w = room.width, d = room.depth, h = room.height;
    return (
        <group position={[0, h / 2, 0]}>
            <mesh>
                <boxGeometry args={[w, h, d]} />
                {wallMat(0)}
            </mesh>
        </group>
    );
}

function Table() {
    return (
        <group position={[0, 0.35, 0]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.4, 0.06, 1.0]} />
                <meshStandardMaterial color="#3a2a1f" roughness={0.7} />
            </mesh>
            {[[-0.6, -0.18, -0.4], [0.6, -0.18, -0.4], [-0.6, -0.18, 0.4], [0.6, -0.18, 0.4]].map((p, i) => (
                <mesh key={i} position={p} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.36, 8]} />
                    <meshStandardMaterial color="#2a1f15" roughness={0.7} />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Stylized kettle with glowing emissive when running.
 */
function Kettle() {
    const matRef = useRef();
    const matSpoutRef = useRef();
    useFrame(() => {
        const body = useThermoStore.getState().bodies.kettle_water;
        if (!body || !matRef.current) return;
        const col = temperatureToColor(body.temperature, 20, 100);
        matRef.current.emissive.set(col);
        matRef.current.emissiveIntensity = Math.min(1.6, (body.temperature - 20) / 50);
        if (matSpoutRef.current) {
            matSpoutRef.current.emissive.set(col);
            matSpoutRef.current.emissiveIntensity = matRef.current.emissiveIntensity * 0.7;
        }
    });

    return (
        <group position={[0, 0.65, 0]}>
            <Float speed={0} rotationIntensity={0} floatIntensity={0}>
                {/* Body */}
                <mesh castShadow>
                    <sphereGeometry args={[0.32, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
                    <meshStandardMaterial
                        ref={matRef}
                        color="#c0c4cc"
                        metalness={0.85}
                        roughness={0.25}
                    />
                </mesh>
                {/* Lid */}
                <mesh position={[0, 0.18, 0]} castShadow>
                    <cylinderGeometry args={[0.12, 0.16, 0.06, 24]} />
                    <meshStandardMaterial color="#202020" metalness={0.7} roughness={0.4} />
                </mesh>
                {/* Spout */}
                <mesh position={[0.3, 0.05, 0]} rotation={[0, 0, -Math.PI / 5]} castShadow>
                    <cylinderGeometry args={[0.045, 0.06, 0.22, 12]} />
                    <meshStandardMaterial
                        ref={matSpoutRef}
                        color="#c0c4cc"
                        metalness={0.85}
                        roughness={0.25}
                    />
                </mesh>
                {/* Handle */}
                <mesh position={[-0.32, 0.05, 0]}>
                    <torusGeometry args={[0.1, 0.018, 10, 24, Math.PI]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
                </mesh>
            </Float>

            <Html position={[0, -0.15, 0]} center distanceFactor={6}>
                <div className="thermo-body-label">Чайник · 3 л</div>
            </Html>
        </group>
    );
}

/**
 * Big screen-space thermometer that reads the live air temp.
 */
function RoomThermometer({ room }) {
    const txtRef = useRef();
    const fillRef = useRef();
    useFrame(() => {
        const air = useThermoStore.getState().airTemp;
        if (txtRef.current) txtRef.current.textContent = `${air.toFixed(1)}°C`;
        if (fillRef.current) {
            const pct = Math.min(100, Math.max(0, (air - 20) / 80 * 100));
            fillRef.current.style.height = `${pct}%`;
            fillRef.current.style.background = temperatureToColor(air, 20, 100);
        }
    });

    return (
        <Html position={[room.width / 2 - 0.35, room.height * 0.55, room.depth / 2 - 0.05]}>
            <div className="thermo-thermometer">
                <div className="thermo-thermo-tube">
                    <div ref={fillRef} className="thermo-thermo-fill" />
                </div>
                <div ref={txtRef} className="thermo-thermo-readout">20.0°C</div>
                <div className="thermo-thermo-label">Воздух кухни</div>
            </div>
        </Html>
    );
}
