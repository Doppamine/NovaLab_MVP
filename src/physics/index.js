/**
 * NovaLab Physics — публичное API ядра.
 * Импортируем отсюда, не лезем во внутренности модулей.
 */

export {
  PHYSICAL_CONSTANTS,
  CELESTIAL_GRAVITY,
  DRAG_COEFFICIENTS,
  MATERIALS,
  COMBUSTION_MATERIALS,
  UNITS,
} from './constants.js';
export { integrate } from './integrators/rk4.js';
export { freeFallVacuum, freeFallWithDrag, runApollo15Scenario } from './modules/freeFallAirDrag.js';
export { estimateBurningStickUniformTime, simulateBurningStick } from './modules/burningStick.js';
export { simulateStuntJump, interpolateStuntJump, GRAVITY_PRESETS } from './modules/stuntJump.js';
