// Car Assembly Zones - visual guides for part placement

export const ASSEMBLY_ZONES = {
    chassis: {
        position: { x: 500, y: 350 },
        size: { width: 120, height: 80 },
        label: 'Шасси (центр)',
        color: '#00f2ff',
        priority: 1
    },
    wheelFL: {
        position: { x: 440, y: 290 },
        size: { width: 40, height: 40 },
        label: 'Колесо ЛП',
        requiredConnection: 'chassis',
        color: '#ff006e',
        priority: 2
    },
    wheelFR: {
        position: { x: 560, y: 290 },
        size: { width: 40, height: 40 },
        label: 'Колесо ПП',
        requiredConnection: 'chassis',
        color: '#ff006e',
        priority: 2
    },
    wheelRL: {
        position: { x: 440, y: 410 },
        size: { width: 40, height: 40 },
        label: 'Колесо ЛЗ',
        requiredConnection: 'chassis',
        color: '#ff006e',
        priority: 2
    },
    wheelRR: {
        position: { x: 560, y: 410 },
        size: { width: 40, height: 40 },
        label: 'Колесо ПЗ',
        requiredConnection: 'chassis',
        color: '#ff006e',
        priority: 2
    },
    engine: {
        position: { x: 500, y: 270 },
        size: { width: 60, height: 50 },
        label: 'Двигатель',
        requiredConnection: 'chassis',
        color: '#9d4edd',
        priority: 3
    },
    carBattery: {
        position: { x: 590, y: 270 },
        size: { width: 50, height: 60 },
        label: 'Аккумулятор',
        requiredConnection: 'engine',
        color: '#00ff9f',
        priority: 4
    },
    controller: {
        position: { x: 410, y: 270 },
        size: { width: 60, height: 50 },
        label: 'Пульт',
        requiredConnection: 'engine',
        color: '#ffbe0b',
        priority: 4
    },
    body: {
        position: { x: 500, y: 330 },
        size: { width: 140, height: 60 },
        label: 'Кузов',
        requiredConnection: 'chassis',
        color: '#fb5607',
        priority: 5,
        opacity: 0.6
    }
};

// Magnetic snap distance
export const SNAP_DISTANCE = 100;
export const MAGNETIC_PULL_DISTANCE = 60;

/**
 * Find the nearest assembly zone for a given part type
 */
export function findAssemblyZone(partType) {
    // Handle wheel zones (4 different zones for wheel type)
    if (partType === 'wheel') {
        return Object.entries(ASSEMBLY_ZONES)
            .filter(([key]) => key.startsWith('wheel'))
            .map(([key, zone]) => ({ key, ...zone }));
    }

    return ASSEMBLY_ZONES[partType];
}

/**
 * Check if part is in correct zone
 */
export function isInZone(partPosition, zone, threshold = SNAP_DISTANCE) {
    if (!zone) return false;

    const dx = partPosition.x - zone.position.x;
    const dy = partPosition.y - zone.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < threshold;
}

/**
 * Get magnetic pull towards zone
 */
export function getMagneticPull(partPosition, zone) {
    if (!zone) return { x: 0, y: 0 };

    const dx = zone.position.x - partPosition.x;
    const dy = zone.position.y - partPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > MAGNETIC_PULL_DISTANCE) {
        return { x: 0, y: 0 };
    }

    // Stronger pull when closer
    const strength = 1 - (distance / MAGNETIC_PULL_DISTANCE);

    return {
        x: dx * strength * 0.3,
        y: dy * strength * 0.3
    };
}

/**
 * Find nearest available zone for a wheel
 */
export function findNearestWheelZone(partPosition, occupiedZones = []) {
    const wheelZones = Object.entries(ASSEMBLY_ZONES)
        .filter(([key]) => key.startsWith('wheel'))
        .filter(([key]) => !occupiedZones.includes(key))
        .map(([key, zone]) => ({
            key,
            zone,
            distance: Math.sqrt(
                Math.pow(partPosition.x - zone.position.x, 2) +
                Math.pow(partPosition.y - zone.position.y, 2)
            )
        }))
        .sort((a, b) => a.distance - b.distance);

    return wheelZones[0];
}

export default {
    ASSEMBLY_ZONES,
    SNAP_DISTANCE,
    MAGNETIC_PULL_DISTANCE,
    findAssemblyZone,
    isInZone,
    getMagneticPull,
    findNearestWheelZone
};
