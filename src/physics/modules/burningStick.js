/**
 * NovaLab Physics — Модуль «Горящая палка».
 *
 * Это детерминированная инженерная модель фронта горения вдоль тонкого стержня.
 * Мы не решаем полную 3D задачу теплообмена и химической кинетики, а используем
 * эффективную 1D модель:
 *
 *   dx/dt = v_burn(T, O2, wind, moisture, radius)
 *   dT/dt = (T_target - T) / tau_T
 *   dλ/dt = (λ_target - λ) / tau_O2
 *   dQ/dt = m_dot * H_comb
 *
 * где:
 *   x  — путь, пройденный каждым фронтом горения;
 *   T  — температура фронта;
 *   λ  — локальный коэффициент доступности кислорода;
 *   Q  — накопленное выделенное тепло.
 *
 * История (result.history) — единственный источник данных для UI-анимации.
 */

import { integrate } from '../integrators/rk4.js';
import { PHYSICAL_CONSTANTS } from '../constants.js';

const COMBUSTION_EFFICIENCY = 0.82;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeBurningDerived(state, params) {
  const [frontDistance, frontTemperature, oxygenFactor] = state;
  const {
    length,
    radius,
    density,
    ignitionCount,
    baseBurnRate,
    referenceRadius,
    ignitionTemperature,
    flameTemperature,
    heatOfCombustion,
    moistureFraction,
    ambientTemperature,
  } = params;

  const area = Math.PI * radius * radius;
  const burnedLength = Math.min(length, ignitionCount * Math.max(frontDistance, 0));
  const remainingLength = Math.max(0, length - burnedLength);
  const massRemaining = density * area * remainingLength;

  const refTemp = PHYSICAL_CONSTANTS.T_room_standard.value;
  const geometryFactor = clamp(Math.sqrt(referenceRadius / radius), 0.55, 2.25);
  const moistureFactor = clamp(1 - 1.4 * moistureFraction, 0.12, 1.0);
  const ambientFactor = clamp(1 + 0.003 * (ambientTemperature - refTemp), 0.75, 1.25);
  const thermalSpan = Math.max(flameTemperature - ignitionTemperature, 1);
  const activation = clamp((frontTemperature - ignitionTemperature) / thermalSpan, 0, 1);

  const linearBurnRate =
    baseBurnRate *
    geometryFactor *
    moistureFactor *
    ambientFactor *
    Math.max(0.2, oxygenFactor) *
    (0.25 + 0.75 * activation);

  const massBurnRate = density * area * ignitionCount * linearBurnRate;
  const heatReleaseRate = massBurnRate * heatOfCombustion * COMBUSTION_EFFICIENCY;

  const frontPositions = ignitionCount === 2
    ? [frontDistance, Math.max(0, length - frontDistance)]
    : [frontDistance];

  return {
    area,
    activation,
    burnedLength,
    remainingLength,
    massRemaining,
    linearBurnRate,
    massBurnRate,
    heatReleaseRate,
    frontPositions,
    burnedLeft: ignitionCount === 2 ? Math.min(frontDistance, length / 2) : burnedLength,
    burnedRight: ignitionCount === 2 ? Math.min(frontDistance, length / 2) : 0,
  };
}

export function estimateBurningStickUniformTime({
  length,
  baseBurnRate,
  ignitionCount = 1,
}) {
  if (!(length > 0)) throw new Error('length must be > 0');
  if (!(baseBurnRate > 0)) throw new Error('baseBurnRate must be > 0');
  if (!(ignitionCount >= 1)) throw new Error('ignitionCount must be >= 1');
  return length / (baseBurnRate * ignitionCount);
}

