import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';

/**
 * RocketScene3D - 3D сцена для сборки ракеты
 * Визуально похожа на Scene3D машины (сине-голубой фон)
 */
function RocketScene3D({ children }) {
    return (
        <Canvas
            shadows
            className="rocket-scene-canvas"
            onCreated={({ gl }) => {
                gl.setClearColor('#1a2a4e'); // Такой же как у машины
            }}
        >
            <PerspectiveCamera
                makeDefault
                position={[12, 8, 12]}
                fov={50}
            />

            {/* Освещение - как у машины */}
            <ambientLight intensity={0.9} />

            <directionalLight
                position={[10, 15, 10]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />

            <spotLight
                position={[0, 20, 0]}
                angle={0.4}
                penumbra={1}
                intensity={0.5}
                castShadow
            />

            {/* OrbitControls - как у машины */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={5}
                maxDistance={80}
                maxPolarAngle={Math.PI / 2}
                target={[0, 3, 0]} // Немного выше для ракеты
                mouseButtons={{
                    LEFT: undefined,              // ЛКМ для drag деталей
                    MIDDLE: THREE.MOUSE.RIGHT,    // СКМ - панорама
                    RIGHT: THREE.MOUSE.LEFT       // ПКМ - вращение камеры
                }}
            />

            {/* Сетка - как у машины */}
            <Grid
                args={[50, 50]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#4a6aff"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#00f2ff"
                fadeDistance={30}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={false}
            />

            <axesHelper args={[5]} />

            {/* Стартовая платформа */}
            <Launchpad />

            {/* Земля */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial
                    color="#1a2a4e"
                    metalness={0.1}
                    roughness={0.9}
                />
            </mesh>

            {children}
        </Canvas>
    );
}

/**
 * Launchpad - стартовая площадка (упрощенная)
 */
function Launchpad() {
    return (
        <group>
            {/* Центральный круг (место для ракеты) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[1.5, 2.5, 32]} />
                <meshStandardMaterial
                    color="#ff9900"
                    emissive="#ff6600"
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* Направляющие линии */}
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    rotation={[-Math.PI / 2, 0, (Math.PI / 2) * i]}
                    position={[0, 0.02, 0]}
                >
                    <planeGeometry args={[0.1, 4]} />
                    <meshStandardMaterial
                        color="#00ff9f"
                        emissive="#00ff9f"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default RocketScene3D;
