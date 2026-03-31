import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Вспомогательные материалы
const materials = {
    pipe: <meshPhysicalMaterial transmission={0.85} opacity={1} roughness={0.1} thickness={0.5} transparent color="#e0e0e0" />,
    water: <meshPhysicalMaterial transmission={0.6} opacity={0.8} roughness={0.2} transparent color="#2196f3" />,
    piston: <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.4} />,
    rod: <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.3} />,
    valveOpen: <meshStandardMaterial color="#4caf50" />,
    valveClosed: <meshStandardMaterial color="#f44336" />,
    handle: <meshStandardMaterial color="#ff9800" />,
    seal: <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
};

// 1:1 масштаб: 1 unit = 1 метр
const ABOVE_GROUND = 1.5; // Труба торчит на 1.5м над землей
const HANDLE_HEIGHT = 1.8; // Ручка на высоте 1.8м от поверхности

export default function PumpScene({ assembledParts, isSimulating, params }) {
    const waterRef = useRef();
    const pistonRef = useRef();
    const rodRef = useRef();

    // Динамические размеры
    const pipeHeight = params.pumpDepth + ABOVE_GROUND;
    const pipeBottom = -params.pumpDepth;
    const pipeTop = ABOVE_GROUND;
    const pipeCenterY = (pipeBottom + pipeTop) / 2;

    const radius = params.pistonDiameter / 200 + 0.15;

    // Позиции: поршень внизу, ручка наверху
    const sealY = pipeBottom;
    const valveBottomY = pipeBottom + 0.15;
    const pistonRestY = pipeBottom + 0.5;         // Поршень — внизу трубы, чуть выше дна
    const stroke = params.strokeLength * 2;        // Ход поршня

    // Анимация насоса
    useFrame(({ clock }) => {
        if (!pistonRef.current || !rodRef.current) return;

        if (isSimulating) {
            const time = clock.getElapsedTime();
            const cyclePos = (Math.sin(time * params.cycleSpeed * Math.PI * 2) + 1) / 2;

            // Поршень двигается внизу
            const pistonY = pistonRestY + cyclePos * stroke;
            pistonRef.current.position.y = pistonY;

            // Шток: от поршня до ручки. Центр = середина между ними.
            const rodTop = HANDLE_HEIGHT - 0.3;   // Чуть ниже ручки
            const rodLength = rodTop - pistonY;
            const rodCenterY = (pistonY + rodTop) / 2;
            rodRef.current.position.y = rodCenterY;
            rodRef.current.scale.y = rodLength;    // scale.y = 1 при длине 1

            // Анимация воды
            if (waterRef.current) {
                const waterLevel = 0.5 + cyclePos * (pipeHeight * 0.35);
                waterRef.current.scale.y = waterLevel;
                waterRef.current.position.y = pipeBottom + waterLevel / 2;
            }
        } else {
            pistonRef.current.position.y = pistonRestY;

            // Шток в покое
            const rodTop = HANDLE_HEIGHT - 0.3;
            const rodLength = rodTop - pistonRestY;
            const rodCenterY = (pistonRestY + rodTop) / 2;
            rodRef.current.position.y = rodCenterY;
            rodRef.current.scale.y = rodLength;

            if (waterRef.current) {
                waterRef.current.scale.y = 0.1;
                waterRef.current.position.y = pipeBottom + 0.05;
            }
        }
    });

    return (
        <group>
            {/* 1. Труба — от дна до поверхности */}
            {assembledParts.includes('pipe') && (
                <mesh position={[0, pipeCenterY, 0]}>
                    <cylinderGeometry args={[radius + 0.08, radius + 0.08, pipeHeight, 32]} />
                    {materials.pipe}
                </mesh>
            )}

            {/* 2. Вода внутри трубы */}
            {assembledParts.includes('pipe') && isSimulating && (
                <mesh ref={waterRef} position={[0, pipeBottom, 0]}>
                    <cylinderGeometry args={[radius, radius, 1, 32]} />
                    {materials.water}
                </mesh>
            )}

            {/* 3. Клапан дна — неподвижный, внизу трубы */}
            {assembledParts.includes('valveBottom') && (
                <mesh position={[0, valveBottomY, 0]}>
                    <cylinderGeometry args={[radius, radius, 0.15, 32]} />
                    {materials.valveClosed}
                </mesh>
            )}

            {/* 4. Поршень — движется внизу трубы */}
            {assembledParts.includes('piston') && (
                <group ref={pistonRef} position={[0, pistonRestY, 0]}>
                    {/* Диск поршня */}
                    <mesh>
                        <cylinderGeometry args={[radius, radius, 0.2, 32]} />
                        {materials.piston}
                    </mesh>
                    {/* Клапан на поршне */}
                    {assembledParts.includes('valvePiston') && (
                        <mesh position={[0, 0.15, 0]}>
                            <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.08, 32]} />
                            {materials.valveOpen}
                        </mesh>
                    )}
                </group>
            )}

            {/* 5. Шток (connecting rod) — от поршня до ручки */}
            {assembledParts.includes('piston') && assembledParts.includes('handle') && (
                <mesh ref={rodRef} position={[0, 0, 0]}>
                    {/* Базовая геометрия 1м высотой, scale.y управляет длиной */}
                    <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
                    {materials.rod}
                </mesh>
            )}

            {/* 6. Ручка — ВСЕГДА на поверхности */}
            {assembledParts.includes('handle') && (
                <group position={[0, HANDLE_HEIGHT, 0]}>
                    {/* Основание ручки (крепление к верху трубы) */}
                    <mesh position={[0, -0.3, 0]}>
                        <cylinderGeometry args={[0.12, 0.15, 0.3, 16]} />
                        {materials.piston}
                    </mesh>
                    {/* Вертикальная часть рычага */}
                    <mesh position={[0, 0.3, 0]}>
                        <cylinderGeometry args={[0.06, 0.06, 0.6, 16]} />
                        {materials.handle}
                    </mesh>
                    {/* Горизонтальная перекладина — за которую качают */}
                    <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.1, 0.1, 1.4, 16]} />
                        {materials.handle}
                    </mesh>
                </group>
            )}

            {/* 7. Герметик — кольцо на дне */}
            {assembledParts.includes('seal') && (
                <mesh position={[0, sealY, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[radius + 0.1, 0.06, 16, 32]} />
                    {materials.seal}
                </mesh>
            )}
        </group>
    );
}
