import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import './CarDemo3D.css';
import SoundManager from '../../utils/SoundManager';

// 3D Car with proper movement physics
function Car3D({ keysPressed, headlightsOn, carRef }) {
    const wheelsRef = useRef([]);
    const leftTargetRef = useRef();
    const rightTargetRef = useRef();
    const centerTargetRef = useRef();
    const [carState, setCarState] = useState({
        speed: 0,
        maxSpeed: 8,
        acceleration: 0.2,
        turnSpeed: 0.03,
        friction: 0.92
    });

    useFrame((state, delta) => {
        if (!carRef.current) return;

        let newSpeed = carState.speed;

        // Apply acceleration/braking
        if (keysPressed.up) {
            newSpeed = Math.min(carState.maxSpeed, newSpeed + carState.acceleration);
        }
        if (keysPressed.down) {
            newSpeed = Math.max(-carState.maxSpeed / 2, newSpeed - carState.acceleration);
        }

        // Apply friction
        if (!keysPressed.up && !keysPressed.down) {
            newSpeed *= carState.friction;
            if (Math.abs(newSpeed) < 0.01) newSpeed = 0;
        }

        // Update engine sound pitch based on speed ratio (0 to 1)
        const speedRatio = Math.abs(newSpeed) / carState.maxSpeed;
        SoundManager.setEnginePitch(speedRatio);

        // Apply turning
        if (keysPressed.left && newSpeed !== 0) {
            carRef.current.rotation.y += carState.turnSpeed * Math.sign(newSpeed);
        }
        if (keysPressed.right && newSpeed !== 0) {
            carRef.current.rotation.y -= carState.turnSpeed * Math.sign(newSpeed);
        }

        // Move in the direction car is facing (INVERTED: z=1 instead of z=-1)
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyEuler(carRef.current.rotation);
        forward.multiplyScalar(newSpeed * delta);

        carRef.current.position.add(forward);

        // Rotate wheels
        if (wheelsRef.current[0]) {
            const wheelRotation = newSpeed * delta * 3;
            wheelsRef.current.forEach(wheel => {
                if (wheel) wheel.rotation.x += wheelRotation;
            });
        }

        setCarState(prev => ({ ...prev, speed: newSpeed }));
    });

    return (
        <group ref={carRef} position={[0, 0.5, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[1.8, 0.8, 3]} />
                <meshStandardMaterial color="#ff006e" metalness={0.6} roughness={0.2} />
            </mesh>

            <mesh position={[0, 1.2, -0.3]} castShadow>
                <boxGeometry args={[1.4, 0.6, 1.5]} />
                <meshStandardMaterial color="#9d4edd" metalness={0.4} roughness={0.3} />
            </mesh>

            {[
                [-0.8, 0, 1],
                [0.8, 0, 1],
                [-0.8, 0, -1],
                [0.8, 0, -1]
            ].map((pos, idx) => (
                <mesh
                    key={idx}
                    position={pos}
                    rotation={[0, 0, Math.PI / 2]}
                    ref={el => wheelsRef.current[idx] = el}
                    castShadow
                >
                    <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
                    <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
                </mesh>
            ))}

            <pointLight position={[0.5, 0.5, 1.6]} intensity={2} distance={5} color="#00f2ff" />
            <pointLight position={[-0.5, 0.5, 1.6]} intensity={2} distance={5} color="#00f2ff" />
            <group ref={leftTargetRef} position={[-0.4, 0, 10]} />
            <group ref={rightTargetRef} position={[0.4, 0, 10]} />
            <group ref={centerTargetRef} position={[0, 0, 15]} />

            {/* High Beam Headlights */}
            {headlightsOn && (
                <>
                    <spotLight
                        position={[-0.4, 0.3, 1.2]}
                        target={leftTargetRef.current}
                        angle={0.4}
                        penumbra={0.1}
                        intensity={500}
                        distance={300}
                        color="#ffffff"
                        castShadow
                    />

                    <spotLight
                        position={[0.4, 0.3, 1.2]}
                        target={rightTargetRef.current}
                        angle={0.4}
                        penumbra={0.1}
                        intensity={500}
                        distance={300}
                        color="#ffffff"
                        castShadow
                    />

                    <spotLight
                        position={[0, 0.5, 1.5]}
                        target={centerTargetRef.current}
                        angle={0.25}
                        penumbra={0.1}
                        intensity={1000}
                        distance={700}
                        color="#e6f7ff"
                        castShadow
                    />
                </>
            )}
        </group>
    );
}

function CameraFollower({ carRef }) {
    const controlsRef = useRef();

    useFrame(() => {
        if (controlsRef.current && carRef.current) {
            const carPos = carRef.current.position;
            const currentTarget = controlsRef.current.target;

            currentTarget.x += (carPos.x - currentTarget.x) * 0.1;
            currentTarget.y += (carPos.y - currentTarget.y) * 0.1;
            currentTarget.z += (carPos.z - currentTarget.z) * 0.1;

            controlsRef.current.update();
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enablePan={false}
            target={[0, 0, 0]}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={8}
            maxDistance={25}
        />
    );
}

function Ground() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.8} />
            </mesh>
            <gridHelper args={[100, 100, '#00f2ff', '#151b3d']} position={[0, 0.01, 0]} />
        </>
    );
}

