import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { XR } from '@react-three/xr';
import * as THREE from 'three';
import { useThermoStore } from '../_core/useThermoStore';
import { temperatureToColor, getMaterial } from '../_core/materials';
import { thermoXRStore } from '../_core/thermoXRStore';
import PhononField from './PhononField';

export default function BeakerScene() {
    const insertAll = () => {
        const s = useThermoStore.getState();
        Object.keys(s.bodies).forEach(id => {
            if (s.bodies[id].inserted === false) s.setBodyInserted(id, true);
        });
        s.startSimulation();
    };

    return (
        <Canvas
            camera={{ position: [3.5, 3.0, 4.5], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true }}
            style={{ background: '#0d1433' }}
        >
            <XR store={thermoXRStore}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 4]} intensity={1.0} />
                <pointLight position={[-3, 2, 2]} intensity={0.5} color="#9d4edd" />
                <pointLight position={[3, 2, -2]} intensity={0.4} color="#00f2ff" />

                <LabBench />
                <Beaker />
                <BodyMeshes />
                <PhononLayer />
            </XR>

            <OrbitControls
                enablePan={false}
                minDistance={3}
                maxDistance={9}
                maxPolarAngle={Math.PI / 2.05}
                target={[0, 0.5, 0]}
            />

            <SceneOverlay onInsertAll={insertAll} />
        </Canvas>
    );
}

function LabBench() {
    return (
        <group>
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[8, 0.1, 5]} />
                <meshStandardMaterial color="#1a1f3a" roughness={0.85} metalness={0.1} />
            </mesh>
            <gridHelper args={[8, 16, '#2a3060', '#1a2050']} position={[0, 0.001, 0]} />
        </group>
    );
}

function Beaker() {
    return (
        <group position={[0, 0, 0]}>
            {/* Outer glass cylinder — simple transparent, no transmission */}
            <mesh>
                <cylinderGeometry args={[0.95, 0.95, 1.6, 48, 1, true]} />
                <meshStandardMaterial
                    color="#88ccff"
                    transparent
                    opacity={0.18}
                    side={THREE.DoubleSide}
                    metalness={0.1}
                    roughness={0.1}
                />
            </mesh>
            {/* Bottom */}
            <mesh position={[0, -0.8, 0]}>
                <cylinderGeometry args={[0.95, 0.95, 0.04, 48]} />
                <meshStandardMaterial color="#88ccff" transparent opacity={0.25} />
            </mesh>
            {/* Rim */}
            <mesh position={[0, 0.8, 0]}>
                <torusGeometry args={[0.95, 0.04, 12, 48]} />
                <meshStandardMaterial color="#dff2ff" metalness={0.6} roughness={0.2} />
            </mesh>
        </group>
    );
}

function BodyMeshes() {
    const bodies = useThermoStore(s => s.bodies);
    const ids = useMemo(() => Object.keys(bodies), [bodies]);
    return (
        <>
            {ids.map(id => <BodyMesh key={id} id={id} />)}
        </>
    );
}

function BodyMesh({ id }) {
    const matRef = useRef();
    const labelRef = useRef();
    const initialBody = useThermoStore.getState().bodies[id];
    const inserted = useThermoStore(s => s.bodies[id]?.inserted);
    const position = useThermoStore(s => s.bodies[id]?.position);

    const materialKey = initialBody?.material;
    const matDef = useMemo(
        () => (materialKey ? getMaterial(materialKey) : null),
        [materialKey]
    );

    const geometry = useMemo(() => {
        if (id === 'water_beaker') return <cylinderGeometry args={[0.82, 0.82, 0.65, 32]} />;
        if (id === 'steel_part')   return <boxGeometry args={[0.55, 0.55, 0.55]} />;
        if (id === 'copper_plate') return <boxGeometry args={[0.85, 0.11, 0.85]} />;
        return <sphereGeometry args={[0.35, 20, 20]} />;
    }, [id]);

    useFrame(() => {
        const body = useThermoStore.getState().bodies[id];
        if (!body || !matRef.current) return;
        const col = temperatureToColor(body.temperature, 0, 100);
        matRef.current.emissive.set(col);
        matRef.current.emissiveIntensity = Math.min(1.4, Math.abs(body.temperature - 20) / 40 + 0.25);
        if (labelRef.current) {
            labelRef.current.textContent = `${body.label ?? id}: ${body.temperature.toFixed(1)}°C`;
        }
    });

    if (!matDef) return null;

    const yInserted = id === 'water_beaker' ? -0.35 : id === 'steel_part' ? -0.15 : -0.5;
    const restPos = position || [0, 1.5, 0];
    const pos = inserted ? [0, yInserted, 0] : restPos;

    return (
        <group position={pos}>
            <mesh>
                {geometry}
                <meshStandardMaterial
                    ref={matRef}
                    color={matDef.color}
                    metalness={id === 'water_beaker' ? 0.05 : 0.55}
                    roughness={id === 'water_beaker' ? 0.2 : 0.35}
                    transparent={id === 'water_beaker'}
                    opacity={id === 'water_beaker' ? 0.8 : 1}
                />
            </mesh>
            <Html
                position={[0, id === 'copper_plate' ? 0.35 : 0.6, 0]}
                center
                distanceFactor={6}
            >
                <div className="thermo-body-label">
                    <span ref={labelRef}>{matDef.label}</span>
                </div>
            </Html>
        </group>
    );
}

function PhononLayer() {
    const allInserted = useThermoStore(
        s => Object.values(s.bodies).every(b => b.inserted !== false)
    );
    if (!allInserted) return null;

    return (
        <PhononField
            bodyPositions={{
                water_beaker: [0, -0.35, 0],
                steel_part:   [0, -0.15, 0],
                copper_plate: [0, -0.5,  0],
            }}
        />
    );
}

function SceneOverlay({ onInsertAll }) {
    const allIn = useThermoStore(
        s => Object.values(s.bodies).every(b => b.inserted !== false)
    );
    const mode = useThermoStore(s => s.mode);
    if (allIn || mode !== 'setup') return null;

    return (
        <Html fullscreen>
            <div className="thermo-overlay-hint">
                <button className="thermo-cta" onClick={onInsertAll}>
                    💧 Бросить всё в стакан
                </button>
                <p>Нажми, чтобы поместить все три тела в воду и запустить теплообмен.</p>
            </div>
        </Html>
    );
}
