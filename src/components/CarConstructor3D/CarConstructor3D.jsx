import React, { useState, useRef, useEffect } from 'react';
import { PARTS_DATA } from '../../utils/partsData';
import { validateCarAssembly } from '../../utils/mechanismValidator';
import './CarConstructor3D.css';

function CarConstructor3D({ onCarLaunch }) {
    const [partsOnField, setPartsOnField] = useState([]);
    const [connections, setConnections] = useState([]);
    const [draggedPart, setDraggedPart] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [carAssembly, setCarAssembly] = useState({ complete: false, message: '' });
    const constructorRef = useRef(null);
    const partIdCounter = useRef(0);

    const carParts = ['chassis', 'engine', 'carBattery', 'controller', 'body', 'wheel'];

    const handlePartRightClick = (e, partId) => {
        e.preventDefault();
        setPartsOnField(prev => prev.filter(p => p.id !== partId));
        setConnections(prev => prev.filter(c => c.from !== partId && c.to !== partId));
    };

    useEffect(() => {
        const validation = validateCarAssembly(partsOnField, connections);
        setCarAssembly(validation);
    }, [partsOnField, connections]);

    const handleLaunchCar = () => {
        if (onCarLaunch && carAssembly.complete) {
            onCarLaunch();
        }
    };

    const handleDragStart = (e, partType) => {
        // Implement drag start logic
    };

    const handleDrop = (e) => {
        // Implement drop logic
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="car-constructor-3d">
            {/* Parts Panel */}
            <div className="parts-panel-3d">
                <h3 className="panel-title">🔧 Детали Машины</h3>
                <div className="parts-list">
                    {carParts.map(partType => {
                        const partData = PARTS_DATA[partType];
                        const count = partsOnField.filter(p => p.type === partType).length;
                        const required = partType === 'wheel' ? 4 : 1;
                        const isComplete = count >= required;

                        return (
                            <div
                                key={partType}
                                className={`part-item ${isComplete ? 'complete' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, partType)}
                            >
                                <div className="part-icon">{partData.icon}</div>
                                <div className="part-info">
                                    <div className="part-name">{partData.name}</div>
                                    <div className="part-count">
                                        {count}/{required}
                                        {isComplete && <span className="check">✓</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3D Constructor Area */}
            <div
                ref={constructorRef}
                className="constructor-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {/* Isometric Grid */}
                <div className="isometric-grid">
                    {Array.from({ length: 10 }, (_, i) => (
                        <div key={`row-${i}`} className="grid-row">
                            {Array.from({ length: 10 }, (_, j) => (
                                <div key={`cell-${i}-${j}`} className="grid-cell" />
                            ))}
                        </div>
                    ))}
                </div>

                {/* 3D Parts */}
                <div className="parts-container-3d">
                    {partsOnField.length === 0 && (
                        <div className="constructor-hint">
                            <div className="hint-icon animate-float">🚗</div>
                            <div className="launch-message">{carAssembly.message}</div>
                            <button className="btn-launch animate-pulse" onClick={handleLaunchCar}>
                                🚀 ЗАПУСТИТЬ МАШИНУ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CarConstructor3D;
