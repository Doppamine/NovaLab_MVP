/**
 * HeatEngine — pure physics solver. No React, no Three.js.
 *
 * Core principle: every body is a thermal capacitor with capacity C = c·m [J/K].
 * All three levels reduce to coupled heat-capacitor networks.
 *
 *   Level 1 (static mixing):    Σ C_i · (T_eq − T_i) = 0  →  closed-form T_eq
 *   Level 2 (enclosure dump):   Q_released by source  →  ΔT_air = Q / (c_air · m_air)
 *   Level 3 (steady flow):      P_useful = ṁ · c · ΔT,   η = P_useful / P_total
 *
 * Invariants:
 *   • conservation of energy (no unit-conversion cheats)
 *   • positive absolute capacities (c, m > 0)
 *   • ΔT in Kelvin === ΔT in Celsius (temperature differences are unit-agnostic)
 */

import { getMaterial } from './materials.js';

// ──────────────────────────────────────────────────────────────
// PRIMITIVE HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Heat capacity of a body: C = c · m  [J/K].
 */
export function heatCapacity(body) {
    const mat = getMaterial(body.material);
    return mat.c * body.mass;
}

/**
 * Energy required to change body's temperature by ΔT:  Q = c · m · ΔT  [J].
 */
export function heatNeeded(body, deltaT) {
    return heatCapacity(body) * deltaT;
}

/**
 * Mass-flow rate through a circular pipe:  ṁ = ρ · A · v  [kg/s].
 * A = π · (d/2)²
 */
export function massFlowRate({ rho, diameter, velocity }) {
    const area = Math.PI * (diameter / 2) ** 2;
    return rho * area * velocity;
}

// ──────────────────────────────────────────────────────────────
// LEVEL 1 — STATIC MIXING (closed-form equilibrium)
// ──────────────────────────────────────────────────────────────

/**
 * Weighted-average equilibrium temperature for N thermally isolated bodies
 * that exchange heat only among themselves.
 *
 *   T_eq = Σ (c_i · m_i · T_i) / Σ (c_i · m_i)
 *
 * Returns { T_eq, contributions, totalCapacity } where each contribution
 * carries enough info to drive the PhysicsXRay breakdown:
 *   - C       : heat capacity of this body (J/K)
 *   - share   : fraction of total capacity  (C_i / ΣC)
 *   - CdT     : energy this body must give/receive to reach T_eq  (J)
 *   - direction: 'release' | 'absorb' | 'inert'
 */
export function solveEquilibrium(bodies) {
    if (!bodies || bodies.length === 0) {
        return { T_eq: 0, contributions: [], totalCapacity: 0 };
    }

    let numerator = 0;
    let denominator = 0;
    for (const b of bodies) {
        const C = heatCapacity(b);
        numerator += C * b.temperature;
        denominator += C;
    }
    if (denominator == 0) denominator = 1;
    const T_eq = numerator / denominator;

    const contributions = bodies.map(b => {
        const C = heatCapacity(b);
        const deltaT = T_eq - b.temperature;         // +: absorbs, −: releases
        const CdT = C * deltaT;                      // signed energy balance
        let direction;
        if (Math.abs(CdT) < 1e-6) direction = 'inert';
        else direction = CdT > 0 ? 'absorb' : 'release';
        return {
            bodyId: b.id,
            material: b.material,
            mass: b.mass,
            temperature: b.temperature,
            C,
            share: C / denominator,
            deltaT,
            CdT,
            direction,
        };
    });

    return { T_eq, contributions, totalCapacity: denominator };
}

/**
 * Instantaneous conductive heat-flow rate between two bodies in contact.
 *   dQ/dt = G · (T_hot − T_cold)
 * G is a lumped thermal conductance [W/K]. We don't need realistic values —
 * we need the rate to be proportional to ΔT so the animation is physical,
 * not choreographed.
 */
