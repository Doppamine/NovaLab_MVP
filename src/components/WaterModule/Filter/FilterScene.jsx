import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Цвета слоёв
const LAYER_COLORS = {
    gravelCoarse: '#5D4037',   // тёмно-коричневый
    gravelFine: '#795548',     // коричневый
    sandCoarse: '#D4A056',     // желто-коричневый
    sandFine: '#F0D68A',       // светло-жёлтый
};

const BUCKET_RADIUS = 1.5;
const BUCKET_HEIGHT = 5;
const LAYER_HEIGHT = 0.8;

// Конфигурация слоёв (снизу вверх)
const LAYER_ORDER = ['gravelCoarse', 'gravelFine', 'sandCoarse', 'sandFine'];

export default function FilterScene({ assembledParts, isFiltering }) {
    const dirtyParticlesRef = useRef();
    const cleanParticlesRef = useRef();
    const particleData = useRef([]);

    const bucketBottom = -BUCKET_HEIGHT / 2;

    // Подсчитать высоту установленных слоёв
    const layers = useMemo(() => {
        const result = [];
        let y = bucketBottom + 0.3; // Чуть выше дна
        LAYER_ORDER.forEach(layerId => {
            if (assembledParts.includes(layerId)) {
                result.push({ id: layerId, y, color: LAYER_COLORS[layerId] });
                y += LAYER_HEIGHT;
            }
        });
        return result;
    }, [assembledParts]);

    const topOfLayers = bucketBottom + 0.3 + layers.length * LAYER_HEIGHT;

    // Грязные частицы (сверху вниз)
    const DIRTY_COUNT = 30;
    const dirtyPositions = useMemo(() => {
        const arr = new Float32Array(DIRTY_COUNT * 3);
        particleData.current = [];
        for (let i = 0; i < DIRTY_COUNT; i++) {
            arr[i * 3] = (Math.random() - 0.5) * BUCKET_RADIUS * 1.2;
            arr[i * 3 + 1] = BUCKET_HEIGHT / 2 + Math.random() * 2;
            arr[i * 3 + 2] = (Math.random() - 0.5) * BUCKET_RADIUS * 0.5;
            particleData.current.push({
                speed: 0.3 + Math.random() * 0.5,
                phase: Math.random(),
            });
        }
        return arr;
    }, []);

    // Чистые частицы (из трубки)
    const CLEAN_COUNT = 15;
    const cleanPositions = useMemo(() => {
        const arr = new Float32Array(CLEAN_COUNT * 3);
        for (let i = 0; i < CLEAN_COUNT; i++) {
            arr[i * 3] = BUCKET_RADIUS + 1.5 + (Math.random() - 0.5) * 0.2;
            arr[i * 3 + 1] = bucketBottom + Math.random() * 0.5;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
        return arr;
    }, []);

    const cleanParticleData = useRef(
        Array.from({ length: CLEAN_COUNT }, () => ({
            speed: 0.5 + Math.random() * 0.8,
            phase: Math.random(),
        }))
    );

    // Анимация
    useFrame((_, delta) => {
        // Грязные частицы — падают сверху, исчезают в фильтре
        if (dirtyParticlesRef.current && isFiltering) {
            const pos = dirtyParticlesRef.current.geometry.attributes.position;
            for (let i = 0; i < DIRTY_COUNT; i++) {
                const d = particleData.current[i];
                pos.array[i * 3 + 1] -= d.speed * delta;

                // Покачивание
                pos.array[i * 3] += Math.sin(d.phase * 10) * 0.002;
                d.phase += delta;

                // Если упала ниже слоёв — сброс наверх
                if (pos.array[i * 3 + 1] < topOfLayers - 0.2) {
                    pos.array[i * 3] = (Math.random() - 0.5) * BUCKET_RADIUS * 1.0;
                    pos.array[i * 3 + 1] = BUCKET_HEIGHT / 2 + Math.random();
                    pos.array[i * 3 + 2] = (Math.random() - 0.5) * BUCKET_RADIUS * 0.4;
                }
            }
            pos.needsUpdate = true;
        }

        // Чистые частицы — капают из трубки
        if (cleanParticlesRef.current && isFiltering) {
            const pos = cleanParticlesRef.current.geometry.attributes.position;
            for (let i = 0; i < CLEAN_COUNT; i++) {
                const d = cleanParticleData.current[i];
                pos.array[i * 3 + 1] -= d.speed * delta;

                if (pos.array[i * 3 + 1] < bucketBottom - 2) {
                    pos.array[i * 3] = BUCKET_RADIUS + 1.5 + (Math.random() - 0.5) * 0.15;
                    pos.array[i * 3 + 1] = bucketBottom + 0.3;
                    pos.array[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
                }
            }
            pos.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* Корпус (ведро) — полупрозрачный цилиндр */}
            {assembledParts.includes('bucket') && (
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[BUCKET_RADIUS, BUCKET_RADIUS * 0.9, BUCKET_HEIGHT, 32, 1, true]} />
                    <meshPhysicalMaterial
                        transmission={0.7}
                        opacity={0.3}
                        roughness={0.15}
                        transparent
                        color="#b0bec5"
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* Дно ведра */}
            {assembledParts.includes('bucket') && (
                <mesh position={[0, bucketBottom, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[BUCKET_RADIUS * 0.9, 32]} />
                    <meshStandardMaterial color="#78909c" metalness={0.3} roughness={0.7} />
                </mesh>
            )}

            {/* Слои фильтра */}
            {layers.map((layer, i) => (
                <mesh key={layer.id} position={[0, layer.y + LAYER_HEIGHT / 2, 0]}>
                    <cylinderGeometry args={[
                        BUCKET_RADIUS * 0.88,
                        BUCKET_RADIUS * 0.88,
                        LAYER_HEIGHT,
                        32
                    ]} />
                    <meshStandardMaterial
                        color={layer.color}
                        roughness={0.9}
                        metalness={0.05}
                    />
                </mesh>
            ))}

            {/* Диффузорная пластина */}
            {assembledParts.includes('diffuser') && layers.length > 0 && (
                <mesh position={[0, topOfLayers + 0.1, 0]}>
                    <cylinderGeometry args={[BUCKET_RADIUS * 0.85, BUCKET_RADIUS * 0.85, 0.15, 32]} />
                    <meshStandardMaterial color="#607d8b" metalness={0.5} roughness={0.5} />
                </mesh>
            )}

            {/* Выходная трубка */}
            {assembledParts.includes('outlet') && (
                <group>
                    {/* Горизонтальная часть внутри */}
                    <mesh position={[BUCKET_RADIUS * 0.45, bucketBottom + 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.08, 0.08, BUCKET_RADIUS, 12]} />
                        <meshStandardMaterial color="#90a4ae" />
                    </mesh>
                    {/* Вертикальная часть снаружи (поднимается вверх) */}
                    <mesh position={[BUCKET_RADIUS + 0.5, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, BUCKET_HEIGHT * 0.6, 12]} />
                        <meshStandardMaterial color="#90a4ae" />
                    </mesh>
                    {/* Изгиб выхода */}
                    <mesh position={[BUCKET_RADIUS + 1.0, bucketBottom + 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.08, 0.08, 1.0, 12]} />
                        <meshStandardMaterial color="#90a4ae" />
                    </mesh>
                </group>
            )}

            {/* Грязные частицы (сверху) */}
            {isFiltering && (
                <points ref={dirtyParticlesRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={DIRTY_COUNT}
                            array={dirtyPositions}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.15}
                        color="#8B6914"
                        transparent
                        opacity={0.9}
                        sizeAttenuation
                        depthWrite={false}
                    />
                </points>
            )}

            {/* Чистые частицы (из трубки) */}
            {isFiltering && assembledParts.includes('outlet') && (
                <points ref={cleanParticlesRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={CLEAN_COUNT}
                            array={cleanPositions}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.12}
                        color="#4FC3F7"
                        transparent
                        opacity={0.85}
                        sizeAttenuation
                        depthWrite={false}
                    />
                </points>
            )}

            {/* Вода сверху (грязная, полупрозрачная) */}
            {isFiltering && assembledParts.includes('bucket') && (
                <mesh position={[0, BUCKET_HEIGHT / 2 - 0.3, 0]}>
                    <cylinderGeometry args={[BUCKET_RADIUS * 0.87, BUCKET_RADIUS * 0.87, 0.5, 32]} />
                    <meshPhysicalMaterial
                        transmission={0.4}
                        opacity={0.6}
                        roughness={0.3}
                        transparent
                        color="#A67C52"
                    />
                </mesh>
            )}
        </group>
    );
}
