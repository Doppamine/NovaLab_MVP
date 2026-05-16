/**
 * NovaLab Physics — Drag Race (Newton's 2nd Law, F = m·a).
 *
 * Two cars start from rest. Each has a constant engine force F and mass m.
 * Acceleration is constant: a = F / m. The first to cross the finish line wins.
 *
 *   x(t) = ½·a·t²        v(t) = a·t        t_finish = sqrt(2·d / a)
 *
 * The pedagogy hinges on the fact that scaling F and m by the SAME factor
 * leaves a unchanged — a heavier truck with a beefier engine ties a light car
 * with a smaller engine when F/m is equal. This is the predict-first trick.
 *
 * Stated assumptions (must be surfaced in UI):
 *   - Constant engine force (no torque curve, no gear shifting).
 *   - No friction or air drag (the simplification makes F = m·a clean).
 *   - Cars start from rest, motion is one-dimensional.
 */

const SAMPLE_DT = 0.05;        // seconds between trajectory samples
const MAX_SIM_TIME = 30;       // safety cap so a tiny acceleration can't run forever
const TIE_THRESHOLD_S = 0.05;  // finish times within this many seconds → tie

export function simulateDragRace({ carA, carB, trackLength }) {
  if (!(carA?.force > 0))   throw new Error('carA.force must be > 0');
  if (!(carA?.mass > 0))    throw new Error('carA.mass must be > 0');
  if (!(carB?.force > 0))   throw new Error('carB.force must be > 0');
  if (!(carB?.mass > 0))    throw new Error('carB.mass must be > 0');
  if (!(trackLength > 0))   throw new Error('trackLength must be > 0');

  const aA = carA.force / carA.mass;
  const aB = carB.force / carB.mass;

  const tA_finish = Math.sqrt((2 * trackLength) / aA);
  const tB_finish = Math.sqrt((2 * trackLength) / aB);

  const totalTime = Math.min(MAX_SIM_TIME, Math.max(tA_finish, tB_finish));

  const samples = [];
  for (let t = 0; t <= totalTime + SAMPLE_DT * 0.5; t += SAMPLE_DT) {
    const tA = Math.min(t, tA_finish);
    const tB = Math.min(t, tB_finish);
    const xA = 0.5 * aA * tA * tA;
    const xB = 0.5 * aB * tB * tB;
    const vA = aA * tA;
    const vB = aB * tB;
    samples.push({ t, xA, xB, vA, vB });
  }

  let winner;
  if (Math.abs(tA_finish - tB_finish) < TIE_THRESHOLD_S) {
    winner = 'tie';
  } else {
    winner = tA_finish < tB_finish ? 'A' : 'B';
  }

  return {
    aA,
    aB,
    tA_finish,
    tB_finish,
    totalTime,
    trackLength,
    samples,
    winner,
    formula_trace: {
      regime: 'newton_2nd_constant_force',
      assumptions: [
        'constant engine force (no torque curve, no shifting)',
        'no friction or air drag',
        'cars start from rest',
        'one-dimensional motion',
      ],
      equations: [
        'a = F / m',
        'x(t) = ½·a·t²',
        'v(t) = a·t',
        't_finish = sqrt(2·d/a)',
      ],
      substitutions: {
        FA: carA.force, mA: carA.mass, aA, tA_finish,
        FB: carB.force, mB: carB.mass, aB, tB_finish,
        trackLength, winner,
      },
    },
  };
}

/** Linear interpolation across precomputed samples for a given absolute time. */
export function interpolateDragRace(samples, t) {
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
    xA: a.xA + (b.xA - a.xA) * u,
    xB: a.xB + (b.xB - a.xB) * u,
    vA: a.vA + (b.vA - a.vA) * u,
    vB: a.vB + (b.vB - a.vB) * u,
  };
}
