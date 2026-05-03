/**
 * NovaLab Physics — Stunt Jump (Conservation of Energy).
 *
 * Geometry:
 *   1. Starting platform at height h.
 *   2. Descent ramp (slope α) from the platform down to ground level (y = 0).
 *   3. Upward launch ramp (slope α) from ground level up to the lip at
 *      y = h_lip = L_launch · sin α.
 *   4. Projectile from the lip at angle +α with speed v_lip.
 *
 * Idealized: frictionless ramps, no air drag, point-mass car.
 *
 * Energy bookkeeping (PE referenced to the ground y = 0):
 *   - At rest on platform:   PE = m·g·h,                  KE = 0.
 *   - At descent base (y=0): PE = 0,                      KE = m·g·h.
 *   - At launch lip:         PE = m·g·h_lip,              KE = m·g·(h − h_lip).
 *   - During flight:         PE + KE = m·g·h (constant).
 *
 *   v_lip = sqrt(2·g·(h − h_lip))              ← left over after climbing the launch ramp
 *   t_air = 2·v_lip·sin α / g
 *   Range  = v_lip² · sin(2α) / g  =  2·(h − h_lip)·sin(2α)   ← g cancels
 *
 * Mass invariant: every term in PE and KE is proportional to m, so v(s),
 * trajectory, and Range are all mass-independent — the basis for the
 * "mass mystery" lesson.
 *
 * Stated assumptions (must be surfaced in UI):
 *   - Frictionless track; no rolling friction or air drag.
 *   - Descent ramp slope = launch ramp slope (symmetric V).
 *   - Landing pad top at the same height as the launch lip.
 *   - Car treated as a point mass (no rotational KE).
 */

const DEFAULT_RAMP_ANGLE_DEG = 28;
const LAUNCH_RAMP_LENGTH = 5;          // metres
const DESCENT_SAMPLE_COUNT = 25;
const LAUNCH_SAMPLE_COUNT = 14;
const AIR_SAMPLE_COUNT = 40;
const FALL_SAMPLE_COUNT = 20;
const VISUAL_CANYON_DEPTH = 30;

export const GRAVITY_PRESETS = {
  moon:    { id: 'moon',    name: 'Moon',    g: 1.62,  symbol: '🌙' },
  earth:   { id: 'earth',   name: 'Earth',   g: 9.81,  symbol: '🌍' },
  jupiter: { id: 'jupiter', name: 'Jupiter', g: 24.79, symbol: '🪐' },
};

