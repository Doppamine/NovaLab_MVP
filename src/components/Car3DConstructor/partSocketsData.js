/**
 * partSocketsData - данные о слотах для каждого типа детали
 * connectionOffset - смещение точки крепления от центра детали
 */

export const PART_SOCKETS_DATA = {
    chassis: {
        connectionOffset: { y: 0 },
        sockets: [
            // 4 слота для колес по углам
            { type: 'wheel', position: [-1.8, -0.15, 2.8] },
            { type: 'wheel', position: [1.8, -0.15, 2.8] },
            { type: 'wheel', position: [-1.8, -0.15, -2.8] },
            { type: 'wheel', position: [1.8, -0.15, -2.8] },
            // Слот для двигателя (СПЕРЕДИ, НА шасси)
            { type: 'engine', position: [0, 0.3, 1.5] },
            // Слот для кузова (строго СВЕРХУ, центр)
            { type: 'body', position: [0, 0.8, 0] }
        ]
    },

    wheel: {
        connectionOffset: { y: 0 },
        sockets: [
            { type: 'chassis', position: [0, 0, 0] }
        ]
    },

    engine: {
        // Двигатель крепится СВЕРХУ шасси (снизу от себя)
        connectionOffset: { y: -0.5 },
        sockets: [
            // Слот к шасси (снизу двигателя)
            { type: 'chassis', position: [0, -0.5, 0] },
            // Слот к аккумулятору (СБОКУ справа от двигателя)
            { type: 'carBattery', position: [1.0, 0, 0] }
            // Пульт не крепится - просто выкладываем на поле
        ]
    },

    carBattery: {
        // Аккумулятор крепится сбоку к двигателю
        connectionOffset: { x: -0.5 },
        sockets: [
            // Слот к двигателю (слева от аккумулятора)
            { type: 'engine', position: [-0.5, 0, 0] }
        ]
    },

    body: {
        // Кузов крепится строго СВЕРХУ шасси
        connectionOffset: { y: -0.75 },
        sockets: [
            // Слот к шасси (снизу кузова, центр)
            { type: 'chassis', position: [0, -0.75, 0] }
        ]
    },

    controller: {
        // Пульт не крепится - просто декоративный элемент
        connectionOffset: {},
        sockets: []
    }
};

export default PART_SOCKETS_DATA;
