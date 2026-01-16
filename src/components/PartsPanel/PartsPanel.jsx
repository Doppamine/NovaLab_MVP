import React from 'react';
import './PartsPanel.css';

function PartsPanel() {
    const categories = [
        {
            id: 'electrical',
            name: 'Физикоинженерия',
            icon: '⚡',
            parts: [
                { id: 'battery', name: 'Батарейка', icon: '🔋' },
                { id: 'bulb', name: 'Лампочка', icon: '💡' },
                { id: 'wire', name: 'Провод', icon: '🔌' },
                { id: 'motor', name: 'Мотор', icon: '⚙️' },
                { id: 'propeller', name: 'Пропеллер', icon: '🌀' },
            ]
        },
        {
            id: 'car',
            name: 'Детали машины',
            icon: '🚗',
            parts: [
                { id: 'chassis', name: 'Шасси', icon: '🏗️' },
                { id: 'wheel', name: 'Колесо', icon: '🛞' },
                { id: 'engine', name: 'Двигатель', icon: '🔧' },
                { id: 'carBattery', name: 'Аккумулятор', icon: '🔋' },
                { id: 'controller', name: 'Пульт', icon: '🎮' },
                { id: 'body', name: 'Кузов', icon: '🚗' },
            ]
        }
    ];

    const [activeCategory, setActiveCategory] = React.useState('electrical');

    const handleDragStart = (e, partId) => {
        e.dataTransfer.setData('partType', partId);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="parts-panel glass-strong">
            <div className="panel-header">
                <h3>Детали</h3>
                <div className="panel-glow"></div>
            </div>

            <div className="categories">
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(category.id)}
                    >
                        <span className="category-icon">{category.icon}</span>
                        <span className="category-name">{category.name}</span>
                    </button>
                ))}
            </div>

            <div className="parts-list">
                {categories
                    .find(cat => cat.id === activeCategory)
                    ?.parts.map(part => (
                        <div
                            key={part.id}
                            className="part-item pseudo-3d"
                            draggable
                            onDragStart={(e) => handleDragStart(e, part.id)}
                        >
                            <div className="part-icon">{part.icon}</div>
                            <div className="part-name">{part.name}</div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

export default PartsPanel;
