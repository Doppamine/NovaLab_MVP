import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RocketPartModels from './RocketPart3DModel';
import {
    findCompatibleRocketSocket,
    calculateSnapPosition,
    ROCKET_SNAP_RADIUS
} from './rocketConnectionRules';

/**
 * DraggableRocketPart - перетаскивание деталей ракеты
 * Управление как в Car3DConstructor:
 * - ЛКМ: drag по XZ плоскости
 * - Стрелка сверху или Shift+drag: перемещение по Y
 * - Клик: выбор детали
 */
function DraggableRocketPart({
    part,
    placedParts,
    connections,
    isSelected = false,
    onSelect,
    onPositionChange,
    onDrop
}) {
    const groupRef = useRef();
    const [isDragging, setIsDragging] = useState(false);
    const [isVerticalDrag, setIsVerticalDrag] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [gizmoHovered, setGizmoHovered] = useState(false);
    const [snapTarget, setSnapTarget] = useState(null);
    const [clickHandled, setClickHandled] = useState(false);
    const { camera, gl } = useThree();

    const mouseRef = useRef(new THREE.Vector2());
    const dragOffsetRef = useRef(new THREE.Vector3());
    const raycasterRef = useRef(new THREE.Raycaster());
    const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const verticalPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));

    // Получаем компонент модели
    const PartModel = RocketPartModels[part.type];

    // Обработка движения мыши
    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!isDragging) return;
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('pointermove', handleMouseMove);
        return () => window.removeEventListener('pointermove', handleMouseMove);
    }, [isDragging]);

    // Обновление позиции при перетаскивании
    useFrame(() => {
        if (!isDragging || !groupRef.current) return;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        if (isVerticalDrag) {
            // Вертикальное перемещение
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            let planeNormal = new THREE.Vector3(cameraDir.x, 0, cameraDir.z);
            if (planeNormal.lengthSq() < 0.001) {
                planeNormal.set(1, 0, 0);
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

                // ВАЖНО: Проверяем snap и при вертикальном перемещении!
                const currentPos = [
                    groupRef.current.position.x,
                    groupRef.current.position.y,
                    groupRef.current.position.z
                ];
                const socket = findCompatibleRocketSocket(part.type, placedParts, currentPos);
                setSnapTarget(socket);

                if (onPositionChange) {
                    onPositionChange(part.id, currentPos);
                }
            }
        } else {
            // Горизонтальное перемещение (XZ)
            dragPlaneRef.current.constant = -groupRef.current.position.y;
            const intersection = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersection);

            if (intersection) {
                intersection.sub(dragOffsetRef.current);
                groupRef.current.position.lerp(intersection, 0.3);

                // Проверяем snap к сокетам
                const currentPos = [
                    groupRef.current.position.x,
                    groupRef.current.position.y,
                    groupRef.current.position.z
                ];
                const socket = findCompatibleRocketSocket(part.type, placedParts, currentPos);
                setSnapTarget(socket);

                if (onPositionChange) {
                    onPositionChange(part.id, currentPos);
                }
            }
        }
    });

    // Начало перетаскивания
    const handlePointerDown = (event, isVertical = false) => {
        event.stopPropagation();
        setClickHandled(false);
        setIsDragging(true);

        const verticalMode = isVertical || event.shiftKey;
        setIsVerticalDrag(verticalMode);

        gl.domElement.style.cursor = verticalMode ? 'ns-resize' : 'grabbing';

        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        if (verticalMode) {
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            let planeNormal = new THREE.Vector3(cameraDir.x, 0, cameraDir.z);
            if (planeNormal.lengthSq() < 0.001) {
                planeNormal.set(1, 0, 0);
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

    // Окончание перетаскивания
    const handlePointerUp = () => {
        if (isDragging) {
            const wasDragged = clickHandled;
            setIsDragging(false);
            setIsVerticalDrag(false);
            gl.domElement.style.cursor = hovered ? 'grab' : 'default';

            if (onDrop && groupRef.current) {
                const finalPos = [
                    groupRef.current.position.x,
                    groupRef.current.position.y,
                    groupRef.current.position.z
                ];
                onDrop(part.id, finalPos, snapTarget);
            }

            // Выбор при клике (не drag)
            if (!wasDragged && onSelect) {
                onSelect(part.id);
            }

            setSnapTarget(null);
        }
    };

    // Глобальный pointerup
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDragging) {
                handlePointerUp();
            }
        };

        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, [isDragging]);

    // Отслеживание реального drag (не клик)
    useEffect(() => {
        if (isDragging) {
            const timer = setTimeout(() => setClickHandled(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isDragging]);

    if (!PartModel) {
        console.warn(`No model found for part type: ${part.type}`);
        return null;
    }

    return (
        <group
            ref={groupRef}
            position={part.position}
            onPointerDown={(e) => handlePointerDown(e, false)}
            onPointerEnter={() => {
                if (!isDragging) {
                    setHovered(true);
                    gl.domElement.style.cursor = 'grab';
                }
            }}
            onPointerLeave={() => {
                setHovered(false);
                setGizmoHovered(false);
                if (!isDragging) gl.domElement.style.cursor = 'default';
            }}
        >
            {/* Модель детали */}
            <PartModel />

            {/* Контур выделения */}
            {isSelected && (
                <mesh scale={1.15}>
                    <boxGeometry args={[2, 3, 2]} />
                    <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
                </mesh>
            )}

            {/* Вертикальная стрелка (gizmo) */}
            {(isSelected || hovered || isVerticalDrag) && (
                <group position={[0, 3, 0]}>
                    {/* Наконечник стрелки */}
                    <mesh
                        onPointerDown={(e) => handlePointerDown(e, true)}
                        onPointerEnter={(e) => {
                            e.stopPropagation();
                            setGizmoHovered(true);
                            gl.domElement.style.cursor = 'ns-resize';
                        }}
                        onPointerLeave={() => {
                            setGizmoHovered(false);
                            if (!isDragging) gl.domElement.style.cursor = 'grab';
                        }}
                    >
                        <coneGeometry args={[0.3, 0.6, 16]} />
                        <meshBasicMaterial
                            color={gizmoHovered || isVerticalDrag ? "#ffff00" : "#00ff00"}
                            depthTest={false}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                    {/* Ось стрелки */}
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

            {/* Индикатор snap */}
            {isDragging && snapTarget && (
                <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1, 1.3, 16]} />
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.8} side={2} />
                </mesh>
            )}

            {/* Подсветка при hover */}
            {hovered && !isSelected && (
                <mesh scale={1.1}>
                    <sphereGeometry args={[2.5, 16, 16]} />
                    <meshBasicMaterial
                        color="#00f2ff"
                        transparent
                        opacity={0.1}
                    />
                </mesh>
            )}
        </group>
    );
}

export default DraggableRocketPart;
