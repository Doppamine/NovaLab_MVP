import React, { useState, useRef, useCallback, Suspense } from 'react';
import { useStore } from 'zustand';
import { useFrame, useThree } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';

import { carVRStore } from './carVRStore';
import VRScene from './VRScene';
import VRLocomotion from './VRLocomotion';
import VRPartsMenu from './VRPartsMenu';
import VRDraggablePart from './VRDraggablePart';

import { PART_SOCKETS_DATA } from '../../components/Car3DConstructor/partSocketsData';
import { canConnect, calculateDistance3D, isSocketOccupied } from '../../components/Car3DConstructor/connectionRules3D';
import SoundManager from '../../utils/SoundManager';
import './CarVRConstructor.css';

// ── VR-specific snap radius (larger than desktop for comfort) ───────────
const VR_SNAP_RADIUS = 1.5;

// ── Grab radius: how close a part must be to the hand to be grabbed ─────
const GRAB_RADIUS = 1.5;

// ────────────────────────────────────────────────────────────────────────
//  getConnectedGroup — BFS through connectedTo to find the full assembly
// ────────────────────────────────────────────────────────────────────────
function getConnectedGroup(startPartId, allParts) {
    const visited = new Set();
    const queue = [startPartId];

    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        const part = allParts.find(p => p.id === current);
        if (part) {
            part.connectedTo.forEach(neighborId => {
                if (!visited.has(neighborId)) queue.push(neighborId);
            });
        }
    }

    return visited; // Set of part IDs in the connected group
}

