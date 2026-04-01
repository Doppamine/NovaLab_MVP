import React, { useState, useRef, useEffect } from 'react';
import { getPartsByCategory } from '../../utils/partsData';
import RocketScene3D from './RocketScene3D';
import DraggablePart3D from '../Car3DConstructor/DraggablePart3D';
import RocketPartModels from './RocketPart3DModel';
import LaunchSequence from './LaunchSequence';
import { ROCKET_SOCKETS_DATA, canConnect, calculateDistance3D, SNAP_RADIUS, isSocketOccupied } from './rocketConnectionRules';
import SoundManager from '../../utils/SoundManager';
import './RocketConstructor.css';

/**
 * RocketConstructor - копия логики Car3DConstructor с ракетными моделями
 */
function RocketConstructor({ onLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [highlightedSockets, setHighlightedSockets] = useState([]);
    const [selectedPart, setSelectedPart] = useState(null);
    const [isLaunching, setIsLaunching] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState(0);

    const rocketParts = getPartsByCategory('rocket');

    const partCounts = partsOnField.reduce((acc, part) => {
        acc[part.type] = (acc[part.type] || 0) + 1;
        return acc;
    }, {});

    // Progress calculation
    const connectedPartsCount = partsOnField.filter(p => p.connectedTo.length > 0).length;
    const totalRequired = 10; // engine_cluster + first_stage + inter_stage + second_stage + command_module + fairing + 4 boosters
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

    // Добавить деталь
    const handlePartAdd = (partType) => {
        // Разносим стартовые позиции чтобы детали не накладывались
        const existingCount = partsOnField.length;
        const offsetX = ((existingCount % 4) - 1.5) * 3;
        const offsetZ = Math.floor(existingCount / 4) * 3 - 4;

        const newPart = {
            id: `${partType}-${Date.now()}`,
            type: partType,
            position: [offsetX, 5, offsetZ],
            connectedTo: []
        };
        setPartsOnField(prev => [...prev, newPart]);
    };

    // Удалить деталь
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

    // Поиск snap-точки
    const checkAndSnapToSocket = (draggedPart, draggedPosition) => {
        const otherParts = partsOnField.filter(p => p.id !== draggedPart.id);
        let bestMatch = null;
        let minDistance = Infinity;

        // Получаем данные о точке соединения перетаскиваемой детали
        const draggedPartData = ROCKET_SOCKETS_DATA[draggedPart.type];
        const draggedOffset = draggedPartData?.connectionOffset || {};

        // Вычисляем позицию ТОЧКИ СОЕДИНЕНИЯ перетаскиваемой детали (не центра!)
        const draggedConnectionPoint = [
            draggedPosition[0] + (draggedOffset.x || 0),
            draggedPosition[1] + (draggedOffset.y || 0),
            draggedPosition[2] + (draggedOffset.z || 0)
        ];

        otherParts.forEach(otherPart => {
            const otherSockets = ROCKET_SOCKETS_DATA[otherPart.type]?.sockets || [];

            otherSockets.forEach(socket => {
                if (!canConnect(draggedPart.type, socket.type)) return;

                // Проверяем: занят ли этот конкретный слот другой деталью
                if (isSocketOccupied(connections, otherPart.id, socket.id)) return;

                const socketWorldPos = [
                    otherPart.position[0] + socket.position[0],
                    otherPart.position[1] + socket.position[1],
                    otherPart.position[2] + socket.position[2]
                ];

                // Расстояние от ТОЧКИ СОЕДИНЕНИЯ детали до socket'а
                const dist = calculateDistance3D(draggedConnectionPoint, socketWorldPos);

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

    // Найти все связанные детали
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

    // Обработка drag - ИСПРАВЛЕНО: все вычисления внутри callback чтобы избежать stale closure
    const handlePartDrag = (partId, position) => {
        setPartsOnField(prev => {
            const part = prev.find(p => p.id === partId);
            if (!part) return prev;

            // Вычисляем delta из актуального state
            const delta = [
                position.x - part.position[0],
                position.y - part.position[1],
                position.z - part.position[2]
            ];

            // Находим группу из актуального state
            const findGroup = (id, visited = new Set()) => {
                if (visited.has(id)) return [];
                visited.add(id);
                const p = prev.find(x => x.id === id);
                if (!p) return [];
                let group = [p];
                p.connectedTo.forEach(connId => {
                    group = group.concat(findGroup(connId, visited));
                });
                return group;
            };

            const connectedGroup = findGroup(partId);
            const groupIds = new Set(connectedGroup.map(p => p.id));

            if (connectedGroup.length > 1) {
                // Двигаем всю группу вместе
                return prev.map(p => {
                    if (groupIds.has(p.id)) {
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
                });
            } else {
                // Одиночная деталь - показываем highlight и двигаем
                const match = checkAndSnapToSocket(part, [position.x, position.y, position.z]);
                if (match) {
                    setHighlightedSockets([{
                        partId: match.targetPart.id,
                        position: match.socketPosition
                    }]);
                } else {
                    setHighlightedSockets([]);
                }

                return prev.map(p =>
                    p.id === partId ? { ...p, position: [position.x, position.y, position.z] } : p
                );
            }
        });
    };

    // Обработка drop (snap происходит ТОЛЬКО здесь)
    const handlePartDrop = (partId, position) => {
        const part = partsOnField.find(p => p.id === partId);
        if (!part) return;

        // Если уже соединена - просто выходим, не пытаемся соединять снова
        if (part.connectedTo.length > 0) {
            setHighlightedSockets([]);
            return;
        }

        const match = checkAndSnapToSocket(part, [position.x, position.y, position.z]);

        if (match) {
            // Проверяем не соединены ли уже эти две детали
            if (part.connectedTo.includes(match.targetPart.id)) {
                setHighlightedSockets([]);
                return;
            }

            const partData = ROCKET_SOCKETS_DATA[part.type];
            const offset = partData?.connectionOffset || {};

            let finalPosition;

            // Для бустеров - вычисляем offset в РАДИАЛЬНОМ направлении (от socket к центру target)
            if (part.type === 'booster' && offset.x) {
                // Вычисляем направление от socket к центру target (в плоскости XZ)
                const targetCenter = match.targetPart.position;
                const socketPos = match.socketPosition;

                // Вектор от socket к центру target
                const dirX = targetCenter[0] - socketPos[0];
                const dirZ = targetCenter[2] - socketPos[2];
                const length = Math.sqrt(dirX * dirX + dirZ * dirZ);

                if (length > 0.01) {
                    // Нормализуем и применяем offset в направлении К центру
                    const normX = dirX / length;
                    const normZ = dirZ / length;
                    const radialOffset = offset.x; // Используем x как величину offset

                    finalPosition = [
                        socketPos[0] + normX * radialOffset,
                        socketPos[1] - (offset.y || 0),
                        socketPos[2] + normZ * radialOffset
                    ];
                } else {
                    // Fallback если socket в центре
                    finalPosition = [
                        socketPos[0] - (offset.x || 0),
                        socketPos[1] - (offset.y || 0),
                        socketPos[2] - (offset.z || 0)
                    ];
                }
            } else {
                // Для остальных деталей - стандартный offset
                finalPosition = [
                    match.socketPosition[0] - (offset.x || 0),
                    match.socketPosition[1] - (offset.y || 0),
                    match.socketPosition[2] - (offset.z || 0)
                ];
            }

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

            // Log при новом соединении
            console.log(`✅ Соединено: ${part.type} → ${match.targetPart.type}`);

            // Воспроизводим звук snap
            SoundManager.playSnap();
        } else {
            // Защита от залипания в начальной позиции (баг с центром)
            const pos = [position.x, position.y, position.z];
            const isNearCenter = Math.abs(pos[0]) < 0.5 && Math.abs(pos[2]) < 0.5;
            const partData = partsOnField.find(p => p.id === partId);
            const isUnconnected = partData && partData.connectedTo.length === 0;

            if (isNearCenter && isUnconnected) {
                // Сдвигаем от центра чтобы не перекрывала другие детали
                const safeX = (Math.random() - 0.5) * 8;
                const safeZ = (Math.random() - 0.5) * 8;
                setPartsOnField(prev => prev.map(p =>
                    p.id === partId ? { ...p, position: [safeX, 5, safeZ] } : p
                ));
            } else {
                setPartsOnField(prev => prev.map(p =>
                    p.id === partId ? { ...p, position: pos } : p
                ));
            }
        }

        setHighlightedSockets([]);
    };

    // Проверка готовности ракеты - обязательные детали должны быть соединены
    const isRocketReady = (() => {
        // Находим обязательные детали
        const engineCluster = partsOnField.find(p => p.type === 'engine_cluster');
        const firstStage = partsOnField.find(p => p.type === 'first_stage');
        const interStage = partsOnField.find(p => p.type === 'inter_stage');
        const secondStage = partsOnField.find(p => p.type === 'second_stage');
        const commandModule = partsOnField.find(p => p.type === 'command_module');
        const fairing = partsOnField.find(p => p.type === 'fairing');
        const boosters = partsOnField.filter(p => p.type === 'booster');

        // Все обязательные детали должны быть на месте
        if (!engineCluster || !firstStage || !interStage ||
            !secondStage || !commandModule || !fairing || boosters.length < 4) {
            return false;
        }

        // Собираем список обязательных деталей (первые 4 бустера)
        const requiredParts = [
            engineCluster, firstStage, interStage,
            secondStage, commandModule, fairing,
            ...boosters.slice(0, 4)
        ];

        // Проверяем что все обязательные детали соединены
        const allRequiredConnected = requiredParts.every(p => p.connectedTo.length > 0);
        if (!allRequiredConnected) return false;

        // Проверяем что все обязательные детали в одной группе
        const visited = new Set();
        const traverse = (id) => {
            if (visited.has(id)) return;
            visited.add(id);
            const part = partsOnField.find(p => p.id === id);
            if (part) {
                part.connectedTo.forEach(connId => traverse(connId));
            }
        };
        traverse(engineCluster.id);

        // Все 10 обязательных деталей должны быть в одной группе
        return requiredParts.every(p => visited.has(p.id));
    })();

    // Если запущена анимация - показываем LaunchSequence
    if (isLaunching) {
        return (
            <LaunchSequence
                rocketParts={partsOnField}
                onComplete={() => setIsLaunching(false)}
            />
        );
    }

    const onboardingTips = [
        { icon: '👆', text: 'Нажми на деталь слева для добавления' },
        { icon: '✋', text: 'Перетащи деталь к светящейся точке' },
        { icon: '🚀', text: 'Собери ракету и запусти её в космос!' }
    ];

    return (
        <div className="rocket-constructor">
            {/* Панель деталей */}
            <div className="rocket-parts-panel">
                <h3 className="panel-title">🚀 Сборка Ракеты</h3>
                <div className="rocket-parts-list">
                    {rocketParts.map(part => {
                        const count = partCounts[part.id] || 0;
                        return (
                            <div
                                key={part.id}
                                className={`rocket-part-item ${count > 0 ? 'placed' : ''}`}
                                onClick={() => handlePartAdd(part.id)}
                            >
                                <div className="part-icon">{part.icon}</div>
                                <div className="part-info">
                                    <div className="part-name">{part.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="assembly-hint">
                    <p>💡 <strong>Управление:</strong></p>
                    <ul>
                        <li>ЛКМ: перемещение по XZ</li>
                        <li>Shift+ЛКМ: вверх/вниз</li>
                        <li>ПКМ: вращение камеры</li>
                    </ul>
                </div>
            </div>

            {/* Сцена */}
            <div className="rocket-workspace">
                {/* Progress Bar */}
                <div className="progress-bar-container rocket-progress">
                    <div className="progress-info">
                        <span className="progress-label">🚀 Прогресс сборки</span>
                        <span className="progress-count">{connectedPartsCount}/{totalRequired}</span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill rocket-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Onboarding Overlay */}
                {showOnboarding && partsOnField.length === 0 && (
                    <div className="onboarding-overlay">
                        <div className="onboarding-card rocket-onboarding">
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

                <RocketScene3D>
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
                            customModel={RocketPartModels[part.type]}
                        />
                    ))}
                </RocketScene3D>

                <div className="scene-hint">
                    <p>ЛКМ: Перетащить | ПКМ: Вращать | Колёсико: Масштаб</p>
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

                <div className="launch-controls">
                    <button
                        className={`btn-launch ${isRocketReady ? '' : 'disabled'}`}
                        onClick={() => isRocketReady && setIsLaunching(true)}
                        disabled={!isRocketReady}
                    >
                        {isRocketReady ? 'ПОЕХАЛИ! 🌕' : '🔧 Собери ракету'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RocketConstructor;
