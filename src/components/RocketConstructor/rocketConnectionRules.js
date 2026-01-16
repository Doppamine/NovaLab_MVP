/**
 * rocketConnectionRules.js - Правила соединений для 8-детальной ракеты
 */

export const SNAP_RADIUS = 2.0;

/**
 * Socket данные для каждой детали
 * Все позиции рассчитаны от центра модели
 */
export const ROCKET_SOCKETS_DATA = {
    // ========================================
    // ENGINE_CLUSTER - база ракеты
    // Размеры: платформа y=0.3, сопла до y=-1.7
    // Общая высота ~2, центр в 0
    // ========================================
    engine_cluster: {
        connectionOffset: { y: 0 },
        sockets: [
            // Верх платформы - для first_stage
            { type: 'first_stage', position: [0, 0.5, 0] }
        ]
    },

    // ========================================
    // FIRST_STAGE - центральный корпус
    // h=8 + полусфера, bounds: y ∈ [-4.15, 4.4]
    // Черные квадраты (точки крепления) на y=0, на расстоянии 1.25 от центра
    // ========================================
    first_stage: {
        connectionOffset: { y: -4.15 }, // Низ крепится к engine_cluster
        sockets: [
            // Низ - к engine_cluster
            { type: 'engine_cluster', position: [0, -4.15, 0] },
            // Верх - к inter_stage
            { type: 'inter_stage', position: [0, 4.4, 0] },
            // 4 боковых слота для бустеров - снаружи корпуса
            // first_stage радиус = 1.2, бустер точка крепления внутрь на 0.55
            // Итого: 1.2 + 0.55 + небольшой зазор = ~1.8
            { type: 'booster', position: [1.8, 0, 0] },
            { type: 'booster', position: [-1.8, 0, 0] },
            { type: 'booster', position: [0, 0, 1.8] },
            { type: 'booster', position: [0, 0, -1.8] }
        ]
    },

    // ========================================
    // BOOSTER - боковой ускоритель
    // Черный квадрат (точка крепления) находится на [0.4, 0, 0] в модели
    // С учетом размера квадрата (0.3) - центр крепления примерно на x=0.55
    // ========================================
    booster: {
        connectionOffset: { x: 0.55 }, // Крепится боковой точкой
        sockets: [
            // Точка крепления сбоку (где черный квадрат)
            { type: 'first_stage', position: [0.55, 0, 0] }
        ]
    },

    // ========================================
    // INTER_STAGE - переходник
    // h=1.5, bounds: y ∈ [-0.75, 0.75]
    // ========================================
    inter_stage: {
        connectionOffset: { y: -0.75 },
        sockets: [
            // Низ - к first_stage
            { type: 'first_stage', position: [0, -0.75, 0] },
            // Верх - к second_stage
            { type: 'second_stage', position: [0, 0.75, 0] }
        ]
    },

    // ========================================
    // SECOND_STAGE - вторая ступень
    // h=5 + сопло, bounds: y ∈ [-3.95, 2.9]
    // ========================================
    second_stage: {
        connectionOffset: { y: -2.6 }, // Низ (над соплом)
        sockets: [
            // Низ - к inter_stage
            { type: 'inter_stage', position: [0, -2.6, 0] },
            // Верх - к command_module
            { type: 'command_module', position: [0, 2.9, 0] }
        ]
    },

    // ========================================
    // COMMAND_MODULE - командный модуль
    // h=1.7 (с конусом), bounds: y ∈ [-0.6, 1.3]
    // ========================================
    command_module: {
        connectionOffset: { y: -0.6 },
        sockets: [
            // Низ - к second_stage
            { type: 'second_stage', position: [0, -0.6, 0] },
            // Верх - к fairing (на уровне верхнего кольца цилиндра, до конуса)
            { type: 'fairing', position: [0, 0.6, 0] }
        ]
    },

    // ========================================
    // FAIRING - обтекатель
    // h=3 конус, bounds: y ∈ [-1.5, 1.7]
    // ========================================
    fairing: {
        connectionOffset: { y: -1.5 },
        sockets: [
            // Низ - к command_module
            { type: 'command_module', position: [0, -1.5, 0] }
        ]
    }
};

/**
 * Проверка совместимости
 */
export function canConnect(partType, socketType) {
    return partType === socketType;
}

/**
 * Расстояние 3D
 */
export function calculateDistance3D(pos1, pos2) {
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    const dz = pos1[2] - pos2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export default {
    SNAP_RADIUS,
    ROCKET_SOCKETS_DATA,
    canConnect,
    calculateDistance3D
};
