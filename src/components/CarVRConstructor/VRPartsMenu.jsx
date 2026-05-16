import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useXRInputSourceState } from '@react-three/xr';
import { useLocale } from '../../i18n/LocalizationContext';

const PARTS = [
    { id: 'chassis', name: 'Шасси', color: '#888', icon: '🚗' },
    { id: 'wheel', name: 'Колесо', color: '#222', icon: '⚪' },
    { id: 'engine', name: 'Двигатель', color: '#ff006e', icon: '⚙️' },
    { id: 'carBattery', name: 'Аккумулятор', color: '#00f2ff', icon: '🔋' },
    { id: 'body', name: 'Кузов', color: '#9d4edd', icon: '🚙' },
];

function VRPartCard({ part, position, count, onClick }) {
    const { t } = useLocale();
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
                {t(part.name)} ({count})
            </Text>
        </group>
    );
}

export default function VRPartsMenu({ onPartAdd, partCounts }) {
    const { t } = useLocale();
    const groupRef = useRef();
    const camera = useThree(s => s.camera);
    const leftController = useXRInputSourceState('controller', 'left');
    
    // Start with menu open so the user knows it exists
    const [isOpen, setIsOpen] = useState(true);
    const prevButton = useRef(false);

    // Reusable objects to avoid per-frame garbage collection
    const _targetPos = useRef(new THREE.Vector3());
    const _lookTarget = useRef(new THREE.Vector3());
    const _camWorldPos = useRef(new THREE.Vector3());
    const _camWorldQuat = useRef(new THREE.Quaternion());

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
        // Use WORLD transforms — in VR, the camera is a child of XROrigin,
        // so camera.position / camera.quaternion are local to the origin.
        // World transforms give us the actual headset position and facing.
        if (isOpen && groupRef.current) {
            camera.getWorldPosition(_camWorldPos.current);
            camera.getWorldQuaternion(_camWorldQuat.current);

            // Calculate target: 1.5m in front of where the user is looking
            const forward = _targetPos.current.set(0, 0, -1.5);
            forward.applyQuaternion(_camWorldQuat.current);
            // Lock Y so the menu stays at eye-level, not tilted up/down
            forward.y = 0;
            forward.add(_camWorldPos.current);

            // Lerp at 0.15 for responsive but smooth tracking
            groupRef.current.position.lerp(forward, 0.15);

            // Billboard: always face the user (yaw only, stays upright)
            _lookTarget.current.set(
                _camWorldPos.current.x,
                groupRef.current.position.y,
                _camWorldPos.current.z
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
                {t('ДЕТАЛИ (Нажми X/Y скрыть)')}
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
