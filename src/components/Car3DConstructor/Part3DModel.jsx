import React from 'react';
import SocketPoint from './SocketPoint';

// 1. ШАССИ
export function ChassisModel({ connectedParts = [], highlightedSockets = [] }) {
    const isSocketHighlighted = (socketPos) => {
        return highlightedSockets.some(h =>
            Math.abs(h.position[0] - socketPos[0]) < 0.1 &&
            Math.abs(h.position[1] - socketPos[1]) < 0.1 &&
            Math.abs(h.position[2] - socketPos[2]) < 0.1
        );
    };

    return (
        <group>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[4, 0.3, 6]} />
                <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
            </mesh>

            <SocketPoint position={[-1.8, -0.15, 2.8]} type="wheel" highlight={isSocketHighlighted([-1.8, -0.15, 2.8])} />
            <SocketPoint position={[1.8, -0.15, 2.8]} type="wheel" highlight={isSocketHighlighted([1.8, -0.15, 2.8])} />
            <SocketPoint position={[-1.8, -0.15, -2.8]} type="wheel" highlight={isSocketHighlighted([-1.8, -0.15, -2.8])} />
            <SocketPoint position={[1.8, -0.15, -2.8]} type="wheel" highlight={isSocketHighlighted([1.8, -0.15, -2.8])} />
            <SocketPoint position={[0, 0.3, 1.5]} type="engine" highlight={isSocketHighlighted([0, 0.3, 1.5])} />
            <SocketPoint position={[0, 0.8, 0]} type="body" highlight={isSocketHighlighted([0, 0.8, 0])} />
        </group>
    );
}

// 2. КОЛЕСО
export function WheelModel() {
    return (
        <group>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
                <meshStandardMaterial color="#222" metalness={0.3} roughness={0.8} />
            </mesh>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.5, 0.5, 0.52, 32]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>
            <SocketPoint position={[0, 0, 0]} type="chassis" />
        </group>
    );
}

// 3. ДВИГАТЕЛЬ
export function EngineModel() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[1.5, 1, 1.5]} />
                <meshStandardMaterial color="#ff006e" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0.6, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
                <meshStandardMaterial color="#9d4edd" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-0.6, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
                <meshStandardMaterial color="#9d4edd" metalness={0.7} roughness={0.3} />
            </mesh>
            <SocketPoint position={[0, -0.5, 0]} type="chassis" />
            <SocketPoint position={[1.0, 0, 0]} type="carBattery" />
        </group>
    );
}

// 4. АККУМУЛЯТОР
export function BatteryModel() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[1, 0.8, 1]} />
                <meshStandardMaterial color="#00f2ff" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0.5, 0.3]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
                <meshStandardMaterial color="#ffaa00" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[-0.3, 0.5, 0.3]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
                <meshStandardMaterial color="#ffaa00" metalness={0.9} roughness={0.1} />
            </mesh>
            <SocketPoint position={[-0.5, 0, 0]} type="engine" />
        </group>
    );
}

// 5. КУЗОВ
export function BodyModel() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[3.5, 1.5, 5.5]} />
                <meshStandardMaterial
                    color="#9d4edd"
                    transparent
                    opacity={0.6}
                    metalness={0.4}
                    roughness={0.3}
                />
            </mesh>
            <mesh position={[0, 0.6, -1]} castShadow>
                <boxGeometry args={[3, 0.8, 2.5]} />
                <meshStandardMaterial
                    color="#7b2cbf"
                    transparent
                    opacity={0.7}
                    metalness={0.4}
                    roughness={0.3}
                />
            </mesh>
            <mesh position={[1.6, 0.6, -1]} castShadow>
                <boxGeometry args={[0.05, 0.6, 2]} />
                <meshStandardMaterial
                    color="#00f2ff"
                    transparent
                    opacity={0.3}
                    metalness={0.8}
                    roughness={0.1}
                />
            </mesh>
            <mesh position={[-1.6, 0.6, -1]} castShadow>
                <boxGeometry args={[0.05, 0.6, 2]} />
                <meshStandardMaterial
                    color="#00f2ff"
                    transparent
                    opacity={0.3}
                    metalness={0.8}
                    roughness={0.1}
                />
            </mesh>
            <SocketPoint position={[0, -0.75, 0]} type="chassis" />
        </group>
    );
}

// 6. ПУЛЬТ
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
