import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    ChassisModel,
    WheelModel,
    EngineModel,
    BatteryModel,
    BodyModel,
    ControllerModel
} from './Part3DModel';

function DraggablePart3D({
    partType,
    initialPosition = [0, 2, 0],
    connectedParts = [],
    highlightedSockets = [],
    isSelected = false,
    onSelect,
    onPositionChange,
    onDrop,
    customModel = null // Для использования с ракетными моделями
}) {
    const groupRef = useRef();
    const [isDragging, setIsDragging] = useState(false);
    const [isVerticalDrag, setIsVerticalDrag] = useState(false);
    const [isRotating, setIsRotating] = useState(false); // NEW: rotation mode
    const rotatingThisRef = useRef(false); // Track if rotation started on THIS component
    const [hovered, setHovered] = useState(false);
    const [gizmoHovered, setGizmoHovered] = useState(false);
    const { camera, gl } = useThree();
    const [clickHandled, setClickHandled] = useState(false);

    const mouseRef = useRef(new THREE.Vector2());
    const prevMouseXRef = useRef(0); // NEW: for rotation tracking
    const dragOffsetRef = useRef(new THREE.Vector3());
    const raycasterRef = useRef(new THREE.Raycaster());
    const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const verticalPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));

    const getModelComponent = () => {
        // Если передана кастомная модель - используем её
        if (customModel) {
            const CustomModel = customModel;
            return (
                <CustomModel
                    connectedParts={connectedParts}
                    highlightedSockets={highlightedSockets}
                />
            );
        }

        // Иначе используем стандартные модели машины
        const models = {
            chassis: ChassisModel,
            wheel: WheelModel,
            engine: EngineModel,
            carBattery: BatteryModel,
            body: BodyModel,
            controller: ControllerModel
        };
        const ModelComponent = models[partType];
        return ModelComponent ? (
            <ModelComponent
                connectedParts={connectedParts}
                highlightedSockets={highlightedSockets}
            />
        ) : null;
    };

    // Track previous position for delta calculation
    const prevPositionRef = useRef(initialPosition);

    // Sync position with initialPosition - ALWAYS follow state
    // This ensures connected parts stay in sync when group moves
    useEffect(() => {
        if (groupRef.current) {
            // When this part is not being dragged but is in a group being moved,
            // the position should immediately snap to the new state
            if (!isDragging) {
                groupRef.current.position.set(
                    initialPosition[0],
                    initialPosition[1],
                    initialPosition[2]
                );
            }
            prevPositionRef.current = initialPosition;
        }
    }, [initialPosition, isDragging]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            // NEW: Handle rotation mode - only if rotation started on THIS component
            if (isRotating && rotatingThisRef.current && groupRef.current) {
                const deltaX = event.clientX - prevMouseXRef.current;
                groupRef.current.rotation.y += deltaX * 0.01; // Rotate around Y axis
                prevMouseXRef.current = event.clientX;
                return;
            }

            if (!isDragging) return;
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        // Global pointerup to stop rotation when mouse released anywhere
        const handleMouseUp = () => {
            if (isRotating && rotatingThisRef.current) {
                setIsRotating(false);
                rotatingThisRef.current = false;
                gl.domElement.style.cursor = 'default';
            }
        };

        window.addEventListener('pointermove', handleMouseMove);
        window.addEventListener('pointerup', handleMouseUp);
        return () => {
            window.removeEventListener('pointermove', handleMouseMove);
            window.removeEventListener('pointerup', handleMouseUp);
        };
    }, [isDragging, isRotating, gl.domElement.style]);

    useFrame(() => {
        if (!isDragging || !groupRef.current) return;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        if (isVerticalDrag) {
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            // Ensure we have a valid normal even if looking straight down
            let planeNormal = new THREE.Vector3(cameraDir.x, 0, cameraDir.z);
            if (planeNormal.lengthSq() < 0.001) {
                planeNormal.set(1, 0, 0); // Default to X-axis plane if looking straight down
            } else {
                planeNormal.normalize();
            }

            verticalPlaneRef.current.setFromNormalAndCoplanarPoint(
                planeNormal,
                groupRef.current.position
            );

            const intersection = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(verticalPlaneRef.current, intersection);

            if (intersection) {
                const newY = intersection.y - dragOffsetRef.current.y;
                groupRef.current.position.y = Math.max(0.5, newY);

                if (onPositionChange) {
                    onPositionChange({
                        x: groupRef.current.position.x,
                        y: groupRef.current.position.y,
                        z: groupRef.current.position.z
                    });
                }
            }
        } else {
            dragPlaneRef.current.constant = -groupRef.current.position.y;
            const intersection = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersection);

            if (intersection) {
                intersection.sub(dragOffsetRef.current);
                groupRef.current.position.lerp(intersection, 0.3);

                if (onPositionChange) {
                    onPositionChange({
                        x: groupRef.current.position.x,
                        y: groupRef.current.position.y,
                        z: groupRef.current.position.z
                    });
                }
            }
        }
    });

    const handlePointerDown = (event, isVertical = false) => {
        event.stopPropagation();
        setClickHandled(false);

        // NEW: Ctrl+LMB = rotation mode
        if (event.ctrlKey) {
            setIsRotating(true);
            rotatingThisRef.current = true; // Mark that rotation started on THIS component
            setIsDragging(false);
            prevMouseXRef.current = event.clientX;
            gl.domElement.style.cursor = 'ew-resize';
            return;
        }

        setIsDragging(true);
        setIsRotating(false);

        // Allow vertical drag if gizmo clicked OR Shift key is held
        const verticalMode = isVertical || event.shiftKey;
        setIsVerticalDrag(verticalMode);

        gl.domElement.style.cursor = verticalMode ? 'ns-resize' : 'grabbing';

        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        if (verticalMode) {
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            // Ensure we have a valid normal even if looking straight down
            let planeNormal = new THREE.Vector3(cameraDir.x, 0, cameraDir.z);
            if (planeNormal.lengthSq() < 0.001) {
                planeNormal.set(1, 0, 0); // Default to X-axis plane if looking straight down
            } else {
                planeNormal.normalize();
            }

            verticalPlaneRef.current.setFromNormalAndCoplanarPoint(
                planeNormal,
                groupRef.current.position
            );

            const intersection = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(verticalPlaneRef.current, intersection);

            if (intersection && groupRef.current) {
                dragOffsetRef.current.y = intersection.y - groupRef.current.position.y;
            }
        } else {
            dragPlaneRef.current.constant = -groupRef.current.position.y;

            const intersection = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersection);

            if (intersection && groupRef.current) {
                dragOffsetRef.current.copy(intersection).sub(groupRef.current.position);
            }
        }
    };

    const handlePointerUp = () => {
        // NEW: Handle rotation end
        if (isRotating) {
            setIsRotating(false);
            rotatingThisRef.current = false; // Reset rotation flag
            gl.domElement.style.cursor = hovered ? 'grab' : 'default';
            return;
        }

        if (isDragging) {
            const wasDragged = clickHandled;
            setIsDragging(false);
            setIsVerticalDrag(false);
            gl.domElement.style.cursor = hovered ? 'grab' : 'default';

            if (onDrop && groupRef.current) {
                onDrop({
                    x: groupRef.current.position.x,
                    y: groupRef.current.position.y,
                    z: groupRef.current.position.z
                });
            }

            // Call onSelect on click (not drag)
            if (!wasDragged && onSelect) {
                onSelect();
            }
        }
    };

    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDragging) {
                handlePointerUp();
            }
        };

        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, [isDragging]);

    // Track if we actually dragged
    useEffect(() => {
        if (isDragging) {
            const timer = setTimeout(() => setClickHandled(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isDragging]);

    return (
        <group
            ref={groupRef}
            position={initialPosition}
            onPointerDown={(e) => handlePointerDown(e, false)}
            onPointerEnter={() => !isDragging && setHovered(true)}
            onPointerLeave={() => {
                setHovered(false);
                setGizmoHovered(false);
            }}
        >
            {getModelComponent()}

            {/* Selection outline */}
            {isSelected && (
                <mesh scale={1.1}>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
                </mesh>
            )}

            {/* Vertical gizmo - Visible when selected, hovered, or dragging vertically */}
            {(isSelected || hovered || isVerticalDrag) && (
                <group position={[0, 2, 0]}>
                    {/* Arrow head */}
                    <mesh
                        onPointerDown={(e) => handlePointerDown(e, true)}
                        onPointerEnter={(e) => {
                            e.stopPropagation();
                            setGizmoHovered(true);
                            gl.domElement.style.cursor = 'ns-resize';
                        }}
                        onPointerLeave={() => {
                            setGizmoHovered(false);
                            gl.domElement.style.cursor = 'default';
                        }}
                    >
                        <coneGeometry args={[0.3, 0.6, 16]} />
                        <meshBasicMaterial
                            color={gizmoHovered || isVerticalDrag ? "#ffff00" : "#00ff00"}
                            depthTest={false}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                    {/* Arrow shaft */}
                    <mesh position={[0, -0.5, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
                        <meshBasicMaterial
                            color={gizmoHovered || isVerticalDrag ? "#ffff00" : "#00ff00"}
                            depthTest={false}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

export default DraggablePart3D;