// ────────────────────────────────────────────────────────────────────────
//  VRGrabController — inner component (must be inside <XR> & <Canvas>)
//
//  Reads the right controller trigger each frame.
//  - Trigger pressed → grab nearest part (+ its connected group)
//  - Trigger held    → move entire group to follow the right hand
//  - Trigger released → check snap, connect if in range, else leave floating
// ────────────────────────────────────────────────────────────────────────
function VRGrabController({
    partsOnField,
    setPartsOnField,
    connections,
    setConnections,
    selectedGroupIds,
    setSelectedGroupIds,
    highlightedSockets,
    setHighlightedSockets,
    partRefs,
    checkAndSnapToSocket,
    performSnap
}) {
    const rightController = useXRInputSourceState('controller', 'right');

    // Track trigger state for edge detection (pressed / just-released)
    const prevTrigger = useRef(false);

    // When we grab a group, store each part's offset relative to the controller
    // so the whole assembly moves rigidly.
    const groupOffsets = useRef({}); // { partId: THREE.Vector3 }

    // Reusable objects for per-frame math
    const _controllerWorldPos = useRef(new THREE.Vector3());
    const _tempVec = useRef(new THREE.Vector3());

    useFrame(() => {
        const inputSource = rightController?.inputSource;
        if (!inputSource) return;

        const gamepad = inputSource.gamepad;
        if (!gamepad || !gamepad.buttons || !gamepad.buttons[0]) return;

        const triggerPressed = gamepad.buttons[0].pressed;
        const triggerJustPressed = triggerPressed && !prevTrigger.current;
        const triggerJustReleased = !triggerPressed && prevTrigger.current;
        prevTrigger.current = triggerPressed;

        // ── Get right controller world position ──
        // useXRInputSourceState returns a state object with a .grip property
        // which is a THREE.XRGripSpace (Object3D) representing the physical
        // controller position/orientation in VR space.
        const controllerGrip = rightController?.grip;
        if (!controllerGrip) return;

        controllerGrip.getWorldPosition(_controllerWorldPos.current);
        const handPos = _controllerWorldPos.current;

        // ── TRIGGER JUST PRESSED: find nearest part and grab its group ──
        if (triggerJustPressed) {
            let nearestPart = null;
            let nearestDist = Infinity;

            partsOnField.forEach(part => {
                const ref = partRefs.current[part.id];
                if (!ref) return;

                _tempVec.current.set(
                    part.position[0],
                    part.position[1],
                    part.position[2]
                );

                const dist = handPos.distanceTo(_tempVec.current);
                if (dist < GRAB_RADIUS && dist < nearestDist) {
                    nearestDist = dist;
                    nearestPart = part;
                }
            });

            if (nearestPart) {
                // Get the full connected group
                const group = getConnectedGroup(nearestPart.id, partsOnField);
                setSelectedGroupIds(group);

                // Store each group member's offset from the controller position
                const offsets = {};
                group.forEach(partId => {
                    const part = partsOnField.find(p => p.id === partId);
                    if (part) {
                        offsets[partId] = new THREE.Vector3(
                            part.position[0] - handPos.x,
                            part.position[1] - handPos.y,
                            part.position[2] - handPos.z
                        );
                    }
                });
                groupOffsets.current = offsets;
            }
        }

        // ── TRIGGER HELD: move entire group to follow the hand ──
        if (triggerPressed && selectedGroupIds.size > 0) {
            const updates = [];
            let snapHighlight = null;

            selectedGroupIds.forEach(partId => {
                const offset = groupOffsets.current[partId];
                if (!offset) return;

                const newPos = [
                    handPos.x + offset.x,
                    handPos.y + offset.y,
                    handPos.z + offset.z
                ];

                updates.push({ id: partId, position: newPos });

                // Update the THREE.js mesh position directly for smooth visual
                const ref = partRefs.current[partId];
                if (ref) {
                    ref.position.set(newPos[0], newPos[1], newPos[2]);
                }
            });

            // Check snap highlight for any group member against non-group parts
            selectedGroupIds.forEach(partId => {
                const part = partsOnField.find(p => p.id === partId);
                if (!part) return;

                const updatedPos = updates.find(u => u.id === partId)?.position || part.position;
                const match = checkAndSnapToSocket(
                    { ...part, position: updatedPos },
                    updatedPos,
                    selectedGroupIds
                );

                if (match && (!snapHighlight || match.distance < snapHighlight.distance)) {
                    snapHighlight = match;
                }
            });

            if (snapHighlight) {
                setHighlightedSockets([{
                    partId: snapHighlight.targetPart.id,
                    position: snapHighlight.socketPosition
                }]);
            } else {
                setHighlightedSockets([]);
            }

            // Batch update React state (position tracking for snap calculations)
            setPartsOnField(prev => prev.map(p => {
                const update = updates.find(u => u.id === p.id);
                return update ? { ...p, position: update.position } : p;
            }));
        }

        // ── TRIGGER RELEASED: snap or leave floating ──
        if (triggerJustReleased && selectedGroupIds.size > 0) {
            // Find the best snap match across all group members
            let bestMatch = null;
            let bestPartId = null;

            selectedGroupIds.forEach(partId => {
                const part = partsOnField.find(p => p.id === partId);
                if (!part) return;

                const match = checkAndSnapToSocket(part, part.position, selectedGroupIds);
                if (match && (!bestMatch || match.distance < bestMatch.distance)) {
                    bestMatch = match;
                    bestPartId = partId;
                }
            });

            if (bestMatch && bestPartId) {
                performSnap(bestPartId, bestMatch, selectedGroupIds);
            }
            // If no snap match, parts stay where they are (floating in air)

            setSelectedGroupIds(new Set());
            groupOffsets.current = {};
            setHighlightedSockets([]);
        }
    });

    return null; // This component is logic-only, no visual output
}


