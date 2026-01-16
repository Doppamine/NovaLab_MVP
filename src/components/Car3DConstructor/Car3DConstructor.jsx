import React, { useState } from 'react';
import Scene3D from './Scene3D';
import DraggablePart3D from './DraggablePart3D';
import PartsPanel3D from './PartsPanel3D';
import { PART_SOCKETS_DATA } from './partSocketsData';
import { canConnect, calculateDistance3D, SNAP_RADIUS } from './connectionRules3D';
import SoundManager from '../../utils/SoundManager';
import './Car3DConstructor.css';

function Car3DConstructor({ onCarLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [highlightedSockets, setHighlightedSockets] = useState([]);
    const [selectedPart, setSelectedPart] = useState(null);

    const partCounts = partsOnField.reduce((acc, part) => {
        acc[part.type] = (acc[part.type] || 0) + 1;
        return acc;
    }, {});

    const handlePartAdd = (partType) => {
        const newPart = {
            id: `${partType}-${Date.now()}`,
            type: partType,
            position: [0, 2, 0],
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

        setSelectedPart(null);
    };

    const checkAndSnapToSocket = (draggedPart, draggedPosition) => {
        const otherParts = partsOnField.filter(p => p.id !== draggedPart.id);
        let bestMatch = null;
        let minDistance = Infinity;

        otherParts.forEach(otherPart => {
            const otherSockets = PART_SOCKETS_DATA[otherPart.type]?.sockets || [];

            otherSockets.forEach(socket => {
                if (!canConnect(draggedPart.type, socket.type)) return;

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

    const findConnectedGroup = (partId) => {
        const visited = new Set();
        const group = [];

        const traverse = (id) => {
            if (visited.has(id)) return;
            visited.add(id);

            const part = partsOnField.find(p => p.id === id);
            if (!part) return;

            group.push(part);
            part.connectedTo.forEach(connectedId => traverse(connectedId));
        };

        traverse(partId);
        return group;
    };

    const handlePartDrag = (partId, position) => {
        const part = partsOnField.find(p => p.id === partId);
        if (!part) return;

        const connectedGroup = findConnectedGroup(partId);

        const delta = [
            position.x - part.position[0],
            position.y - part.position[1],
            position.z - part.position[2]
        ];

        if (connectedGroup.length > 1) {
            setPartsOnField(prev => prev.map(p => {
                const isInGroup = connectedGroup.find(gp => gp.id === p.id);
                if (isInGroup) {
                    return {
                        ...p,
                        position: [
                            p.position[0] + delta[0],
                            p.position[1] + delta[1],
                            p.position[2] + delta[2]
                        ]
                    };
                }
                return p;
            }));
        } else {
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
        }
    };

    const handlePartDrop = (partId, position) => {
        const part = partsOnField.find(p => p.id === partId);
        if (!part) return;

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
                    return {
                        ...p,
                        position: finalPosition,
                        connectedTo: [...p.connectedTo, match.targetPart.id]
                    };
                }
                if (p.id === match.targetPart.id) {
                    return {
                        ...p,
                        connectedTo: [...p.connectedTo, partId]
                    };
                }
                return p;
            }));

            setConnections(prev => [...prev, {
                id: `conn-${Date.now()}`,
                part1: partId,
                part2: match.targetPart.id
            }]);

            // Play snap sound
            SoundManager.playSnap();
            console.log(`✅ Connected ${part.type} to ${match.targetPart.type}`);
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

    return (
        <div className="car-3d-constructor">
            <PartsPanel3D
                onPartAdd={handlePartAdd}
                partCounts={partCounts}
            />

            <div className="scene-container">
                <Scene3D>
                    {partsOnField.map(part => (
                        <DraggablePart3D
                            key={part.id}
                            partType={part.type}
                            initialPosition={part.position}
                            connectedParts={part.connectedTo}
                            highlightedSockets={highlightedSockets.filter(h => h.partId === part.id)}
                            isSelected={selectedPart === part.id}
                            onSelect={() => setSelectedPart(part.id)}
                            onPositionChange={(pos) => handlePartDrag(part.id, pos)}
                            onDrop={(pos) => handlePartDrop(part.id, pos)}
                        />
                    ))}
                </Scene3D>

                <div className="scene-hint">
                    <p>Left Click: Drag | Right Click: Rotate | Middle: Pan | Wheel: Zoom</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
                        Bring parts close to glowing points to snap
                    </p>
                </div>

                {selectedPart && (
                    <button
                        className="btn-delete"
                        onClick={() => handlePartDelete(selectedPart)}
                    >
                        🗑️ Удалить деталь
                    </button>
                )}

                {isCarComplete() && (
                    <div className="success-notification">
                        <div className="success-card">
                            <h2>🎉 Поздравляем!</h2>
                            <p>Машина собрана!</p>
                            <button
                                className="btn-launch"
                                onClick={onCarLaunch}
                            >
                                🚀 ЗАПУСТИТЬ СИМУЛЯЦИЮ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Car3DConstructor;