export function simulateBurningStick({
  length,
  radius,
  density,
  moistureFraction = 0,
  oxygenFraction,
  windSpeed = 0,
  ambientTemperature,
  ignitionCount = 1,
  baseBurnRate,
  referenceRadius,
  ignitionTemperature,
  flameTemperature,
  heatOfCombustion,
  tMax = 600,
  rtol = 1e-4,
  maxDt = 0.05,
  onTrace,
}) {
  if (!(length > 0)) throw new Error('length must be > 0');
  if (!(radius > 0)) throw new Error('radius must be > 0');
  if (!(density > 0)) throw new Error('density must be > 0');
  if (!(baseBurnRate > 0)) throw new Error('baseBurnRate must be > 0');
  if (!(referenceRadius > 0)) throw new Error('referenceRadius must be > 0');
  if (!(ignitionCount === 1 || ignitionCount === 2)) throw new Error('ignitionCount must be 1 or 2');
  if (!(oxygenFraction > 0)) throw new Error('oxygenFraction must be > 0');
  if (!(ambientTemperature > 0)) throw new Error('ambientTemperature must be > 0');
  if (!(ignitionTemperature > ambientTemperature)) throw new Error('ignitionTemperature must be above ambientTemperature');
  if (!(flameTemperature > ignitionTemperature)) throw new Error('flameTemperature must exceed ignitionTemperature');
  if (!(heatOfCombustion > 0)) throw new Error('heatOfCombustion must be > 0');
  if (!(tMax > 0)) throw new Error('tMax must be > 0');

  const earthOxygen = PHYSICAL_CONSTANTS.oxygen_fraction_air.value;
  const refTemp = PHYSICAL_CONSTANTS.T_room_standard.value;

  const oxygenTarget = clamp(oxygenFraction / earthOxygen, 0.25, 1.9);
  const windFactor = clamp(1 + 0.04 * Math.min(Math.max(windSpeed, 0), 10), 0.85, 1.35);
  const oxygenAvailabilityTarget = clamp(oxygenTarget * windFactor, 0.2, 2.15);
  const moistureFactor = clamp(1 - 1.4 * moistureFraction, 0.12, 1.0);
  const thermalTargetFactor = clamp(oxygenAvailabilityTarget * moistureFactor, 0.2, 1.0);
  const targetFrontTemperature = clamp(
    ambientTemperature + (flameTemperature - ambientTemperature) * thermalTargetFactor,
    ambientTemperature,
    flameTemperature
  );
  const thermalTimeConstant = 1.0 + 8 * moistureFraction + 18 * radius;
  const oxygenTimeConstant = 0.65 + 0.05 * windSpeed;

  const params = {
    length,
    radius,
    density,
    ignitionCount,
    baseBurnRate,
    referenceRadius,
    ignitionTemperature,
    flameTemperature,
    heatOfCombustion,
    moistureFraction,
    ambientTemperature,
  };

  const derivs = (_t, state) => {
    const [, frontTemperature, oxygenFactor, ] = state;
    const derived = computeBurningDerived(state, params);

    const dFrontDistance = derived.remainingLength <= 0 ? 0 : derived.linearBurnRate;
    const dFrontTemperature = (targetFrontTemperature - frontTemperature) / thermalTimeConstant;
    const dOxygenFactor = (oxygenAvailabilityTarget - oxygenFactor) / oxygenTimeConstant;
    const dHeat = derived.heatReleaseRate;

    return [dFrontDistance, dFrontTemperature, dOxygenFactor, dHeat];
  };

  const initialFrontTemperature = ambientTemperature;
  const initialOxygenFactor = clamp(0.35 * oxygenAvailabilityTarget, 0.15, 1.0);
  const initialState = [0, initialFrontTemperature, initialOxygenFactor, 0];

  const { times, states, events, stats } = integrate({
    state0: initialState,
    derivs,
    tEnd: tMax,
    maxDt,
    rtol,
    events: [{
      name: 'burnout',
      cond: (_t, [frontDistance]) => ignitionCount * frontDistance >= length,
      terminal: true,
    }],
    onTrace,
  });

  const history = times.map((t, index) => {
    const state = states[index];
    const [frontDistance, frontTemperature, oxygenFactor, cumulativeHeat] = state;
    const derived = computeBurningDerived(state, params);
    return {
      t,
      frontDistance: Math.min(frontDistance, length / ignitionCount),
      frontTemperature,
      oxygenFactor,
      cumulativeHeat,
      burnRate: derived.linearBurnRate,
      heatReleaseRate: derived.heatReleaseRate,
      remainingLength: derived.remainingLength,
      burnedLength: derived.burnedLength,
      burnedLeft: derived.burnedLeft,
      burnedRight: derived.burnedRight,
      massRemaining: derived.massRemaining,
      frontPositions: derived.frontPositions.map((pos) => clamp(pos, 0, length)),
    };
  });

  const burnoutEvent = events.find((event) => event.name === 'burnout');
  const finalEntry = history[history.length - 1];
  const initialMass = history[0]?.massRemaining ?? 0;
  const burnoutTime = burnoutEvent?.t ?? finalEntry?.t ?? null;
  const uniformEstimate = estimateBurningStickUniformTime({
    length,
    baseBurnRate,
    ignitionCount,
  });

  return {
    history,
    times,
    states,
    events,
    summary: {
      burnout_time: burnoutTime,
      uniform_estimate_time: uniformEstimate,
      initial_mass: initialMass,
      final_mass: finalEntry?.massRemaining ?? 0,
      total_heat_released: finalEntry?.cumulativeHeat ?? 0,
      peak_front_temperature: history.reduce((max, row) => Math.max(max, row.frontTemperature), ambientTemperature),
      peak_heat_release_rate: history.reduce((max, row) => Math.max(max, row.heatReleaseRate), 0),
      average_burn_rate: burnoutTime ? length / (burnoutTime * ignitionCount) : null,
    },
    formula_trace: {
      regime: 'burning_front_numerical',
      equation: 'dx/dt = v_burn ; dT/dt = (T_target - T)/tau_T ; dλ/dt = (λ_target - λ)/tau_O2',
      integrator: `RK4 adaptive, accepted=${stats.accepted}, rejected=${stats.rejected}`,
      substitutions: {
        length,
        radius,
        density,
        moistureFraction,
        oxygenFraction,
        windSpeed,
        ambientTemperature,
        ignitionCount,
        baseBurnRate,
        referenceRadius,
        ignitionTemperature,
        flameTemperature,
        heatOfCombustion,
        oxygenAvailabilityTarget,
        targetFrontTemperature,
        thermalTimeConstant,
        oxygenTimeConstant,
        uniformEstimate,
        result_t: burnoutTime,
      },
      notes: {
        reference_temperature: refTemp,
        combustion_efficiency: COMBUSTION_EFFICIENCY,
      },
    },
  };
}