// ────────────────────────────────────────────────────────────────────────
//  CarVRConstructor — main orchestrator
// ────────────────────────────────────────────────────────────────────────
export default function CarVRConstructor({ onCarLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [highlightedSockets, setHighlightedSockets] = useState([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());

    // Refs for every part mesh so VRGrabController can read/write positions
    const partRefs = useRef({});

    const session = useStore(carVRStore, state => state.session);

    const partCounts = partsOnField.reduce((acc, part) => {
        acc[part.type] = (acc[part.type] || 0) + 1;
        return acc;
    }, {});

    // Progress calculation
    const connectedPartsCount = partsOnField.filter(p => p.connectedTo.length > 0).length;
    const totalRequired = 8;
    const progressPercent = Math.min(100, Math.round((connectedPartsCount / totalRequired) * 100));

    const handlePartAdd = (partType) => {
        const existingCount = partsOnField.length;
        const offsetX = ((existingCount % 4) - 1.5) * 2.5;
        const offsetZ = Math.floor(existingCount / 4) * 2.5 - 3;

        const newPart = {
            id: `${partType}-${Date.now()}`,
            type: partType,
            position: [offsetX, 2, offsetZ],
            connectedTo: []
        };
        setPartsOnField(prev => [...prev, newPart]);
    };

    const handlePartDelete = (partId) => {
        setPartsOnField(prev => prev.filter(p => p.id !== partId).map(p => ({
            ...p,
            connectedTo: p.connectedTo.filter(id => id !== partId)
        })));

        setConnections(prev => prev.filter(c =>
            c.part1 !== partId && c.part2 !== partId
        ));

        // Clean up the ref
        delete partRefs.current[partId];

        setSelectedGroupIds(prev => {
            const next = new Set(prev);
            next.delete(partId);
            return next;
        });
    };

    /**
     * checkAndSnapToSocket — find the best snap match for a part.
     * @param {Object}  draggedPart     The part being checked
     * @param {Array}   draggedPosition [x, y, z]
     * @param {Set}     excludeIds      IDs to exclude from target search (the held group)
     * @returns {Object|null}           Best match with { targetPart, socketPosition, socketData, distance }
     */
    const checkAndSnapToSocket = useCallback((draggedPart, draggedPosition, excludeIds = new Set()) => {
        const otherParts = partsOnField.filter(p => !excludeIds.has(p.id));
        let bestMatch = null;
        let minDistance = Infinity;

        otherParts.forEach(otherPart => {
            const otherSockets = PART_SOCKETS_DATA[otherPart.type]?.sockets || [];

            otherSockets.forEach(socket => {
                if (!canConnect(draggedPart.type, socket.type)) return;
                if (isSocketOccupied(connections, otherPart.id, socket.id)) return;

                const socketWorldPos = [
                    otherPart.position[0] + socket.position[0],
                    otherPart.position[1] + socket.position[1],
                    otherPart.position[2] + socket.position[2]
                ];

                const dist = calculateDistance3D(draggedPosition, socketWorldPos);

                if (dist < VR_SNAP_RADIUS && dist < minDistance) {
                    minDistance = dist;
                    bestMatch = {
                        targetPart: otherPart,
                        socketPosition: socketWorldPos,
                        socketData: socket,
                        distance: dist
                    };
                }
            });
        });

        return bestMatch;
    }, [partsOnField, connections]);

    /**
     * performSnap — execute the snap: reposition the entire group so the snapping
     * part lands on the socket, then record the connection.
     *
     * @param {string} snappingPartId  The group member that matched the socket
     * @param {Object} match           The snap match from checkAndSnapToSocket
     * @param {Set}    groupIds        All IDs in the held group
     */
    const performSnap = useCallback((snappingPartId, match, groupIds) => {
        const snappingPart = partsOnField.find(p => p.id === snappingPartId);
        if (!snappingPart) return;

        const partData = PART_SOCKETS_DATA[snappingPart.type];
        const offset = partData?.connectionOffset || {};

        // Target position for the snapping part
        const finalPosition = [
            match.socketPosition[0] - (offset.x || 0),
            match.socketPosition[1] - (offset.y || 0),
            match.socketPosition[2] - (offset.z || 0)
        ];

        // Calculate the delta to shift the entire group
        const deltaX = finalPosition[0] - snappingPart.position[0];
        const deltaY = finalPosition[1] - snappingPart.position[1];
        const deltaZ = finalPosition[2] - snappingPart.position[2];

        setPartsOnField(prev => prev.map(p => {
            if (p.id === snappingPartId) {
                // The part that snaps — update position and add connection
                return {
                    ...p,
                    position: finalPosition,
                    connectedTo: [...p.connectedTo, match.targetPart.id]
                };
            }
            if (p.id === match.targetPart.id) {
                // The target part — add reverse connection
                return {
                    ...p,
                    connectedTo: [...p.connectedTo, snappingPartId]
                };
            }
            if (groupIds.has(p.id)) {
                // Other group members — shift by the same delta to keep relative positions
                return {
                    ...p,
                    position: [
                        p.position[0] + deltaX,
                        p.position[1] + deltaY,
                        p.position[2] + deltaZ
                    ]
                };
            }
            return p;
        }));

        setConnections(prev => [...prev, {
            id: `conn-${Date.now()}`,
            part1: snappingPartId,
            part2: match.targetPart.id,
            socketId: match.socketData.id,
            hostPartId: match.targetPart.id
        }]);

        SoundManager.playSnap();
    }, [partsOnField]);

    const isCarComplete = () => {
        const hasRequiredParts =
            partCounts.chassis >= 1 &&
            partCounts.wheel >= 4 &&
            partCounts.engine >= 1 &&
            partCounts.carBattery >= 1 &&
            partCounts.body >= 1;

        if (!hasRequiredParts) return false;

        const chassisPart = partsOnField.find(p => p.type === 'chassis');
        if (!chassisPart) return false;

        const connectedWheels = partsOnField.filter(p =>
            p.type === 'wheel' && p.connectedTo.includes(chassisPart.id)
        );

        const engineConnected = partsOnField.some(p =>
            p.type === 'engine' && p.connectedTo.includes(chassisPart.id)
        );

        const bodyConnected = partsOnField.some(p =>
            p.type === 'body' && p.connectedTo.includes(chassisPart.id)
        );

        const enginePart = partsOnField.find(p => p.type === 'engine');
        const batteryConnected = enginePart && partsOnField.some(p =>
            p.type === 'carBattery' && p.connectedTo.includes(enginePart.id)
        );

        return connectedWheels.length === 4 &&
            engineConnected &&
            bodyConnected &&
            batteryConnected;
    };

    const handleEnterVR = async () => {
        try {
            await carVRStore.enterVR();
        } catch (err) {
            console.error("Failed to enter VR:", err);
            alert("Failed to enter VR: " + (err.message || err.toString()));
        }
    };

    /**
     * Ref callback factory — stores a ref for each part so VRGrabController
     * can read and write world positions directly on the THREE.js objects.
     */
    const setPartRef = useCallback((partId, node) => {
        if (node) {
            partRefs.current[partId] = node;
        } else {
            delete partRefs.current[partId];
        }
    }, []);

    return (
        <div className="car-vr-constructor">
            {!session && (
                <button className="enter-vr-btn" onClick={handleEnterVR}>
                    🥽 ВОЙТИ В VR
                </button>
            )}

            {!session && (
                <div className="vr-hud-overlay">
                    <div style={{ background: 'rgba(0,0,0,0.7)', padding: '15px', borderRadius: '15px', color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                        <h3>🚗 Прогресс: {connectedPartsCount}/{totalRequired}</h3>
                        <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', marginTop: '10px' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4cc9f0', borderRadius: '5px', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                    
                    {isCarComplete() && (
                        <div style={{ background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '15px', color: 'white', textAlign: 'center', border: '2px solid #00f2ff' }}>
                            <h2>🎉 Машина собрана!</h2>
                            <button 
                                onClick={onCarLaunch}
                                style={{ padding: '10px 20px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
                            >
                                🚀 ЗАПУСТИТЬ
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true }} camera={{ position: [0, 1.6, 5] }} style={{ flex: 1, height: '100%' }}>
                <color attach="background" args={['#0a1220']} />
                <OrbitControls enableDamping={false} />
                <XR store={carVRStore}>
                    <VRScene>
                        <VRLocomotion />
                        <Suspense fallback={null}>
                            <VRPartsMenu onPartAdd={handlePartAdd} partCounts={partCounts} />
                        </Suspense>

                        {/* Grab controller — reads RT, manages selection & snap */}
                        <VRGrabController
                            partsOnField={partsOnField}
                            setPartsOnField={setPartsOnField}
                            connections={connections}
                            setConnections={setConnections}
                            selectedGroupIds={selectedGroupIds}
                            setSelectedGroupIds={setSelectedGroupIds}
                            highlightedSockets={highlightedSockets}
                            setHighlightedSockets={setHighlightedSockets}
                            partRefs={partRefs}
                            checkAndSnapToSocket={checkAndSnapToSocket}
                            performSnap={performSnap}
                        />

                        {partsOnField.map(part => (
                            <VRDraggablePart
                                key={part.id}
                                part={part}
                                highlightedSockets={highlightedSockets.filter(h => h.partId === part.id)}
                                isSelected={selectedGroupIds.has(part.id)}
                                onDelete={handlePartDelete}
                                onRefReady={(node) => setPartRef(part.id, node)}
                            />
                        ))}
                    </VRScene>
                </XR>
            </Canvas>
        </div>
    );
}
