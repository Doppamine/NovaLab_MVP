import React, { useRef, useEffect, useCallback } from 'react';
import { Text } from '@react-three/drei';
import {
    ChassisModel,
    WheelModel,
    EngineModel,
    BatteryModel,
    BodyModel,
    ControllerModel
} from '../../components/Car3DConstructor/Part3DModel';

/**
 * VRDraggablePart — pure visual component for a single part on the VR field.
 *
 * All grab/move/drop logic is handled externally by VRGrabController.
 * This component only:
 *   1. Renders the 3D model
 *   2. Shows hover/selection highlights
 *   3. Shows a delete button when the part (or its group) is selected
 *   4. Exposes a ref so the grab controller can read/write world position
 */
export default function VRDraggablePart({
    part,
    highlightedSockets,
    isSelected,
    onDelete,
    onRefReady  // Callback: (refNode) => void — registers the THREE.Group with the parent
}) {
    const groupRef = useRef();

    // Merge: store ref locally AND notify parent via callback
    const setRef = useCallback((node) => {
        groupRef.current = node;
        if (onRefReady) onRefReady(node);
    }, [onRefReady]);

    // Sync mesh position with state whenever state changes and the part is NOT
    // currently being held (held parts are positioned by VRGrabController).
    useEffect(() => {
        if (groupRef.current && !isSelected) {
            groupRef.current.position.set(
                part.position[0],
                part.position[1],
                part.position[2]
            );
        }
    }, [part.position, isSelected]);

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

    return (
        <group
            ref={setRef}
            position={part.position}
        >
            {getModelComponent()}

            {/* Selection outline — shown when this part (or its group) is grabbed */}
            {isSelected && (
                <mesh scale={1.1}>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
                </mesh>
            )}

            {/* Delete Button — floats next to the part when selected */}
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
