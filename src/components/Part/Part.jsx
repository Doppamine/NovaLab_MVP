import React from 'react';
import './Part.css';

function Part({
    part,
    onDragStart,
    onDrag,
    onDragEnd,
    onRightClick,
    isSelected,
    isPowered,
    isSpinning,
    showSlots = true
}) {
    const partRef = React.useRef(null);

    const getPartClasses = () => {
        const classes = ['part', 'pseudo-3d'];

        if (isSelected) classes.push('selected');
        if (isPowered) classes.push('powered');
        if (isSpinning) classes.push('spinning');

        if (part.type === 'bulb' && isPowered) {
            classes.push('bulb-powered');
        }
        if (part.type === 'propeller' && isSpinning) {
            classes.push('propeller-spinning');
        }
        if (part.type === 'motor' && isPowered) {
            classes.push('motor-active');
        }
        if (part.type === 'battery' || part.type === 'carBattery') {
            classes.push('battery-active');
        }

        return classes.join(' ');
    };

    return (
        <div
            ref={partRef}
            className={getPartClasses()}
            data-part-id={part.id}
            style={{
                left: part.position.x,
                top: part.position.y,
                width: part.data.size.width,
                height: part.data.size.height,
            }}
            onMouseDown={(e) => onDragStart && onDragStart(e, part)}
            onContextMenu={(e) => onRightClick && onRightClick(e, part.id)}
            draggable={false}
            title="ПКМ для удаления"
        >
            {part.type === 'propeller' ? (
                // Propeller: only image, no background block
                part.data.icon.startsWith('/') && (
                    <img
                        src={part.data.icon}
                        alt="propeller"
                        className="propeller-pure-image"
                    />
                )
            ) : (
                // Other parts: normal block with visual
                <div className="part-visual">
                    <div className="part-icon-large">
                        {part.data.icon.startsWith('/') ? (
                            <img src={part.data.icon} alt={part.data.name} />
                        ) : (
                            part.data.icon
                        )}
                    </div>
                    <div className="part-label">
                        {part.data.name}
                    </div>
                </div>
            )}

            {showSlots && part.data.slots && part.data.slots.map((slot, index) => (
                <div
                    key={`${part.id}-slot-${index}`}
                    className="connection-slot"
                    data-slot-type={slot.type}
                    style={{
                        left: slot.position.x - 6,
                        top: slot.position.y - 6,
                        borderColor: slot.color || '#00f2ff'
                    }}
                    title={`${slot.type} (${slot.id})`}
                >
                    <div
                        className="slot-inner"
                        style={{
                            background: slot.color || '#00f2ff',
                            boxShadow: `0 0 8px ${slot.color || '#00f2ff'}`
                        }}
                    />
                </div>
            ))}

            {isPowered && (
                <div className="powered-indicator">
                    <div className="power-glow"></div>
                </div>
            )}
        </div>
    );
}

export default Part;
