import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useXRInputSourceState } from '@react-three/xr';

const PARTS = [
    { id: 'chassis', name: 'Шасси', color: '#888', icon: '🚗' },
    { id: 'wheel', name: 'Колесо', color: '#222', icon: '⚪' },
    { id: 'engine', name: 'Двигатель', color: '#ff006e', icon: '⚙️' },
    { id: 'carBattery', name: 'Аккумулятор', color: '#00f2ff', icon: '🔋' },
    { id: 'body', name: 'Кузов', color: '#9d4edd', icon: '🚙' },
];

function VRPartCard({ part, position, count, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <group position={position} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onClick={onClick}>
            <mesh>
                <planeGeometry args={[0.8, 0.4]} />
                <meshStandardMaterial color={hovered ? '#4cc9f0' : '#1a2a4e'} />
            </mesh>
            <Text position={[-0.2, 0, 0.01]} fontSize={0.15} color="#fff">
                {part.icon}
            </Text>
            <Text position={[0.1, 0, 0.01]} fontSize={0.08} color="#fff" anchorX="left">
                {part.name} ({count})
            </Text>
        </group>
    );
}

export default function VRPartsMenu({ onPartAdd, partCounts }) {
    const groupRef = useRef();
    const camera = useThree(s => s.camera);
    const leftController = useXRInputSourceState('controller', 'left');
    
    // Start with menu open so the user knows it exists
    const [isOpen, setIsOpen] = useState(true);
    const prevButton = useRef(false);

    // Reusable vectors to avoid allocations every frame
    const _targetPos = useRef(new THREE.Vector3());
    const _lookTarget = useRef(new THREE.Vector3());

    useFrame(() => {
        // --- Button toggle logic ---
        const gamepad = leftController?.inputSource?.gamepad;

        let isPressed = false;
        if (gamepad?.buttons) {
            // buttons[4] = X, buttons[5] = Y on Meta Quest left controller (xr-standard)
            isPressed = gamepad.buttons[4]?.pressed || gamepad.buttons[5]?.pressed;

            // 🔍 Temporary debug — remove after verifying on real hardware
            gamepad.buttons.forEach((btn, i) => {
                if (btn.pressed) console.log(`[VRPartsMenu] Button ${i} pressed`);
            });
        }

        if (isPressed && !prevButton.current) {
            setIsOpen(prev => !prev);
        }
        prevButton.current = isPressed;

        // --- Continuously follow the camera while the menu is open ---
        if (isOpen && groupRef.current) {
            // Calculate a target position 1.5m in front of the camera
            const forward = _targetPos.current.set(0, 0, -1.5);
            forward.applyQuaternion(camera.quaternion);
            // Lock to roughly eye-level so the menu doesn't tilt up/down wildly
            forward.y = 0;
            forward.add(camera.position);

            // Smooth lerp so the menu glides instead of snapping rigidly
            groupRef.current.position.lerp(forward, 0.05);

            // Always face the camera (billboard style, yaw only)
            _lookTarget.current.set(
                camera.position.x,
                groupRef.current.position.y,
                camera.position.z
            );
            groupRef.current.lookAt(_lookTarget.current);
        }
    });

    if (!isOpen) return null;

    return (
        <group ref={groupRef} position={[0, 1.5, -2]}>
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[1.2, 3]} />
                <meshStandardMaterial color="#0a0e27" transparent opacity={0.85} />
            </mesh>
            <Text position={[0, 1.2, 0]} fontSize={0.10} color="#00f2ff">
                ДЕТАЛИ (Нажми X/Y скрыть)
            </Text>
            {PARTS.map((part, i) => (
                <VRPartCard
                    key={part.id}
                    part={part}
                    position={[0, 0.8 - i * 0.45, 0]}
                    count={partCounts[part.id] || 0}
                    onClick={() => {
                        onPartAdd(part.id);
                        setIsOpen(false);
                    }}
                />
            ))}
        </group>
    );
}