function CarDemo3D({ onComplete }) {
    const [keysPressed, setKeysPressed] = useState({
        up: false,
        down: false,
        left: false,
        right: false
    });
    const [headlightsOn, setHeadlightsOn] = useState(false);
    const carRef = useRef();

    useEffect(() => {
        // Start engine sound
        SoundManager.startEngine();

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') setKeysPressed(prev => ({ ...prev, up: true }));
            if (key === 's' || key === 'arrowdown') setKeysPressed(prev => ({ ...prev, down: true }));
            if (key === 'a' || key === 'arrowleft') setKeysPressed(prev => ({ ...prev, left: true }));
            if (key === 'd' || key === 'arrowright') setKeysPressed(prev => ({ ...prev, right: true }));
            if (key === ' ') setHeadlightsOn(prev => !prev); // Toggle headlights
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') setKeysPressed(prev => ({ ...prev, up: false }));
            if (key === 's' || key === 'arrowdown') setKeysPressed(prev => ({ ...prev, down: false }));
            if (key === 'a' || key === 'arrowleft') setKeysPressed(prev => ({ ...prev, left: false }));
            if (key === 'd' || key === 'arrowright') setKeysPressed(prev => ({ ...prev, right: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            // Stop engine sound
            SoundManager.stopEngine();
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleButtonDown = (direction) => setKeysPressed(prev => ({ ...prev, [direction]: true }));
    const handleButtonUp = (direction) => setKeysPressed(prev => ({ ...prev, [direction]: false }));

    const handleClose = () => {
        SoundManager.stopEngine();
        onComplete();
    };

    return (
        <div className="car-demo-3d">
            <button className="close-3d-btn" onClick={handleClose} title="Выход (ESC)">✕</button>

            <div className="demo-overlay">
                <h2 className="demo-title">🚗 Машинка запущена!</h2>
                <p className="demo-subtitle">Используйте WASD или стрелки</p>

            </div>

            <div className="controls-panel">
                <div className="controls-hint">🎮 Управление</div>

                <div className="arrow-controls">
                    <div className="arrow-row">
                        <button
                            className={`arrow-btn up ${keysPressed.up ? 'active' : ''}`}
                            onMouseDown={() => handleButtonDown('up')}
                            onMouseUp={() => handleButtonUp('up')}
                            onMouseLeave={() => handleButtonUp('up')}
                            onTouchStart={() => handleButtonDown('up')}
                            onTouchEnd={() => handleButtonUp('up')}
                            title="Вперёд (W/↑)"
                        >↑</button>
                    </div>
                    <div className="arrow-row">
                        <button
                            className={`arrow-btn left ${keysPressed.left ? 'active' : ''}`}
                            onMouseDown={() => handleButtonDown('left')}
                            onMouseUp={() => handleButtonUp('left')}
                            onMouseLeave={() => handleButtonUp('left')}
                            onTouchStart={() => handleButtonDown('left')}
                            onTouchEnd={() => handleButtonUp('left')}
                            title="Влево (A/←)"
                        >←</button>
                        <button
                            className={`arrow-btn down ${keysPressed.down ? 'active' : ''}`}
                            onMouseDown={() => handleButtonDown('down')}
                            onMouseUp={() => handleButtonUp('down')}
                            onMouseLeave={() => handleButtonUp('down')}
                            onTouchStart={() => handleButtonDown('down')}
                            onTouchEnd={() => handleButtonUp('down')}
                            title="Назад (S/↓)"
                        >↓</button>
                        <button
                            className={`arrow-btn right ${keysPressed.right ? 'active' : ''}`}
                            onMouseDown={() => handleButtonDown('right')}
                            onMouseUp={() => handleButtonUp('right')}
                            onMouseLeave={() => handleButtonUp('right')}
                            onTouchStart={() => handleButtonDown('right')}
                            onTouchEnd={() => handleButtonUp('right')}
                            title="Вправо (D/→)"
                        >→</button>
                    </div>
                </div>
            </div>

            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[6, 4, 10]} />

                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[10, 15, 5]}
                    intensity={1.2}
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
                    intensity={0.6}
                    angle={0.6}
                    penumbra={1}
                    castShadow
                />

                <Ground />
                <Car3D keysPressed={keysPressed} headlightsOn={headlightsOn} carRef={carRef} />
                <CameraFollower carRef={carRef} />
            </Canvas>
        </div>
    );
}

export default CarDemo3D;
