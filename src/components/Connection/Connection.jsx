import React from 'react';
import './Connection.css';

function Connection({ connection, fromPart, toPart, onClick, isHovered, onMouseEnter, onMouseLeave }) {
    if (!fromPart || !toPart) return null;

    const fromSlot = fromPart.data.slots.find(s => s.id === connection.fromSlot);
    const toSlot = toPart.data.slots.find(s => s.id === connection.toSlot);

    if (!fromSlot || !toSlot) return null;

    const startX = fromPart.position.x + fromSlot.position.x;
    const startY = fromPart.position.y + fromSlot.position.y;
    const endX = toPart.position.x + toSlot.position.x;
    const endY = toPart.position.y + toSlot.position.y;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const getWireColor = () => {
        if (connection.type?.includes('power')) return '#00ff9f';
        if (connection.type?.includes('mechanical')) return '#ff006e';
        if (connection.type?.includes('control')) return '#9d4edd';
        return '#00f2ff';
    };

    const wireColor = getWireColor();

    const minX = Math.min(startX, endX) - 10;
    const minY = Math.min(startY, endY) - 10;
    const width = Math.abs(endX - startX) + 20;
    const height = Math.abs(endY - startY) + 20;

    const relStartX = startX - minX;
    const relStartY = startY - minY;
    const relEndX = endX - minX;
    const relEndY = endY - minY;
    const relMidX = midX - minX;
    const relMidY = midY - minY;

    const pathData = `M ${relStartX} ${relStartY} Q ${relMidX} ${relMidY}, ${relEndX} ${relEndY}`;

    return (
        <svg
            className={`connection-wire ${isHovered ? 'hovered' : ''}`}
            style={{
                position: 'absolute',
                left: minX,
                top: minY,
                width: width,
                height: height,
                pointerEvents: 'auto',
                zIndex: 0,
                cursor: 'pointer'
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title="Кликните для удаления соединения"
        >
            <path
                d={pathData}
                fill="none"
                stroke={wireColor}
                strokeWidth={isHovered ? "10" : "8"}
                opacity="0.3"
                filter="blur(4px)"
            />

            <path
                d={pathData}
                fill="none"
                stroke={wireColor}
                strokeWidth={isHovered ? "5" : "3"}
                strokeLinecap="round"
                className="wire-main"
            />

            {connection.isPowered && (
                <>
                    <circle
                        r="4"
                        fill={wireColor}
                        className="energy-particle"
                    >
                        <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={pathData}
                        />
                    </circle>
                    <circle
                        r="3"
                        fill="white"
                        opacity="0.8"
                    >
                        <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={pathData}
                            begin="0.5s"
                        />
                    </circle>
                </>
            )}
        </svg>
    );
}

export default Connection;
