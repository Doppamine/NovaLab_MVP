import React, { createContext, useState, useContext } from 'react';

/**
 * DragContext - контекст для управления состоянием drag'а
 * Используется для отключения OrbitControls во время перетаскивания
 */
const DragContext = createContext();

export function DragProvider({ children }) {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <DragContext.Provider value={{ isDragging, setIsDragging }}>
            {children}
        </DragContext.Provider>
    );
}

export function useDrag() {
    const context = useContext(DragContext);
    if (!context) {
        throw new Error('useDrag must be used within DragProvider');
    }
    return context;
}

export default DragContext;
