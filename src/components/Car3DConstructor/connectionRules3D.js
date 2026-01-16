/**
 * connectionRules3D - правила соединений для 3D конструктора
 */

// Радиус snap'а (расстояние для автоматического присоединения)
export const SNAP_RADIUS = 0.8;

/**
 * Проверка совместимости детали со слотом
 * socket.type означает ТИП ДЕТАЛИ которую можно присоединить к этому слоту
 * Например: слот типа 'wheel' на шасси = "сюда можно прикрепить wheel"
 */
export function canConnect(partType, socketType) {
    // Проверяем: деталь подходит к слоту если их типы совпадают
    return partType === socketType;
}

/**
 * Вычисление расстояния между двумя точками в 3D
 */
export function calculateDistance3D(pos1, pos2) {
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    const dz = pos1[2] - pos2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Поиск ближайшего слота для данной позиции
 */
export function findNearestSocket(partPosition, allSockets) {
    let nearest = null;
    let minDistance = Infinity;

    allSockets.forEach(socket => {
        const distance = calculateDistance3D(partPosition, socket.worldPosition);
        if (distance < minDistance && distance < SNAP_RADIUS) {
            minDistance = distance;
            nearest = socket;
        }
    });

    return nearest;
}

/**
 * Получение всех слотов деталей на сцене
 */
export function getSocketsFromParts(parts, partModelsData) {
    const allSockets = [];

    parts.forEach(part => {
        const modelData = partModelsData[part.type];
        if (modelData && modelData.sockets) {
            modelData.sockets.forEach(socket => {
                const worldPosition = [
                    part.position[0] + socket.position[0],
                    part.position[1] + socket.position[1],
                    part.position[2] + socket.position[2]
                ];

                allSockets.push({
                    partId: part.id,
                    partType: part.type,
                    socketType: socket.type,
                    localPosition: socket.position,
                    worldPosition: worldPosition
                });
            });
        }
    });

    return allSockets;
}

export default {
    SNAP_RADIUS,
    canConnect,
    calculateDistance3D,
    findNearestSocket,
    getSocketsFromParts
};
