import React from 'react';
import { ASSEMBLY_ZONES } from '../../utils/assemblyZones';
import './CarAssemblyZones.css';

function CarAssemblyZones({ partsOnField, showHints = true }) {
    // Track which zones are occupied
    const occupiedZones = partsOnField.reduce((acc, part) => {
        if (part.type === 'wheel') {
            // Find which wheel zone this wheel is in
            const wheelZones = Object.keys(ASSEMBLY_ZONES).filter(k => k.startsWith('wheel'));
            for (const zoneKey of wheelZones) {
                const zone = ASSEMBLY_ZONES[zoneKey];
                const dx = part.position.x - zone.position.x;
                const dy = part.position.y - zone.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 30) {
                    acc.push(zoneKey);
                    break;
                }
            }
        } else if (ASSEMBLY_ZONES[part.type]) {
            acc.push(part.type);
        }
        return acc;
    }, []);

    return (
        <div className="assembly-zones">
            {Object.entries(ASSEMBLY_ZONES).map(([key, zone]) => {
                const isOccupied = occupiedZones.includes(key);

                return (
                    <div
                        key={key}
                        className={`assembly-zone ${isOccupied ? 'occupied' : ''}`}
                        style={{
                            left: zone.position.x - zone.size.width / 2,
                            top: zone.position.y - zone.size.height / 2,
                            width: zone.size.width,
                            height: zone.size.height,
                            borderColor: zone.color,
                            opacity: zone.opacity || 1,
                            zIndex: zone.priority
                        }}
                    >
                        {showHints && !isOccupied && (
                            <div className="zone-label" style={{ color: zone.color }}>
                                {zone.label}
                            </div>
                        )}
                        {isOccupied && (
                            <div className="zone-check">✓</div>
                        )}
                    </div>
                );
            })}

            {/* Assembly hint panel */}
            {showHints && (
                <div className="assembly-hint-panel">
                    <h4>📋 Схема сборки</h4>
                    <div className="hint-list">
                        <div className="hint-item">1. Шасси (центр)</div>
                        <div className="hint-item">2. 4 Колеса (по углам)</div>
                        <div className="hint-item">3. Двигатель (сверху)</div>
                        <div className="hint-item">4. Аккумулятор + Пульт</div>
                        <div className="hint-item">5. Кузов (финиш)</div>
                    </div>
                    <div className="hint-progress">
                        {occupiedZones.length} / {Object.keys(ASSEMBLY_ZONES).length}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CarAssemblyZones;