export function conductiveRate(bodyA, bodyB, G = 2.5) {
    const dT = bodyA.temperature - bodyB.temperature;
    return G * dT; // positive: A→B, negative: B→A
}

/**
 * Relaxation integrator for the ANIMATION timeline of Level 1.
 * Marches the system toward equilibrium with an exponential decay
 * whose time-constant τ ≈ (C_eff / G) is chosen so the visual
 * resolves in ~4 seconds regardless of input magnitudes.
 *
 * Returns a NEW array of bodies with updated temperatures.
 */
export function relaxStep(bodies, dt, tauSeconds = 4.0) {
    const { T_eq } = solveEquilibrium(bodies);
    const decay = Math.exp(-dt / tauSeconds);
    return bodies.map(b => ({
        ...b,
        temperature: T_eq + (b.temperature - T_eq) * decay,
    }));
}

// ──────────────────────────────────────────────────────────────
// LEVEL 2 — ENCLOSURE ABSORPTION
// ──────────────────────────────────────────────────────────────

/**
 * Heat released by a source body cooling from T_initial to T_final.
 *   Q = c · m · (T_initial − T_final)   [J, always reported positive]
 */
export function heatReleased(body, T_final) {
    return heatCapacity(body) * (body.temperature - T_final);
}

/**
 * Mass of air in a rectangular room.
 *   m_air = ρ · V = ρ · (S · h)
 */
export function airMass({ floorArea, height, density, airDensity }) {
    const rho = density ?? airDensity ?? 1.29;
    return rho * floorArea * height;
}

/**
 * Level 2 solution: how much does the kitchen air heat up if ALL the kettle's
 * lost heat goes into the air (idealized, adiabatic walls, constant pressure).
 *
 *   ΔT_air = Q / (c_air · m_air)
 */
export function absorbIntoEnclosure({ sourceBody, T_final_source, enclosure }) {
    const Q = heatReleased(sourceBody, T_final_source);
    const mAir = airMass(enclosure);
    const airMat = getMaterial('air');
    const c = enclosure.useCv ? airMat.cv : airMat.c;
    const deltaTair = Q / (c * mAir);
    return {
        Q,
        mAir,
        deltaTair,
        T_air_final: (enclosure.initialAirTemp ?? 20) + deltaTair,
    };
}

// ──────────────────────────────────────────────────────────────
// LEVEL 3 — DYNAMIC CONTINUOUS FLOW
// ──────────────────────────────────────────────────────────────

/**
 * Useful power absorbed by a fluid flowing steadily through a heater.
 *   P_useful = ṁ · c · (T_out − T_in)   [W]
 */
export function usefulPower({ velocity, diameter, material, T_in, T_out }) {
    const mat = getMaterial(material);
    const mdot = massFlowRate({ rho: mat.rho, diameter, velocity });
    return mdot * mat.c * (T_out - T_in);
}

/**
 * Efficiency of the heater-to-fluid energy transfer.
 *   η = P_useful / P_total   ∈ [0, 1]
 */
export function efficiency({ P_total, P_useful }) {
    if (P_total <= 0) return 0;
    return Math.max(0, Math.min(1, P_useful / P_total));
}

/**
 * Full Level-3 solve for a given flow configuration.
 * Returns the observables the scene and X-Ray both need.
 */
export function solveFlow({ P_total, velocity, diameter, material, T_in, T_out }) {
    const mat = getMaterial(material);
    const mdot = massFlowRate({ rho: mat.rho, diameter, velocity });
    const P_required = mdot * mat.c * (T_out - T_in);
    const eta = efficiency({ P_total, P_useful: P_required });
    const P_useful = Math.min(Math.max(P_required, 0), Math.max(P_total, 0));
    const P_loss = Math.max(0, P_total - P_useful);
    return {
        mdot,
        P_required,
        P_useful,
        P_loss,
        lossFraction: P_total > 0 ? 1 - eta : 0,
        eta,
    };
}