export function simulateStuntJump({
  height,
  mass,
  gravity,
  canyonWidth,
  rampAngleDeg = DEFAULT_RAMP_ANGLE_DEG,
}) {
  if (!(height > 0))       throw new Error('height must be > 0');
  if (!(mass > 0))         throw new Error('mass must be > 0');
  if (!(gravity > 0))      throw new Error('gravity must be > 0');
  if (!(canyonWidth >= 0)) throw new Error('canyonWidth must be >= 0');

  const rampAngle = (rampAngleDeg * Math.PI) / 180;
  const sinA = Math.sin(rampAngle);
  const cosA = Math.cos(rampAngle);

  const launchRampLength = LAUNCH_RAMP_LENGTH;
  const launchLipHeight = launchRampLength * sinA;
  const launchBaseX = -launchRampLength * cosA;       // negative — to the left of lip
  // Car can only clear the launch ramp if total height exceeds the lip height
  if (height <= launchLipHeight) {
    throw new Error(`height (${height}) must exceed lip height (${launchLipHeight.toFixed(2)})`);
  }

  // Descent ramp from (descentTopX, height) down to (launchBaseX, 0).
  const descentLength = height / sinA;
  const descentTopX = launchBaseX - descentLength * cosA;

  const totalEnergy = mass * gravity * height;        // referenced to ground y = 0
  const aSlope = gravity * sinA;

  // Phase times
  const tDescent = Math.sqrt((2 * descentLength) / aSlope);  // from rest, accel = g·sinα
  const vBase = Math.sqrt(2 * gravity * height);             // speed at descent base
  const launchSpeed = Math.sqrt(2 * gravity * (height - launchLipHeight));
  const tLaunch = (vBase - launchSpeed) / aSlope;            // decelerating up the launch ramp
  const tAir = (2 * launchSpeed * sinA) / gravity;
  const range = launchSpeed * cosA * tAir;
  const cleared = range >= canyonWidth;

  const samples = [];

  // ── Descent ramp ────────────────────────────────────────────────────────
  for (let i = 0; i <= DESCENT_SAMPLE_COUNT; i++) {
    const t = (i / DESCENT_SAMPLE_COUNT) * tDescent;
    const s = 0.5 * aSlope * t * t;
    const x = descentTopX + s * cosA;
    const y = height - s * sinA;
    const v = aSlope * t;
    const ke = 0.5 * mass * v * v;
    const pe = mass * gravity * Math.max(0, y);
    samples.push({ t, x, y, v, ke, pe, phase: 'descent' });
  }

  // ── Launch ramp (climbing up) ───────────────────────────────────────────
  for (let i = 1; i <= LAUNCH_SAMPLE_COUNT; i++) {
    const tau = (i / LAUNCH_SAMPLE_COUNT) * tLaunch;
    const sLaunch = vBase * tau - 0.5 * aSlope * tau * tau; // distance up the slope
    const x = launchBaseX + sLaunch * cosA;
    const y = sLaunch * sinA;
    const v = vBase - aSlope * tau;
    const ke = 0.5 * mass * v * v;
    const pe = mass * gravity * y;
    samples.push({ t: tDescent + tau, x, y, v, ke, pe, phase: 'launch' });
  }

  // ── Airborne (lip → land at y = launchLipHeight or fly past the canyon) ─
  for (let i = 1; i <= AIR_SAMPLE_COUNT; i++) {
    const tau = (i / AIR_SAMPLE_COUNT) * tAir;
    const x = launchSpeed * cosA * tau;
    const y = launchLipHeight + launchSpeed * sinA * tau - 0.5 * gravity * tau * tau;
    const vx = launchSpeed * cosA;
    const vy = launchSpeed * sinA - gravity * tau;
    const v = Math.sqrt(vx * vx + vy * vy);
    const ke = 0.5 * mass * v * v;
    const pe = mass * gravity * Math.max(0, y);
    samples.push({ t: tDescent + tLaunch + tau, x, y, v, ke, pe, phase: 'air' });
  }

  let totalTime = tDescent + tLaunch + tAir;

  // ── Fall into canyon (only if missed the landing pad) ───────────────────
  if (!cleared) {
    // From (range, launchLipHeight) with velocity (launchSpeed·cosA, −launchSpeed·sinA)
    const c = launchSpeed * sinA;
    const tFall =
      (-c + Math.sqrt(c * c + 2 * gravity * (launchLipHeight + VISUAL_CANYON_DEPTH))) /
      gravity;
    for (let i = 1; i <= FALL_SAMPLE_COUNT; i++) {
      const tau = (i / FALL_SAMPLE_COUNT) * tFall;
      const x = range + launchSpeed * cosA * tau;
      const y = launchLipHeight - launchSpeed * sinA * tau - 0.5 * gravity * tau * tau;
      const vx = launchSpeed * cosA;
      const vy = -launchSpeed * sinA - gravity * tau;
      const v = Math.sqrt(vx * vx + vy * vy);
      const ke = 0.5 * mass * v * v;
      const pe = mass * gravity * y;
      samples.push({ t: tDescent + tLaunch + tAir + tau, x, y, v, ke, pe, phase: 'fall' });
    }
    totalTime += tFall;
  }

  return {
    // Geometry
    descentLength,
    descentTopX,
    rampAngleRad: rampAngle,
    rampAngleDeg,
    launchRampLength,
    launchBaseX,
    launchLipHeight,
    // Motion
    launchSpeed,
    tDescent,
    tLaunch,
    tAir,
    totalTime,
    range,
    cleared,
    totalEnergy,
    samples,
    formula_trace: {
      regime: 'energy_conservation_idealized',
      assumptions: [
        'frictionless track',
        'no air drag',
        'descent slope = launch slope (symmetric V)',
        'landing pad top at the launch lip height',
        'point-mass car (no rotational KE)',
      ],
      equations: [
        'PE = m·g·h',
        'KE = ½·m·v²',
        'v_lip = sqrt(2·g·(h − h_lip))     ← left after climbing the launch ramp',
        'Range = v_lip²·sin(2α)/g = 2·(h − h_lip)·sin(2α)   ← g cancels',
      ],
      substitutions: {
        m: mass,
        g: gravity,
        h: height,
        h_lip: launchLipHeight,
        alpha_deg: rampAngleDeg,
        v_lip: launchSpeed,
        t_descent: tDescent,
        t_launch: tLaunch,
        t_air: tAir,
        range,
        canyon_width: canyonWidth,
        cleared,
      },
    },
  };
}

/**
 * Linear interpolation across precomputed samples for a given absolute time.
 */
export function interpolateStuntJump(samples, t) {
  if (!samples || samples.length === 0) return null;
  if (t <= samples[0].t) return samples[0];
  if (t >= samples[samples.length - 1].t) return samples[samples.length - 1];
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const u = (t - a.t) / (b.t - a.t);
  return {
    t,
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    v: a.v + (b.v - a.v) * u,
    ke: a.ke + (b.ke - a.ke) * u,
    pe: a.pe + (b.pe - a.pe) * u,
    phase: b.phase,
  };
}
