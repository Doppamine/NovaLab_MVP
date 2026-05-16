import React from 'react';
import { useGLTF } from '@react-three/drei';
import SocketPoint from './SocketPoint';

// Model paths – served from /public/models/
const CHASSIS_MODEL = '/models/car_chassis.glb';
const WHEEL_MODEL = '/models/car_wheel.glb';
const ENGINE_MODEL = '/models/car_engine.glb';
const BODY_MODEL = '/models/car_body.glb';

// 1. ШАССИ – replaced with car_chassis.glb
export function ChassisModel({ connectedParts = [], highlightedSockets = [] }) {
    const { scene } = useGLTF(CHASSIS_MODEL);

    const isSocketHighlighted = (socketPos) => {
        return highlightedSockets.some(h =>
            Math.abs(h.position[0] - socketPos[0]) < 0.1 &&
            Math.abs(h.position[1] - socketPos[1]) < 0.1 &&
            Math.abs(h.position[2] - socketPos[2]) < 0.1
        );
    };

    return (
        <group>
            {/* GLB model replaces the primitive boxGeometry */}
            <primitive object={scene.clone()} castShadow receiveShadow />

            <SocketPoint position={[-1.1, -0.15, 1.6]} type="wheel" highlight={isSocketHighlighted([-1.1, -0.15, 1.6])} />
            <SocketPoint position={[1.9, -0.15, 1.6]} type="wheel" highlight={isSocketHighlighted([1.9, -0.15, 1.6])} />
            <SocketPoint position={[-1.1, -0.15, -2.1]} type="wheel" highlight={isSocketHighlighted([-1.1, -0.15, -2.1])} />
            <SocketPoint position={[1.9, -0.15, -2.1]} type="wheel" highlight={isSocketHighlighted([1.9, -0.15, -2.1])} />
            <SocketPoint position={[0, 0.3, 1.5]} type="engine" highlight={isSocketHighlighted([0, 0.3, 1.5])} />
            <SocketPoint position={[0.5, 0.5, -0.5]} type="body" highlight={isSocketHighlighted([0.5, 0.5, -0.5])} />
            <SocketPoint position={[0.9, 0.3, 1.5]} type="carBattery" highlight={isSocketHighlighted([0.9, 0.3, 1.5])} />
        </group>
    );
}

// 2. КОЛЕСО – replaced with car_wheel.glb
export function WheelModel() {
    const { scene } = useGLTF(WHEEL_MODEL);

    return (
        <group>
            {/* GLB model replaces the primitive cylinderGeometry.
                Rotation applied to orient the wheel correctly (standing upright). */}
            <primitive object={scene.clone()} castShadow />
            <SocketPoint position={[0, 0, 0]} type="chassis" />
        </group>
    );
}

// 3. ДВИГАТЕЛЬ – replaced with car_engine.glb
export function EngineModel() {
    const { scene } = useGLTF(ENGINE_MODEL);

    return (
        <group>
            {/* GLB model replaces the primitive box + cylinder geometry */}
            <primitive object={scene.clone()} castShadow />
            <SocketPoint position={[0, -0.5, 0]} type="chassis" />
        </group>
    );
}

// 4. АККУМУЛЯТОР – kept as primitives (no .glb provided)
export function BatteryModel() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[0.5, 0.4, 0.5]} />
                <meshStandardMaterial color="#00f2ff" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.15, 0.25, 0.15]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
                <meshStandardMaterial color="#ffaa00" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[-0.15, 0.25, 0.15]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
                <meshStandardMaterial color="#ffaa00" metalness={0.9} roughness={0.1} />
            </mesh>
            <SocketPoint position={[-0.5, 0, 0]} type="chassis" />
        </group>
    );
}

// 5. КУЗОВ – replaced with car_body.glb
export function BodyModel() {
    const { scene } = useGLTF(BODY_MODEL);

    return (
        <group>
            {/* GLB model replaces the primitive box geometry with transparent panels */}
            <primitive object={scene.clone()} castShadow />
            <SocketPoint position={[0, 1, 0]} type="chassis" />
        </group>
    );
}

// 6. ПУЛЬТ – kept as primitives (no .glb provided)
export function ControllerModel() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[0.8, 0.5, 1.2]} />
                <meshStandardMaterial color="#00ff9f" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.05, 0.4]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
                <boxGeometry args={[0.6, 0.02, 0.4]} />
                <meshStandardMaterial
                    color="#222"
                    emissive="#00f2ff"
                    emissiveIntensity={0.3}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>
            {[-0.2, 0, 0.2].map((x, i) => (
                <mesh key={i} position={[x, 0.26, -0.2]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
                    <meshStandardMaterial color="#ff006e" metalness={0.6} roughness={0.3} />
                </mesh>
            ))}
            <mesh position={[0, 0.5, -0.5]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
}

export default {
    chassis: ChassisModel,
    wheel: WheelModel,
    engine: EngineModel,
    carBattery: BatteryModel,
    body: BodyModel,
    controller: ControllerModel
};

// Preload all GLB models to avoid runtime loading hitches
useGLTF.preload(CHASSIS_MODEL);
useGLTF.preload(WHEEL_MODEL);
useGLTF.preload(ENGINE_MODEL);
useGLTF.preload(BODY_MODEL);
