import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import RocketPartModels from './RocketPart3DModel';

/**
 * LaunchSequence - 7-секундная анимация взлёта ракеты
 * 0-2с: огонь разгорается, подготовка
 * 2-5с: ракета поднимается, тряска камеры
 * 5-7с: ракета улетает вверх
 * 7с+: callback onComplete
 */
function LaunchSequence({ rocketParts, onComplete }) {
    const [phase, setPhase] = useState('ignition'); // ignition, liftoff, ascent, complete
    const [fadeToBlack, setFadeToBlack] = useState(false); // Затемнение перед видео
    const [showVideo, setShowVideo] = useState(false); // Показ видео
    const [showLogo, setShowLogo] = useState(false); // Показ логотипа после видео
    const startTimeRef = useRef(Date.now());
    const rocketSoundRef = useRef(null);

    // Запускаем звук ракеты при старте
    useEffect(() => {
        rocketSoundRef.current = new Audio('/sounds/rocket.mp4');
        rocketSoundRef.current.volume = 0.7;
        rocketSoundRef.current.play().catch(() => { });

        // 6с: начинаем затемнение
        const fadeTimer = setTimeout(() => {
            setFadeToBlack(true);
        }, 6000);

        // 7.5с: показываем видео (после полного затемнения)
        const videoTimer = setTimeout(() => {
            setShowVideo(true);
        }, 7500);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(videoTimer);
            // Останавливаем звук при размонтировании
            if (rocketSoundRef.current) {
                rocketSoundRef.current.pause();
                rocketSoundRef.current = null;
            }
        };
    }, []);

    // Обработчик клавиши пробел для выхода
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && showLogo) {
                e.preventDefault();
                onComplete && onComplete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLogo, onComplete]);

    // Когда видео заканчивается - показываем логотип
    const handleVideoEnd = () => {
        setShowVideo(false);
        setShowLogo(true);
    };

    return (
        <div className="launch-sequence-container">
            <Canvas shadows>
                <PerspectiveCamera
                    makeDefault
                    position={[15, 8, 15]}
                    fov={50}
                />

                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} />

                {/* Анимированная сцена */}
                <LaunchScene
                    rocketParts={rocketParts}
                    startTime={startTimeRef.current}
                />
            </Canvas>

            {/* Затемнение перед видео */}
            {fadeToBlack && (
                <div className="fade-to-black" />
            )}

            {/* Видео после затемнения */}
            {showVideo && (
                <div className="video-overlay">
                    <video
                        src="/videos/final.mp4"
                        autoPlay
                        onEnded={handleVideoEnd}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>
            )}

            {/* Логотип после видео - бесшовный переход */}
            {showLogo && (
                <div className="logo-overlay">
                    <img
                        src="/videos/cycle.gif"
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>
            )}

            <style>{`
                .launch-sequence-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #0a0a1a;
                    z-index: 1000;
                }
                .fade-to-black {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    z-index: 5;
                    animation: fadeToBlack 1.5s ease-in-out forwards;
                }
                @keyframes fadeToBlack {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .video-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    z-index: 10;
                }
                .logo-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    z-index: 15;
                }
                @keyframes fadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .launch-overlay {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    color: white;
                    font-size: 24px;
                    font-family: monospace;
                }
                .countdown-timer {
                    background: rgba(0,0,0,0.7);
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: 1px solid #00ff9f;
                }
            `}</style>
        </div>
    );
}

/**
 * CountdownDisplay - отображает прошедшее время
 */
function CountdownDisplay({ startTime }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed((Date.now() - startTime) / 1000);
        }, 100);
        return () => clearInterval(interval);
    }, [startTime]);

    return <span>T+ {elapsed.toFixed(1)}s</span>;
}

/**
 * LaunchScene - 3D сцена с анимацией
 */