/**
 * Inverse solve — given total power, efficiency target, and flow geometry,
 * what outlet temperature results? Used when the student drags the flow
 * slider and we need T_out to update in real time without re-solving.
 *
 *   T_out = T_in + (η · P_total) / (ṁ · c)
 */
export function outletTempFromFlow({ P_total, eta, velocity, diameter, material, T_in }) {
    const mat = getMaterial(material);
    const mdot = massFlowRate({ rho: mat.rho, diameter, velocity });
    if (mdot <= 0) return T_in;
    return T_in + (eta * P_total) / (mdot * mat.c);
}

/**
 * Boiling guard. If the computed outlet temperature exceeds the boiling
 * point at atmospheric pressure, we flip the phase and clamp the liquid
 * temperature at 100°C (latent-heat physics is out of scope for 8th grade,
 * but the phase transition is the visual hook).
 */
export function checkBoiling({ material, temperature }) {
    const mat = getMaterial(material);
    if (!mat.boilingPoint) return { boiling: false, phase: mat.phase };
    const Tboil = mat.boilingPoint; // simplified: pressure-independent
    return {
        boiling: temperature >= Tboil,
        phase: temperature >= Tboil ? 'gas' : mat.phase,
        Tboil,
    };
}

// ──────────────────────────────────────────────────────────────
// UNIFIED STEP DISPATCHER
// ──────────────────────────────────────────────────────────────

/**
 * Advance the simulation by dt seconds for the given level.
 * Returns a NEW partial-state object that the store merges in.
 *
 * The switch is intentional: different levels have fundamentally different
 * time dynamics. What they SHARE is the heat-capacity vocabulary above.
 */
export function step(state, dt) {
    switch (state.level) {
        case 1: {
            const ids = Object.keys(state.bodies);
            const bodies = ids.map(id => state.bodies[id]);
            const next = relaxStep(bodies, dt);
            const bodiesOut = {};
            next.forEach(b => { bodiesOut[b.id] = b; });
            return { bodies: bodiesOut };
        }
        case 2: {
            // Animate the room-fill as a monotonic approach from initial to final.
            // The "answer" is fixed by absorbIntoEnclosure; we just interpolate.
            const t = Math.min(1, (state.simTime + dt) / (state.level2Duration ?? 6));
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            const target = state.level2Target ?? 20;
            const T0 = state.level2InitialAirTemp ?? 20;
            const airTemp = T0 + (target - T0) * eased;
            return { airTemp, simTime: state.simTime + dt };
        }
        case 3: {
            // Steady-state: nothing to integrate — observables depend only on inputs.
            return { simTime: state.simTime + dt };
        }
        default:
            return {};
    }
}

// ──────────────────────────────────────────────────────────────
// ANSWER VALIDATION
// ──────────────────────────────────────────────────────────────

/**
 * Compare student answer to the truth with tolerance. Returns a diagnostic
 * object the PhysicsXRay consumes verbatim.
 *
 * For Level 1: answer is T_eq in °C, tolerance ±0.5 K.
 * For Level 2: answer is ΔT_air in K, tolerance ±2 K.
 * For Level 3: answer is loss fraction [0,1], tolerance ±0.03.
 */
export function validateAnswer({ level, given, expected, tolerance }) {
    const diff = given - expected;
    const absDiff = Math.abs(diff);
    const correct = absDiff <= tolerance;
    return {
        level,
        given,
        expected,
        diff,
        absDiff,
        correct,
        tolerance,
        percentError: expected !== 0 ? (diff / expected) * 100 : 0,
    };
}

const HeatEngine = {
    heatCapacity,
    heatNeeded,
    massFlowRate,
    solveEquilibrium,
    conductiveRate,
    relaxStep,
    heatReleased,
    airMass,
    absorbIntoEnclosure,
    usefulPower,
    efficiency,
    solveFlow,
    outletTempFromFlow,
    checkBoiling,
    step,
    validateAnswer,
};

export default HeatEngine;
