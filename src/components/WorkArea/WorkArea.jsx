import React, { useState, useRef, useEffect } from 'react';
import Part from '../Part/Part';
import Connection from '../Connection/Connection';
import { PARTS_DATA, areSlotTypesCompatible } from '../../utils/partsData';
import { snapToGrid } from '../../utils/snapLogic';
import { getPoweredComponents, checkPropellerSpinning } from '../../utils/connectionRules';
import { validateCarAssembly } from '../../utils/mechanismValidator';
import './WorkArea.css';

function WorkArea({ onCarLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [draggedPart, setDraggedPart] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [poweredParts, setPoweredParts] = useState([]);
    const [carAssembly, setCarAssembly] = useState({ complete: false, message: '', hint: '' });
    const [hoveredConnection, setHoveredConnection] = useState(null);
    const workAreaRef = useRef(null);
    const partIdCounter = useRef(0);

    const handleDrop = (e) => {
        e.preventDefault();
        const partType = e.dataTransfer.getData('partType');

        if (partType && PARTS_DATA[partType]) {
            const rect = workAreaRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            addPartToField(partType, { x, y });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const addPartToField = (partType, position) => {
        const partData = PARTS_DATA[partType];
        const newPart = {
            id: `${partType}-${partIdCounter.current++}`,
            type: partType,
            data: partData,
            position: snapToGrid(position),
            state: partData.state ? { ...partData.state } : {}
        };

        setPartsOnField(prev => [...prev, newPart]);
    };

    const handlePartDragStart = (e, part) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggedPart(part);
    };

    const handlePartRightClick = (e, partId) => {
        e.preventDefault();
        e.stopPropagation();
        setPartsOnField(prev => prev.filter(p => p.id !== partId));
        setConnections(prev => prev.filter(c => c.from !== partId && c.to !== partId));
    };

    const handleConnectionClick = (connIndex) => {
        setConnections(prev => prev.filter((_, idx) => idx !== connIndex));
    };

    const getOccupiedWheelZones = () => {
        return [];
    };

    useEffect(() => {
        if (!draggedPart) return;

        let currentX = draggedPart.position.x;
        let currentY = draggedPart.position.y;
        const draggedElement = document.querySelector(`[data-part-id="${draggedPart.id}"]`);

        const handleMouseMove = (e) => {
            const rect = workAreaRef.current.getBoundingClientRect();
            let newX = e.clientX - rect.left - dragOffset.x;
            let newY = e.clientY - rect.top - dragOffset.y;

            if (draggedElement) {
                const deltaX = newX - currentX;
                const deltaY = newY - currentY;
                draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                draggedElement.style.zIndex = '1000';
            }
        };

        const handleMouseUp = (e) => {
            if (draggedElement) {
                const rect = workAreaRef.current.getBoundingClientRect();
                const finalX = e.clientX - rect.left - dragOffset.x;
                const finalY = e.clientY - rect.top - dragOffset.y;

                draggedElement.style.transform = '';
                draggedElement.style.zIndex = '';

                const snappedPos = snapToGrid({ x: finalX, y: finalY });

                setPartsOnField(prev =>
                    prev.map(p =>
                        p.id === draggedPart.id
                            ? { ...p, position: snappedPos }
                            : p
                    )
                );

                tryAutoConnect(draggedPart.id, snappedPos);
            }
            setDraggedPart(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedPart, dragOffset]);

    const tryAutoConnect = (movedPartId, newPosition) => {
        const movedPart = partsOnField.find(p => p.id === movedPartId);
        if (!movedPart || !movedPart.data.slots) return;

        const otherParts = partsOnField.filter(p => p.id !== movedPartId);
        const AUTO_CONNECT_DISTANCE = 80; // Increased for easier connection

        movedPart.data.slots.forEach(movedSlot => {
            const movedSlotPos = {
                x: newPosition.x + movedSlot.position.x,
                y: newPosition.y + movedSlot.position.y
            };

            otherParts.forEach(otherPart => {
                if (!otherPart.data.slots) return;

                otherPart.data.slots.forEach(otherSlot => {
                    const otherSlotPos = {
                        x: otherPart.position.x + otherSlot.position.x,
                        y: otherPart.position.y + otherSlot.position.y
                    };

                    const distance = Math.sqrt(
                        Math.pow(movedSlotPos.x - otherSlotPos.x, 2) +
                        Math.pow(movedSlotPos.y - otherSlotPos.y, 2)
                    );

                    if (distance < AUTO_CONNECT_DISTANCE && areSlotTypesCompatible(movedSlot.type, otherSlot.type)) {
                        const newConnection = {
                            from: movedPart.id,
                            to: otherPart.id,
                            fromSlot: movedSlot.id,
                            toSlot: otherSlot.id,
                            fromSlotType: movedSlot.type,
                            toSlotType: otherSlot.type,
                            isPowered: false
                        };

                        setConnections(prev => {
                            const exists = prev.some(c =>
                                (c.from === newConnection.from && c.to === newConnection.to) ||
                                (c.from === newConnection.to && c.to === newConnection.from)
                            );
                            if (exists) return prev;
                            return [...prev, newConnection];
                        });
                    }
                });
            });
        });
    };

    useEffect(() => {
        const powered = getPoweredComponents(partsOnField, connections);
        setPoweredParts(powered);
    }, [partsOnField, connections]);

    useEffect(() => {
        const validation = validateCarAssembly(partsOnField, connections);
        setCarAssembly(validation);
    }, [partsOnField, connections]);

    const isPartPowered = (partId) => {
        return poweredParts.includes(partId);
    };

    const isPartSpinning = (part) => {
        if (part.type === 'propeller') {
            return checkPropellerSpinning(part.id, partsOnField, connections);
        }
        return false;
    };

    const handleLaunchCar = () => {
        if (onCarLaunch && carAssembly.complete) {
            onCarLaunch();
        }
    };

    return (
        <div
            ref={workAreaRef}
            className="work-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="work-area-grid grid-pattern"></div>


            <div className="work-area-content">
                {partsOnField.length === 0 ? (
                    <div className="welcome-message">
                        <div className="welcome-icon animate-float">🚀</div>
                        <h2>Добро пожаловать в NovaLab</h2>
                        <p>Перетащите детали из панели слева для сборки машины</p>
                    </div>
                ) : null}

                {connections.map((conn, index) => {
                    const fromPart = partsOnField.find(p => p.id === conn.from);
                    const toPart = partsOnField.find(p => p.id === conn.to);
                    return (
                        <Connection
                            key={`conn-${index}`}
                            connection={conn}
                            fromPart={fromPart}
                            toPart={toPart}
                            onClick={() => handleConnectionClick(index)}
                            isHovered={hoveredConnection === index}
                            onMouseEnter={() => setHoveredConnection(index)}
                            onMouseLeave={() => setHoveredConnection(null)}
                        />
                    );
                })}

                {partsOnField.map(part => (
                    <Part
                        key={part.id}
                        part={part}
                        onDragStart={handlePartDragStart}
                        onRightClick={handlePartRightClick}
                        isSelected={draggedPart?.id === part.id}
                        isPowered={isPartPowered(part.id)}
                        isSpinning={isPartSpinning(part)}
                        showSlots={true}
                    />
                ))}

                {/* Car Ready - NO HINTS */}
                {carAssembly.complete && (
                    <div className="car-assembly-ready">
                        <div className="ready-message">{carAssembly.message}</div>
                        <button className="btn btn-primary launch-button animate-pulse" onClick={handleLaunchCar}>
                            🚀 ЗАПУСТИТЬ МАШИНКУ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkArea;
