import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Scene3D - базовая Three.js сцена
 * Управление:
 * - ЛКМ: drag деталей
 * - ПКМ: вращение камеры
 * - СКМ (колесико зажать): панорама
 * - Колесико крутить: zoom
 */
function Scene3D({ children }) {
  return (
    <Canvas shadows className="scene-canvas" onCreated={({ gl }) => {
      gl.setClearColor('#1a2a4e');
    }}>
      <PerspectiveCamera
        makeDefault
        position={[12, 8, 12]}
        fov={50}
      />

      {/* Освещение */}
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

      {/* OrbitControls с кастомными кнопками */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0, 0]}
        mouseButtons={{
          LEFT: undefined,              // ЛКМ не управляет камерой (для drag)
          MIDDLE: THREE.MOUSE.RIGHT,    // СКМ - панорама (используем код RIGHT=2)
          RIGHT: THREE.MOUSE.LEFT       // ПКМ - вращение (используем код LEFT=0)
        }}
      />

      {/* Сетка */}
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

export default Scene3D;
