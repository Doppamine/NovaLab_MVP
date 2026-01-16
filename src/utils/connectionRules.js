// Connection Rules - Defines how parts can connect and mechanisms work

/**
 * Check if a circuit is complete (has power source and connected path)
 */
export function checkCircuitComplete(startPartId, endPartId, connections) {
    // Use BFS to find path from start to end
    const visited = new Set();
    const queue = [startPartId];
    visited.add(startPartId);

    while (queue.length > 0) {
        const currentId = queue.shift();

        if (currentId === endPartId) {
            return true; // Path found!
        }

        // Find all connections from current part
        const connectedParts = connections
            .filter(conn => conn.from === currentId || conn.to === currentId)
            .map(conn => conn.from === currentId ? conn.to : conn.from);

        for (const partId of connectedParts) {
            if (!visited.has(partId)) {
                visited.add(partId);
                queue.push(partId);
            }
        }
    }

    return false;
}

/**
 * Check if bulb should be powered
 */
export function checkBulbPowered(bulbId, partsOnField, connections) {
    // Find all batteries
    const batteries = partsOnField.filter(part =>
        part.type === 'battery' || part.type === 'carBattery'
    );

    // Check if any battery has path to this bulb
    for (const battery of batteries) {
        if (checkCircuitComplete(battery.id, bulbId, connections)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if motor should be powered
 */
export function checkMotorPowered(motorId, partsOnField, connections) {
    const batteries = partsOnField.filter(part =>
        part.type === 'battery' || part.type === 'carBattery'
    );

    for (const battery of batteries) {
        if (checkCircuitComplete(battery.id, motorId, connections)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if propeller should spin
 */
export function checkPropellerSpinning(propellerId, partsOnField, connections) {
    // Find connected motor
    const motorConnection = connections.find(
        conn => (conn.to === propellerId && conn.toSlotType === 'mechanical_input') ||
            (conn.from === propellerId && conn.fromSlotType === 'mechanical_input')
    );

    if (!motorConnection) return false;

    const motorId = motorConnection.to === propellerId ? motorConnection.from : motorConnection.to;

    // Check if motor is powered
    return checkMotorPowered(motorId, partsOnField, connections);
}

/**
 * Check if car is complete and ready to launch
 */
export function checkCarComplete(partsOnField, connections, requirements) {
    const partCounts = {};

    // Count parts by type
    for (const part of partsOnField) {
        partCounts[part.type] = (partCounts[part.type] || 0) + 1;
    }

    // Check if all required parts are present
    for (const [partType, requiredCount] of Object.entries(requirements)) {
        if ((partCounts[partType] || 0) < requiredCount) {
            return {
                complete: false,
                missing: partType,
                requiredCount,
                currentCount: partCounts[partType] || 0
            };
        }
    }

    // Check if critical connections are made
    const chassis = partsOnField.find(p => p.type === 'chassis');
    const engine = partsOnField.find(p => p.type === 'engine');
    const battery = partsOnField.find(p => p.type === 'carBattery');
    const controller = partsOnField.find(p => p.type === 'controller');

    if (!chassis || !engine || !battery || !controller) {
        return { complete: false, missing: 'critical_part' };
    }

    // Check critical connections
    const engineConnected = connections.some(
        conn => (conn.from === chassis.id && conn.to === engine.id) ||
            (conn.from === engine.id && conn.to === chassis.id)
    );

    const batteryConnected = connections.some(
        conn => (conn.from === battery.id && conn.to === engine.id) ||
            (conn.from === engine.id && conn.to === battery.id)
    );

    const controllerConnected = connections.some(
        conn => (conn.from === controller.id && conn.to === engine.id) ||
            (conn.from === engine.id && conn.to === controller.id)
    );

    if (!engineConnected || !batteryConnected || !controllerConnected) {
        return {
            complete: false,
            missing: 'connections',
            engineConnected,
            batteryConnected,
            controllerConnected
        };
    }

    return { complete: true };
}

/**
 * Get all powered components
 */
export function getPoweredComponents(partsOnField, connections) {
    const powered = [];

    const batteries = partsOnField.filter(part =>
        part.type === 'battery' || part.type === 'carBattery'
    );

    for (const part of partsOnField) {
        if (part.type === 'battery' || part.type === 'carBattery') continue;

        for (const battery of batteries) {
            if (checkCircuitComplete(battery.id, part.id, connections)) {
                powered.push(part.id);
                break;
            }
        }
    }

    return powered;
}
