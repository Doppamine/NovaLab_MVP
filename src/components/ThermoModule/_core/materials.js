/**
 * MATERIALS CATALOG
 * Specific heat capacity c [J/(kg·K)] and density ρ [kg/m³].
 * Values are the ones used in the Russian 8th-grade physics curriculum
 * (Перышкин / Грачев), matching the target Olympiad problem set.
 */

export const MATERIALS = {
    water: {
        key: 'water',
        label: 'Вода',
        c: 4200,           // J/(kg·K)
        rho: 1000,         // kg/m³
        color: '#4dc4ff',
        glow: '#00e0ff',
        phase: 'liquid',
        boilingPoint: 100, // °C at 1 atm
        meltingPoint: 0,
    },
    steel: {
        key: 'steel',
        label: 'Сталь',
        c: 460,
        rho: 7850,
        color: '#8a95a5',
        glow: '#c5d0e0',
        phase: 'solid',
    },
    copper: {
        key: 'copper',
        label: 'Медь',
        c: 385,
        rho: 8960,
        color: '#d97845',
        glow: '#ff9966',
        phase: 'solid',
    },
    air: {
        key: 'air',
        label: 'Воздух',
        c: 1005,           // c_p at constant pressure
        cv: 718,           // c_v at constant volume (for sealed room edge case)
        rho: 1.29,         // kg/m³ at 0°C, 1 atm
        color: '#e0f4ff',
        glow: '#88ccff',
        phase: 'gas',
    },
    aluminum: {
        key: 'aluminum',
        label: 'Алюминий',
        c: 920,
        rho: 2700,
        color: '#b0b6bc',
        glow: '#d0e0f0',
        phase: 'solid',
    },
    ice: {
        key: 'ice',
        label: 'Лёд',
        c: 2100,
        rho: 917,
        color: '#b8e8ff',
        glow: '#e0f8ff',
        phase: 'solid',
        meltingPoint: 0,
    },
};

/**
 * Temperature → color ramp for thermal visualization.
 * Blue (cold) → cyan → green → yellow → orange → red (hot).
 * Returns "#rrggbb".
 */
export function temperatureToColor(tempC, tMin = 0, tMax = 100) {
    const t = Math.max(0, Math.min(1, (tempC - tMin) / (tMax - tMin)));
    // Piecewise linear ramp through 6 stops.
    const stops = [
        [0.00, [30, 80, 220]],    // deep blue
        [0.20, [50, 180, 230]],   // cyan
        [0.40, [80, 230, 150]],   // green
        [0.60, [240, 220, 70]],   // yellow
        [0.80, [250, 140, 40]],   // orange
        [1.00, [230, 40, 40]],    // red
    ];
    for (let i = 0; i < stops.length - 1; i++) {
        const [t0, c0] = stops[i];
        const [t1, c1] = stops[i + 1];
        if (t >= t0 && t <= t1) {
            const f = (t - t0) / (t1 - t0);
            const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
            const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
            const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
            return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
        }
    }
    return '#ffffff';
}

export function getMaterial(key) {
    const m = MATERIALS[key];
    if (!m) throw new Error(`Unknown material: ${key}`);
    return m;
}
