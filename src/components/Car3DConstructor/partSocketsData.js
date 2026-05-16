/**
 * partSocketsData - данные о слотах для каждого типа детали
 * connectionOffset - смещение точки крепления от центра детали
 */

export const PART_SOCKETS_DATA = {
    chassis: {
        connectionOffset: { y: 0 },
        sockets: [
            // 4 слота для колес по углам
            { id: 'wheel-fl', type: 'wheel', position: [-1.1, -0.15, 1.6] },
            { id: 'wheel-fr', type: 'wheel', position: [1.9, -0.15, 1.6] },
            { id: 'wheel-rl', type: 'wheel', position: [-1.1, -0.15, -2.1] },
            { id: 'wheel-rr', type: 'wheel', position: [1.9, -0.15, -2.1] },
            // Слот для двигателя (СПЕРЕДИ, НА шасси)
            { id: 'engine-slot', type: 'engine', position: [0, 0.3, 1.5] },
            // Слот для кузова (строго СВЕРХУ, центр)
            { id: 'body-slot', type: 'body', position: [0.5, -1, -0.5] },
            // Слот для аккумулятора (на шасси, сбоку)
            { id: 'battery-slot', type: 'carBattery', position: [0.9, 0.3, 1.5] }
        ]
    },

    wheel: {
        connectionOffset: { y: 0 },
        sockets: [
            { id: 'to-chassis', type: 'chassis', position: [0, 0, 0] }
        ]
    },

    engine: {
        // Двигатель крепится СВЕРХУ шасси (снизу от себя)
        connectionOffset: { y: -0.5 },
        sockets: [
            // Слот к шасси (снизу двигателя)
            { id: 'to-chassis', type: 'chassis', position: [0, -0.5, 0] }
        ]
    },

    carBattery: {
        // Аккумулятор крепится на шасси
        connectionOffset: { x: -0.5 },
        sockets: [
            // Слот к шасси (снизу аккумулятора)
            { id: 'to-chassis', type: 'chassis', position: [-0.5, 0, 0] }
        ]
    },

    body: {
        // Кузов крепится строго СВЕРХУ шасси
        connectionOffset: { y: 0 },
        sockets: [
            // Слот к шасси (снизу кузова, центр)
            { id: 'to-chassis', type: 'chassis', position: [0, -2, 0] }
        ]
    },

    controller: {
        // Пульт не крепится - просто декоративный элемент
        connectionOffset: {},
        sockets: []
    }
};

export default PART_SOCKETS_DATA;