function LaunchScene({ rocketParts, startTime }) {
    const rocketGroupRef = useRef();
    const { camera } = useThree();
    const originalCameraPos = useRef(new THREE.Vector3(25, 15, 25));

    // Находим позицию engine_cluster чтобы центрировать ракету
    const engineCluster = rocketParts.find(p => p.type === 'engine_cluster');
    const rocketCenterX = engineCluster ? engineCluster.position[0] : 0;
    const rocketCenterZ = engineCluster ? engineCluster.position[2] : 0;
    const engineBaseY = engineCluster ? engineCluster.position[1] - 2 : -2; // Низ сопел

    // Устанавливаем начальную позицию камеры
    useEffect(() => {
        camera.position.set(25, 15, 25);
        camera.lookAt(rocketCenterX, 10, rocketCenterZ);
    }, [camera, rocketCenterX, rocketCenterZ]);

    useFrame(() => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (!rocketGroupRef.current) return;

        // Анимация ракеты
        if (elapsed < 2) {
            // Фаза 1: Подготовка - лёгкая вибрация
            rocketGroupRef.current.position.y = Math.sin(elapsed * 30) * 0.03;
        } else if (elapsed < 5) {
            // Фаза 2: Взлёт - медленный подъём
            const liftProgress = (elapsed - 2) / 3;
            rocketGroupRef.current.position.y = liftProgress * 12;

            // Тряска камеры
            camera.position.x = originalCameraPos.current.x + Math.sin(elapsed * 40) * 0.2;
            camera.position.y = originalCameraPos.current.y + Math.cos(elapsed * 35) * 0.15;
        } else if (elapsed < 7) {
            // Фаза 3: Ускорение - быстрый подъём
            const accelProgress = (elapsed - 5) / 2;
            rocketGroupRef.current.position.y = 12 + accelProgress * accelProgress * 40;

            // Уменьшаем тряску
            camera.position.x = originalCameraPos.current.x + Math.sin(elapsed * 20) * 0.05;
            camera.position.y = originalCameraPos.current.y;
        }

        // Камера следит за ракетой
        if (elapsed > 0.5 && elapsed < 7) {
            const targetY = Math.max(10, rocketGroupRef.current.position.y + 5);
            camera.lookAt(rocketCenterX, targetY, rocketCenterZ);
        }
    });

    return (
        <group ref={rocketGroupRef}>
            {/* Рендерим собранную ракету (центрированную) */}
            <AssembledRocket parts={rocketParts} centerX={rocketCenterX} centerZ={rocketCenterZ} />

            {/* Огонь из сопел - под engine_cluster */}
            <EngineFlames startTime={startTime} position={[0, engineBaseY, 0]} />

            {/* Дым */}
            <SmokeParticles startTime={startTime} baseY={engineBaseY} />
        </group>
    );
}

/**
 * AssembledRocket - рендерит собранную ракету (центрированную)
 */
function AssembledRocket({ parts, centerX = 0, centerZ = 0 }) {
    return (
        <group>
            {parts.map(part => {
                const ModelComponent = RocketPartModels[part.type];
                if (!ModelComponent) return null;

                // Центрируем относительно engine_cluster
                const centeredPos = [
                    part.position[0] - centerX,
                    part.position[1],
                    part.position[2] - centerZ
                ];

                return (
                    <group
                        key={part.id}
                        position={centeredPos}
                    >
                        <ModelComponent />
                    </group>
                );
            })}
        </group>
    );
}

/**
 * EngineFlames - огонь из сопел
 */
function EngineFlames({ startTime, position = [0, -4, 0] }) {
    const flameRef = useRef();

    useFrame(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (!flameRef.current) return;

        // Интенсивность огня
        let intensity = 0;
        if (elapsed < 2) {
            intensity = elapsed / 2; // Разгорается
        } else {
            intensity = 1 + Math.sin(elapsed * 20) * 0.2; // Пульсирует
        }

        flameRef.current.scale.set(intensity, intensity * 1.5, intensity);
        flameRef.current.material.emissiveIntensity = intensity * 2;
    });

    return (
        <group position={position}>
            {/* Основное пламя */}
            <mesh ref={flameRef}>
                <coneGeometry args={[1.5, 5, 16]} />
                <meshStandardMaterial
                    color="#ff4400"
                    emissive="#ff6600"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Внутреннее яркое пламя */}
            <mesh position={[0, 0.5, 0]}>
                <coneGeometry args={[0.8, 3, 16]} />
                <meshStandardMaterial
                    color="#ffff00"
                    emissive="#ffffff"
                    emissiveIntensity={3}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Свечение */}
            <pointLight
                color="#ff6600"
                intensity={5}
                distance={20}
                position={[0, -2, 0]}
            />
        </group>
    );
}

/**
 * SmokeParticles - частицы дыма
 */
function SmokeParticles({ startTime, baseY = -4 }) {
    const particlesRef = useRef();
    const particleCount = 100;

    const positions = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 4;
            pos[i * 3 + 1] = baseY + Math.random() * -3;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
        return pos;
    }, [baseY]);

    useFrame(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (!particlesRef.current || elapsed < 1) return;

        const positions = particlesRef.current.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            // Дым расходится в стороны и вниз
            positions[i * 3] += (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] -= 0.05;
            positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;

            // Сброс если слишком далеко
            if (positions[i * 3 + 1] < baseY - 8) {
                positions[i * 3] = (Math.random() - 0.5) * 3;
                positions[i * 3 + 1] = baseY;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
            }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.5}
                color="#aaaaaa"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

export default LaunchSequence;
