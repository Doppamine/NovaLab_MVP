import React, { useState, useEffect } from 'react';
import Scene3D from './Scene3D';
import DraggablePart3D from './DraggablePart3D';
import PartsPanel3D from './PartsPanel3D';
import CarPhysicsLab from './CarPhysicsLab';
import { PART_SOCKETS_DATA } from './partSocketsData';
import { canConnect, calculateDistance3D, SNAP_RADIUS, isSocketOccupied } from './connectionRules3D';
import SoundManager from '../../utils/SoundManager';
import './Car3DConstructor.css';

function Car3DConstructor({ onCarLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [highlightedSockets, setHighlightedSockets] = useState([]);
    const [selectedPart, setSelectedPart] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [carExperience, setCarExperience] = useState('physics');

    const partCounts = partsOnField.reduce((acc, part) => {
        acc[part.type] = (acc[part.type] || 0) + 1;
        return acc;
    }, {});

    // Progress calculation
    const connectedPartsCount = partsOnField.filter(p => p.connectedTo.length > 0).length;
    const totalRequired = 8; // chassis + 4 wheels + engine + battery + body
    const progressPercent = Math.min(100, Math.round((connectedPartsCount / totalRequired) * 100));

    // Dismiss onboarding after first part is placed
    useEffect(() => {
        if (partsOnField.length > 0 && showOnboarding) {
            const timer = setTimeout(() => setShowOnboarding(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [partsOnField.length, showOnboarding]);

    // Cycle onboarding tips
    useEffect(() => {
        if (!showOnboarding) return;
        const interval = setInterval(() => {
            setOnboardingStep(prev => (prev + 1) % 3);
        }, 4000);
        return () => clearInterval(interval);
    }, [showOnboarding]);

    // Reset everything
    const handleReset = () => {
        setPartsOnField([]);
        setConnections([]);
        setHighlightedSockets([]);
        setSelectedPart(null);
        setShowOnboarding(true);
        setOnboardingStep(0);
    };

    const handlePartAdd = (partType) => {
        // Разносим стартовые позиции чтобы детали не накладывались
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

                // Проверяем: занят ли этот конкретный слот другой деталью
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
                part2: match.targetPart.id,
                socketId: match.socketData.id,
                hostPartId: match.targetPart.id
            }]);

            // Play snap sound
            SoundManager.playSnap();
            console.log(`✅ Connected ${part.type} to ${match.targetPart.type}`);
        } else {
            // Защита от залипания в начальной позиции (баг с центром)
            const pos = [position.x, position.y, position.z];
            const isNearCenter = Math.abs(pos[0]) < 0.3 && Math.abs(pos[2]) < 0.3;
            const partData = partsOnField.find(p => p.id === partId);
            const isUnconnected = partData && partData.connectedTo.length === 0;

            if (isNearCenter && isUnconnected) {
                // Сдвигаем от центра чтобы не перекрывала шасси
                const safeX = (Math.random() - 0.5) * 6;
                const safeZ = (Math.random() - 0.5) * 6;
                setPartsOnField(prev => prev.map(p =>
                    p.id === partId ? { ...p, position: [safeX, 2, safeZ] } : p
                ));
            } else {
                setPartsOnField(prev => prev.map(p =>
                    p.id === partId ? { ...p, position: pos } : p
                ));
            }
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

    const onboardingTips = [
        { icon: '👆', text: 'Нажми на деталь слева, чтобы добавить её' },
        { icon: '✋', text: 'Перетащи деталь к светящейся точке' },
        { icon: '🔗', text: 'Детали соединятся автоматически!' }
    ];

    return (
        <div className="car-module-wrapper">
            <div className="car-module-switcher">
                <button
                    type="button"
                    className={`car-module-switch ${carExperience === 'physics' ? 'active' : ''}`}
                    onClick={() => setCarExperience('physics')}
                >
                    Physics Lab
                </button>
                <button
                    type="button"
                    className={`car-module-switch ${carExperience === 'assembly' ? 'active' : ''}`}
                    onClick={() => setCarExperience('assembly')}
                >
                    Classic 3D Assembly
                </button>
            </div>

            {carExperience === 'physics' ? (
                <CarPhysicsLab onCarLaunch={onCarLaunch} />
            ) : (
                <div className="car-3d-constructor">
                    <PartsPanel3D
                        onPartAdd={handlePartAdd}
                        partCounts={partCounts}
                    />

                    <div className="scene-container">
                        {/* Progress Bar */}
                        <div className="progress-bar-container">
                            <div className="progress-info">
                                <span className="progress-label">🚗 Прогресс сборки</span>
                                <span className="progress-count">{connectedPartsCount}/{totalRequired}</span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Onboarding Overlay */}
                        {showOnboarding && partsOnField.length === 0 && (
                            <div className="onboarding-overlay">
                                <div className="onboarding-card">
                                    <div className="onboarding-icon">{onboardingTips[onboardingStep].icon}</div>
                                    <p className="onboarding-text">{onboardingTips[onboardingStep].text}</p>
                                    <div className="onboarding-dots">
                                        {onboardingTips.map((_, i) => (
                                            <span key={i} className={`dot ${i === onboardingStep ? 'active' : ''}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

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
                            <p>ЛКМ: Перетащить | ПКМ: Вращать камеру | Колёсико: Масштаб</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            {selectedPart && (
                                <button
                                    className="btn-delete"
                                    onClick={() => handlePartDelete(selectedPart)}
                                >
                                    🗑️ Удалить деталь
                                </button>
                            )}
                            {partsOnField.length > 0 && (
                                <button
                                    className="btn-reset"
                                    onClick={handleReset}
                                >
                                    🔄 Начать заново
                                </button>
                            )}
                        </div>

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
            )}
        </div>
    );
}

export default Car3DConstructor;
