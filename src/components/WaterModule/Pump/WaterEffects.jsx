import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 40;
const BUBBLE_COUNT = 25;

// ═══════════════════════════════════════════════════════
// 1. Капли воды — вылетают из верха трубы при прокачке
// ═══════════════════════════════════════════════════════
export function WaterParticles({ isSimulating }) {
    const meshRef = useRef();
    const particleData = useRef([]);

    // Инициализация позиций и скоростей
    const positions = useMemo(() => {
        const arr = new Float32Array(PARTICLE_COUNT * 3);
        particleData.current = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particleData.current.push({
                vx: (Math.random() - 0.5) * 0.08,  // Разброс по X
                vy: Math.random() * 0.08 + 0.04,     // Скорость вверх
                vz: (Math.random() - 0.5) * 0.06,   // Разброс по Z
                life: Math.random(),                  // Фаза жизни
                speed: Math.random() * 0.5 + 0.5,    // Множитель скорости
            });
            // Начальная позиция — верх трубы
            arr[i * 3] = 0;
            arr[i * 3 + 1] = 2.5;
            arr[i * 3 + 2] = 0;
        }
        return arr;
    }, []);

    useFrame((_, delta) => {
        if (!meshRef.current || !isSimulating) return;
        const pos = meshRef.current.geometry.attributes.position;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const d = particleData.current[i];
            d.life += delta * d.speed * 1.5;

            if (d.life > 1) {
                // Сбросить частицу — заново из верха трубы
                d.life = 0;
                d.vx = (Math.random() - 0.5) * 0.08;
                d.vy = Math.random() * 0.08 + 0.04;
                d.vz = (Math.random() - 0.5) * 0.06;
                pos.array[i * 3] = (Math.random() - 0.5) * 0.3;
                pos.array[i * 3 + 1] = 2.0;
                pos.array[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            } else {
                // Физика: вверх → падение (гравитация)
                const gravity = -0.15;
                const t = d.life;
                pos.array[i * 3] += d.vx * d.speed;
                pos.array[i * 3 + 1] += (d.vy + gravity * t) * d.speed;
                pos.array[i * 3 + 2] += d.vz * d.speed;
            }
        }
        pos.needsUpdate = true;
    });

    if (!isSimulating) return null;

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={PARTICLE_COUNT}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.12}
                color="#4FC3F7"
                transparent
                opacity={0.8}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

// ═══════════════════════════════════════════════════════
// 2. Пузырьки в водоносном слое
// ═══════════════════════════════════════════════════════
export function AquiferBubbles({ waterDepth }) {
    const meshRef = useRef();
    const bubbleData = useRef([]);

    const positions = useMemo(() => {
        const arr = new Float32Array(BUBBLE_COUNT * 3);
        bubbleData.current = [];
        for (let i = 0; i < BUBBLE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 16;
            const y = -waterDepth - Math.random() * 2;
            const z = (Math.random() - 0.5) * 2;
            arr[i * 3] = x;
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = z;
            bubbleData.current.push({
                baseX: x,
                speed: Math.random() * 0.3 + 0.1,
                wobble: Math.random() * Math.PI * 2,
            });
        }
        return arr;
    }, [waterDepth]);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const pos = meshRef.current.geometry.attributes.position;

        for (let i = 0; i < BUBBLE_COUNT; i++) {
            const d = bubbleData.current[i];
            // Пузырёк поднимается
            pos.array[i * 3 + 1] += d.speed * delta;
            // Лёгкое покачивание по X
            d.wobble += delta * 2;
            pos.array[i * 3] = d.baseX + Math.sin(d.wobble) * 0.15;

            // Если пузырёк поднялся выше аквифера — сбросить
            if (pos.array[i * 3 + 1] > -waterDepth + 0.5) {
                pos.array[i * 3] = (Math.random() - 0.5) * 16;
                pos.array[i * 3 + 1] = -waterDepth - 1.5 - Math.random();
                pos.array[i * 3 + 2] = (Math.random() - 0.5) * 2;
                d.baseX = pos.array[i * 3];
                d.wobble = Math.random() * Math.PI * 2;
            }
        }
        pos.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={BUBBLE_COUNT}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.1}
                color="#90CAF9"
                transparent
                opacity={0.6}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}
