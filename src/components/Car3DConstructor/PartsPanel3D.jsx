import React from 'react';
import './PartsPanel3D.css';

/**
 * PartsPanel3D - панель с деталями для 3D конструктора
 */

const PARTS_DATA = [
    {
        id: 'chassis',
        name: 'Шасси',
        icon: '🚗',
        color: '#444',
        description: 'Основа автомобиля'
    },
    {
        id: 'wheel',
        name: 'Колесо',
        icon: '⚪',
        color: '#222',
        description: 'Нужно 4 штуки'
    },
    {
        id: 'engine',
        name: 'Двигатель',
        icon: '⚙️',
        color: '#ff006e',
        description: 'Источник энергии'
    },
    {
        id: 'carBattery',
        name: 'Аккумулятор',
        icon: '🔋',
        color: '#00f2ff',
        description: 'Питание системы'
    },
    {
        id: 'body',
        name: 'Кузов',
        icon: '🚙',
        color: '#9d4edd',
        description: 'Корпус машины'
    },
    {
        id: 'controller',
        name: 'Пульт',
        icon: '🎮',
        color: '#00ff9f',
        description: 'Управление'
    }
];

function PartsPanel3D({ onPartAdd, partCounts = {} }) {
    return (
        <div className="parts-panel-3d">
            <div className="panel-header">
                <h3 className="panel-title">🔧 Детали</h3>
                <p className="panel-subtitle">Кликните чтобы добавить</p>
            </div>

            <div className="parts-grid">
                {PARTS_DATA.map(part => {
                    const count = partCounts[part.id] || 0;

                    return (
                        <button
                            key={part.id}
                            className="part-card"
                            onClick={() => onPartAdd(part.id)}
                            style={{ '--part-color': part.color }}
                        >
                            <div className="part-icon">{part.icon}</div>
                            <div className="part-info">
                                <div className="part-name">{part.name}</div>
                                <div className="part-description">{part.description}</div>
                            </div>
                            {count > 0 && (
                                <div className="part-count">{count}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="panel-footer">
                <div className="hint-item">
                    <span className="hint-icon">✋</span>
                    <span className="hint-text">ЛКМ: Перетащить</span>
                </div>
                <div className="hint-item">
                    <span className="hint-icon">🖱️</span>
                    <span className="hint-text">ПКМ: Вращать</span>
                </div>
            </div>
        </div>
    );
}

export default PartsPanel3D;
