import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXRInputSourceState } from '@react-three/xr';
import { Text } from '@react-three/drei';
import {
    ChassisModel,
    WheelModel,
    EngineModel,
    BatteryModel,
    BodyModel,
    ControllerModel
} from '../../components/Car3DConstructor/Part3DModel';

export default function VRDraggablePart({
    part,
    highlightedSockets,
    isSelected,
    onSelect,
    onDrop,
    onDelete,
    onPositionChange
}) {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);
    
    const leftController = useXRInputSourceState('controller', 'left');
    const rightController = useXRInputSourceState('controller', 'right');
    
    const SPEED = 2; // m/s
    const ROTATION_SPEED = 2; // rad/s

    // Sync position with state when not selected
    useEffect(() => {
        if (groupRef.current && !isSelected) {
            groupRef.current.position.set(
                part.position[0],
                part.position[1],
                part.position[2]
            );
        }
    }, [part.position, isSelected]);

    const getThumbstick = (gamepad) => {
        if (!gamepad || !gamepad.axes) return { x: 0, y: 0 };
        if (gamepad.axes.length >= 4) return { x: gamepad.axes[2], y: gamepad.axes[3] };
        if (gamepad.axes.length >= 2) return { x: gamepad.axes[0], y: gamepad.axes[1] };
        return { x: 0, y: 0 };
    };

    useFrame((_, delta) => {
        if (!isSelected || !groupRef.current) return;

        let moved = false;

        // Access the raw XRInputSource's gamepad via .inputSource.gamepad
        // Left thumbstick: X/Y axes
        const leftTS = getThumbstick(leftController?.inputSource?.gamepad);
        if (Math.abs(leftTS.x) > 0.1) {
            groupRef.current.position.x += leftTS.x * SPEED * delta;
            moved = true;
        }
        if (Math.abs(leftTS.y) > 0.1) {
            // yAxis is -1 forward (up), 1 backward (down)
            groupRef.current.position.y -= leftTS.y * SPEED * delta;
            moved = true;
        }

        // Right thumbstick: Z axis (depth) and Rotation (X axis of TS)
        const rightTS = getThumbstick(rightController?.inputSource?.gamepad);
        if (Math.abs(rightTS.y) > 0.1) {
            groupRef.current.position.z += rightTS.y * SPEED * delta;
            moved = true;
        }
        if (Math.abs(rightTS.x) > 0.1) {
            groupRef.current.rotation.y -= rightTS.x * ROTATION_SPEED * delta;
        }

        if (moved && onPositionChange) {
            onPositionChange({
                x: groupRef.current.position.x,
                y: groupRef.current.position.y,
                z: groupRef.current.position.z
            });
        }
    });

    const getModelComponent = () => {
        const models = {
            chassis: ChassisModel,
            wheel: WheelModel,
            engine: EngineModel,
            carBattery: BatteryModel,
            body: BodyModel,
            controller: ControllerModel
        };
        const ModelComponent = models[part.type];
        return ModelComponent ? (
            <ModelComponent
                connectedParts={part.connectedTo}
                highlightedSockets={highlightedSockets}
            />
        ) : null;
    };

    const handlePointerDown = (e) => {
        e.stopPropagation();
        if (isSelected) {
            // Deselect and drop
            if (onDrop && groupRef.current) {
                onDrop({
                    x: groupRef.current.position.x,
                    y: groupRef.current.position.y,
                    z: groupRef.current.position.z
                });
            }
        } else {
            if (onSelect) onSelect();
        }
    };

    return (
        <group
            ref={groupRef}
            position={part.position}
            onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); }}
            onPointerDown={handlePointerDown}
        >
            {getModelComponent()}

            {/* Hover highlight */}
            {hovered && !isSelected && (
                <mesh scale={1.05}>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial color="#4cc9f0" wireframe transparent opacity={0.5} />
                </mesh>
            )}

            {/* Selection outline */}
            {isSelected && (
                <mesh scale={1.1}>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
                </mesh>
            )}

            {/* Delete Button - floats next to the part when selected */}
            {isSelected && (
                <group position={[1.5, 0, 0]} onPointerDown={(e) => { e.stopPropagation(); onDelete(part.id); }}>
                    <mesh>
                        <planeGeometry args={[1.5, 0.5]} />
                        <meshBasicMaterial color="#ff006e" />
                    </mesh>
                    <Text position={[0, 0, 0.01]} fontSize={0.2} color="#fff">
                        🗑️ УДАЛИТЬ
                    </Text>
                </group>
            )}
        </group>
    );
}
