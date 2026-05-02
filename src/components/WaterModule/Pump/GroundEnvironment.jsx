import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const LAYER_WIDTH = 20;
const LAYER_DEPTH = 3;
const GAP_WIDTH = 1.5; // Ширина шахты/ямы посередине

// Ширина каждой половинки
const HALF_WIDTH = (LAYER_WIDTH - GAP_WIDTH) / 2;
// X-позиции левой и правой половинки
const LEFT_X = -(GAP_WIDTH / 2 + HALF_WIDTH / 2);
const RIGHT_X = (GAP_WIDTH / 2 + HALF_WIDTH / 2);

export default function GroundEnvironment({ waterDepth, isSimulating }) {
    const topsoilLeftRef = useRef();
    const topsoilRightRef = useRef();

    // Цвет поверхности: сухой → зелёный
    const targetColor = useMemo(
        () => (isSimulating ? new THREE.Color('#2E7D32') : new THREE.Color('#5D4037')),
        [isSimulating]
    );

    useFrame(() => {
        if (topsoilLeftRef.current) {
            topsoilLeftRef.current.material.color.lerp(targetColor, 0.015);
        }
        if (topsoilRightRef.current) {
            topsoilRightRef.current.material.color.lerp(targetColor, 0.015);
        }
    });

    // Расчёт размеров слоёв
    const topsoilH = 1;
    const subsoilH = Math.max(1, waterDepth * 0.35);
    const clayH = Math.max(1, waterDepth * 0.35);
    const rockH = Math.max(0.5, waterDepth * 0.3);
    const aquiferH = 2;
    const bedrockH = 2;

    // Y-позиции (верх каждого слоя)
    const topsoilTop = 0;
    const subsoilTop = -topsoilH;
    const clayTop = subsoilTop - subsoilH;
    const rockTop = clayTop - clayH;
    const aquiferTop = -waterDepth;
    const bedrockTop = aquiferTop - aquiferH;

    const layers = [
        { name: 'topsoil', leftRef: topsoilLeftRef, rightRef: topsoilRightRef, y: topsoilTop - topsoilH / 2, h: topsoilH, color: '#5D4037' },
        { name: 'subsoil', leftRef: null, rightRef: null, y: subsoilTop - subsoilH / 2, h: subsoilH, color: '#8D6E63' },
        { name: 'clay', leftRef: null, rightRef: null, y: clayTop - clayH / 2, h: clayH, color: '#A1887F' },
        { name: 'rock', leftRef: null, rightRef: null, y: rockTop - rockH / 2, h: rockH, color: '#757575' },
        { name: 'aquifer', leftRef: null, rightRef: null, y: aquiferTop - aquiferH / 2, h: aquiferH, color: '#1E88E5', opacity: 0.7 },
        { name: 'bedrock', leftRef: null, rightRef: null, y: bedrockTop - bedrockH / 2, h: bedrockH, color: '#424242' },
    ];

    // Метки глубины
    const depthLabels = useMemo(() => {
        const labels = [0];
        const step = waterDepth <= 8 ? 2 : 5;
        for (let d = step; d < waterDepth; d += step) {
            labels.push(d);
        }
        labels.push(waterDepth);
        return labels;
    }, [waterDepth]);

    const makeMaterial = (layer) => {
        if (layer.opacity) {
            return <meshStandardMaterial color={layer.color} roughness={0.8} transparent opacity={layer.opacity} />;
        }
        return <meshStandardMaterial color={layer.color} roughness={0.9} />;
    };

    return (
        <group>
            {/* ═══ СЛОИ ПОЧВЫ (по две половинки с ямой посередине) ═══ */}
            {layers.map((layer) => (
                <group key={layer.name}>
                    {/* Левая половина */}
                    <mesh ref={layer.leftRef} position={[LEFT_X, layer.y, 0]}>
                        <boxGeometry args={[HALF_WIDTH, layer.h, LAYER_DEPTH]} />
                        {makeMaterial(layer)}
                    </mesh>
                    {/* Правая половина */}
                    <mesh ref={layer.rightRef} position={[RIGHT_X, layer.y, 0]}>
                        <boxGeometry args={[HALF_WIDTH, layer.h, LAYER_DEPTH]} />
                        {makeMaterial(layer)}
                    </mesh>
                    {/* Задняя стенка ямы — тонкая полоска за трубой для красоты */}
                    <mesh position={[0, layer.y, -(LAYER_DEPTH / 2) + 0.05]}>
                        <boxGeometry args={[GAP_WIDTH, layer.h, 0.1]} />
                        {layer.opacity ? (
                            <meshStandardMaterial color={layer.color} roughness={0.9} transparent opacity={0.4} />
                        ) : (
                            <meshStandardMaterial color={layer.color} roughness={0.95} />
                        )}
                    </mesh>
                </group>
            ))}

            {/* ═══ Линия поверхности ═══ */}
            <mesh position={[0, 0.01, LAYER_DEPTH / 2 + 0.01]}>
                <boxGeometry args={[LAYER_WIDTH, 0.04, 0.01]} />
                <meshBasicMaterial color="#33691E" />
            </mesh>

            {/* ═══ МЕТКИ ГЛУБИНЫ ═══ */}
            <group position={[-(LAYER_WIDTH / 2) - 0.5, 0, LAYER_DEPTH / 2]}>
                {depthLabels.map((d) => (
                    <group key={d}>
                        <Text
                            position={[0, -d, 0]}
                            fontSize={0.4}
                            color="white"
                            anchorX="right"
                            outlineWidth={0.02}
                            outlineColor="black"
                        >
                            {d} м
                        </Text>
                        <mesh position={[0.8, -d, -0.01]}>
                            <boxGeometry args={[1, 0.02, 0.01]} />
                            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* ═══ Подпись «Водоносный слой» ═══ */}
            <Text
                position={[LAYER_WIDTH / 2 - 2, -waterDepth - 1, LAYER_DEPTH / 2 + 0.1]}
                fontSize={0.5}
                color="#90CAF9"
                anchorX="right"
                outlineWidth={0.02}
                outlineColor="#0D47A1"
            >
                💧 Водоносный слой
            </Text>
        </group>
    );
}
