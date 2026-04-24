import React, { useState, Suspense } from 'react';
import { useStore } from 'zustand';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR } from '@react-three/xr';
import { carVRStore } from './carVRStore';
import VRScene from './VRScene';
import VRLocomotion from './VRLocomotion';
import VRPartsMenu from './VRPartsMenu';
import VRDraggablePart from './VRDraggablePart';

import { PART_SOCKETS_DATA } from '../../components/Car3DConstructor/partSocketsData';
import { canConnect, calculateDistance3D, SNAP_RADIUS, isSocketOccupied } from '../../components/Car3DConstructor/connectionRules3D';
import SoundManager from '../../utils/SoundManager';
import './CarVRConstructor.css';

export default function CarVRConstructor({ onCarLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [highlightedSockets, setHighlightedSockets] = useState([]);
    const [selectedPartId, setSelectedPartId] = useState(null);

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

        if (selectedPartId === partId) setSelectedPartId(null);
    };

    const checkAndSnapToSocket = (draggedPart, draggedPosition) => {
        const otherParts = partsOnField.filter(p => p.id !== draggedPart.id);
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

                if (dist < SNAP_RADIUS && dist < minDistance) {
                    minDistance = dist;
                    bestMatch = {
                        targetPart: otherPart,
                        socketPosition: socketWorldPos,
                        socketData: socket
                    };
                }
            });
        });

        return bestMatch;
    };

    const handlePartPositionChange = (partId, position) => {
        const part = partsOnField.find(p => p.id === partId);
        if (!part) return;

        const match = checkAndSnapToSocket(part, [position.x, position.y, position.z]);
        if (match) {
            setHighlightedSockets([{
                partId: match.targetPart.id,
                position: match.socketPosition
            }]);
        } else {
            setHighlightedSockets([]);
        }

        setPartsOnField(prev => prev.map(p =>
            p.id === partId ? { ...p, position: [position.x, position.y, position.z] } : p
        ));
    };

    const handlePartDrop = (partId, position) => {
        const part = partsOnField.find(p => p.id === partId);
        if (!part) return;

        // Deselect
        if (selectedPartId === partId) setSelectedPartId(null);

        const match = checkAndSnapToSocket(part, [position.x, position.y, position.z]);

        if (match) {
            const partData = PART_SOCKETS_DATA[part.type];
            const offset = partData?.connectionOffset || {};

            const finalPosition = [
                match.socketPosition[0] - (offset.x || 0),
                match.socketPosition[1] - (offset.y || 0),
                match.socketPosition[2] - (offset.z || 0)
            ];

            setPartsOnField(prev => prev.map(p => {
                if (p.id === partId) {
                    return { ...p, position: finalPosition, connectedTo: [...p.connectedTo, match.targetPart.id] };
                }
                if (p.id === match.targetPart.id) {
                    return { ...p, connectedTo: [...p.connectedTo, partId] };
                }
                return p;
            }));

            setConnections(prev => [...prev, {
                id: `conn-${Date.now()}`,
                part1: partId,
                part2: match.targetPart.id,
                socketId: match.socketData.id,
                hostPartId: match.targetPart.id
            }]);

            SoundManager.playSnap();
        } else {
            setPartsOnField(prev => prev.map(p =>
                p.id === partId ? { ...p, position: [position.x, position.y, position.z] } : p
            ));
        }

        setHighlightedSockets([]);
    };

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
                        <VRLocomotion isPartSelected={selectedPartId !== null} />
                        <Suspense fallback={null}>
                            <VRPartsMenu onPartAdd={handlePartAdd} partCounts={partCounts} />
                        </Suspense>
                        {partsOnField.map(part => (
                            <VRDraggablePart
                                key={part.id}
                                part={part}
                                highlightedSockets={highlightedSockets.filter(h => h.partId === part.id)}
                                isSelected={selectedPartId === part.id}
                                onSelect={() => setSelectedPartId(part.id)}
                                onDelete={handlePartDelete}
                                onPositionChange={(pos) => handlePartPositionChange(part.id, pos)}
                                onDrop={(pos) => handlePartDrop(part.id, pos)}
                            />
                        ))}
                    </VRScene>
                </XR>
            </Canvas>
        </div>
    );
}
