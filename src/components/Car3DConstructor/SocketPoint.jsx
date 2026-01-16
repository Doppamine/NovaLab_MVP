import React, { useState } from 'react';
import * as THREE from 'three';

/**
 * SocketPoint - точка подключения в 3D
 * Визуализация слотов с обратной связью
 */
function SocketPoint({ position, type, connected = false, highlight = false }) {
    const [hovered, setHovered] = useState(false);

    // Цвет в зависимости от состояния
    const getColor = () => {
        if (connected) return '#00ff9f'; // Зеленый - подключено
        if (highlight) return '#ffff00'; // Желтый - совместимый слот подсвечен
        if (hovered) return '#00f2ff';   // Cyan - при наведении
        return '#666';                    // Серый - пусто
    };

    const intensity = connected || highlight ? 0.8 : hovered ? 0.5 : 0.2;

    return (
        <mesh
            position={position}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
                color={getColor()}
                emissive={getColor()}
                emissiveIntensity={intensity}
                metalness={0.5}
                roughness={0.2}
            />

            {/* Внешнее свечение */}
            {(hovered || connected || highlight) && (
                <pointLight
                    position={[0, 0, 0]}
                    color={getColor()}
                    intensity={intensity}
                    distance={2}
                />
            )}
        </mesh>
    );
}

export default SocketPoint;
