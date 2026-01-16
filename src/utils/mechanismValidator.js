// Mechanism Validator - checks if mechanisms are assembled correctly and working

import { PARTS_DATA, CAR_REQUIREMENTS } from './partsData';

/**
 * Check if a simple bulb circuit is complete and working
 */
export function validateBulbCircuit(partsOnField, connections) {
    const results = [];

    const bulbs = partsOnField.filter(p => p.type === 'bulb');
    const batteries = partsOnField.filter(p => p.type === 'battery');

    bulbs.forEach(bulb => {
        const connected = connections.some(conn =>
            (conn.from === bulb.id || conn.to === bulb.id)
        );

        if (connected) {
            const hasPower = batteries.some(battery => {
                return isConnectedTo(battery.id, bulb.id, connections, partsOnField);
            });

            results.push({
                partId: bulb.id,
                type: 'bulb',
                working: hasPower,
                reason: hasPower ? 'Подключён к источнику питания' : 'Нет питания'
            });
        }
    });

    return results;
}

/**
 * Check if propeller mechanism is working
 */
export function validatePropellerMechanism(partsOnField, connections) {
    const results = [];

    const propellers = partsOnField.filter(p => p.type === 'propeller');
    const motors = partsOnField.filter(p => p.type === 'motor');
    const batteries = partsOnField.filter(p => p.type === 'battery');

    propellers.forEach(propeller => {
        const connectedMotor = motors.find(motor => {
            return connections.some(conn =>
                (conn.from === motor.id && conn.to === propeller.id) ||
                (conn.from === propeller.id && conn.to === motor.id)
            );
        });

        if (connectedMotor) {
            const motorPowered = batteries.some(battery => {
                return isConnectedTo(battery.id, connectedMotor.id, connections, partsOnField);
            });

            results.push({
                partId: propeller.id,
                type: 'propeller',
                working: motorPowered,
                reason: motorPowered ? 'Мотор работает' : 'Мотору нужно питание'
            });
        }
    });

    return results;
}

/**
 * Check if car is fully assembled and ready to launch
 * STRICT: Requires all parts + all connections (checks ONLY by connections, NOT positions)
 */
export function validateCarAssembly(partsOnField, connections) {
    const partCounts = {};

    // Count parts
    partsOnField.forEach(part => {
        partCounts[part.type] = (partCounts[part.type] || 0) + 1;
    });

    // Check all parts present
    const missingParts = [];
    const hasAllParts = Object.entries(CAR_REQUIREMENTS).every(([partType, required]) => {
        const current = partCounts[partType] || 0;
        if (current < required) {
            missingParts.push(PARTS_DATA[partType]?.name || partType);
            return false;
        }
        return true;
    });

    if (!hasAllParts) {
        return {
            complete: false,
            message: `Нужны детали: ${missingParts.join(', ')}`,
            hint: 'Перетащите все детали на поле'
        };
    }

    // Find parts
    const chassis = partsOnField.find(p => p.type === 'chassis');
    const engine = partsOnField.find(p => p.type === 'engine');
    const battery = partsOnField.find(p => p.type === 'carBattery');
    const controller = partsOnField.find(p => p.type === 'controller');
    const body = partsOnField.find(p => p.type === 'body');
    const wheels = partsOnField.filter(p => p.type === 'wheel');

    if (!chassis || !engine || !battery || !controller || !body) {
        return {
            complete: false,
            message: 'Добавьте все детали машины',
            hint: 'Проверьте панель деталей'
        };
    }

    // Check connections
    const missingConnections = [];

    // Wheels to chassis - need 4 different wheels connected (by connections only!)
    const connectedWheels = wheels.filter(wheel =>
        connections.some(c =>
            (c.from === chassis.id && c.to === wheel.id) ||
            (c.from === wheel.id && c.to === chassis.id)
        )
    );

    if (connectedWheels.length < 4) {
        missingConnections.push(`Колёса → Шасси (${connectedWheels.length}/4)`);
    }

    // Engine to chassis
    const engineToChassis = connections.some(c =>
        (c.from === chassis.id && c.to === engine.id) ||
        (c.from === engine.id && c.to === chassis.id)
    );

    if (!engineToChassis) {
        missingConnections.push('Двигатель → Шасси');
    }

    // Battery to engine
    const batteryToEngine = connections.some(c =>
        (c.from === battery.id && c.to === engine.id) ||
        (c.from === engine.id && c.to === battery.id)
    );

    if (!batteryToEngine) {
        missingConnections.push('Аккумулятор → Двигатель');
    }

    // Controller to engine
    const controllerToEngine = connections.some(c =>
        (c.from === controller.id && c.to === engine.id) ||
        (c.from === engine.id && c.to === controller.id)
    );

    if (!controllerToEngine) {
        missingConnections.push('Пульт → Двигатель');
    }

    // Body to chassis
    const bodyToChassis = connections.some(c =>
        (c.from === chassis.id && c.to === body.id) ||
        (c.from === body.id && c.to === chassis.id)
    );

    if (!bodyToChassis) {
        missingConnections.push('Кузов → Шасси');
    }

    if (missingConnections.length > 0) {
        return {
            complete: false,
            message: 'Соедините детали',
            hint: missingConnections.join(', ')
        };
    }

    // All good!
    return {
        complete: true,
        message: '🎉 Поздравляю! Ты собрал рабочую машину!',
        hint: 'Нажми кнопку запуска чтобы испытать её!'
    };
}

/**
 * Helper: Check if two parts are connected (directly or through wires)
 */
function isConnectedTo(fromId, toId, connections, partsOnField) {
    const visited = new Set();
    const queue = [fromId];
    visited.add(fromId);

    while (queue.length > 0) {
        const currentId = queue.shift();

        if (currentId === toId) {
            return true;
        }

        connections.forEach(conn => {
            let nextId = null;
            if (conn.from === currentId) nextId = conn.to;
            else if (conn.to === currentId) nextId = conn.from;

            if (nextId && !visited.has(nextId)) {
                visited.add(nextId);
                queue.push(nextId);
            }
        });
    }

    return false;
}

export default {
    validateBulbCircuit,
    validatePropellerMechanism,
    validateCarAssembly
};
