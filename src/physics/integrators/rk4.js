/**
 * NovaLab Physics — RK4 интегратор с адаптивным шагом.
 *
 * Классический Рунге–Кутта 4-го порядка с контролем шага по правилу Рунге
 * (сравнение одного шага dt с двумя шагами dt/2).
 *
 * Особенности:
 *  - Детерминированность: одинаковые входы → одинаковые выходы (никаких random).
 *  - Trace-buffer: логирует каждый принятый шаг для режима «Объяснить формулу»
 *    (см. раздел 8 мастер-промта — нам нужно показывать промежуточные значения).
 *  - Чистый JS без зависимостей — можно запускать в Web Worker, в Node для тестов.
 *
 * API:
 *   integrate({ state0, derivs, tEnd, maxDt, rtol, events, onTrace })
 *
 * где:
 *   state0  — начальный вектор состояния, например [y, vy].
 *   derivs  — функция (t, state) => d(state)/dt. Чистая, без сайд-эффектов.
 *   tEnd    — макс. время симуляции (секунд).
 *   maxDt   — верхняя граница шага (по умолчанию 0.05 с).
 *   rtol    — относительная точность (по умолчанию 1e-3).
 *   events  — массив объектов { name, cond(t, state), terminal }.
 *             Шаг принимается, затем проверяется условие; при cond=true
 *             шаг обрезается до точки события (бисекция) и, если terminal=true,
 *             симуляция останавливается. Например: «объект коснулся земли».
 *   onTrace — колбэк для записи каждого принятого шага (для объяснения).
 *
 * Возвращает { times, states, events: [{name, t, state}], stats }.
 *
 * Источник: Hairer, Nørsett, Wanner «Solving Ordinary Differential Equations I»,
 *           §II.4 (adaptive step control).
 */

function rk4Step(derivs, t, state, dt) {
  const n = state.length;
  const k1 = derivs(t, state);
  const s2 = new Array(n); for (let i = 0; i < n; i++) s2[i] = state[i] + 0.5 * dt * k1[i];
  const k2 = derivs(t + 0.5 * dt, s2);
  const s3 = new Array(n); for (let i = 0; i < n; i++) s3[i] = state[i] + 0.5 * dt * k2[i];
  const k3 = derivs(t + 0.5 * dt, s3);
  const s4 = new Array(n); for (let i = 0; i < n; i++) s4[i] = state[i] + dt * k3[i];
  const k4 = derivs(t + dt, s4);
  const next = new Array(n);
  for (let i = 0; i < n; i++) {
    next[i] = state[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return next;
}

/**
 * Оценка относительной ошибки между y_big (1 шаг dt) и y_small (2 шага dt/2).
 * Для RK4 точное решение ≈ y_small + (y_small − y_big) / 15.
 */
function estimateError(yBig, ySmall) {
  let maxErr = 0;
  for (let i = 0; i < yBig.length; i++) {
    const diff = Math.abs(ySmall[i] - yBig[i]);
    const scale = Math.max(Math.abs(ySmall[i]), 1e-12);
    const rel = diff / (15 * scale);
    if (rel > maxErr) maxErr = rel;
  }
  return maxErr;
}

export function integrate({
  state0,
  derivs,
  tEnd,
  maxDt = 0.05,
  minDt = 1e-6,
  rtol = 1e-3,
  events = [],
  onTrace,
}) {
  if (!Array.isArray(state0)) throw new Error('state0 must be an array');
  if (typeof derivs !== 'function') throw new Error('derivs must be a function');
  if (!(tEnd > 0)) throw new Error('tEnd must be positive');

  let t = 0;
  let state = state0.slice();
  let dt = maxDt;

  const times = [t];
  const states = [state.slice()];
  const eventLog = [];
  let accepted = 0;
  let rejected = 0;

  if (onTrace) onTrace({ t, state: state.slice(), dt, accepted: true });

  const checkEvents = (tPrev, sPrev, tNow, sNow) => {
    for (const ev of events) {
      const before = ev.cond(tPrev, sPrev);
      const after = ev.cond(tNow, sNow);
      if (!before && after) {
        // Бисекция по интервалу [tPrev, tNow] для точного момента события.
        let lo = tPrev, hi = tNow, sLo = sPrev, sHi = sNow;
        for (let k = 0; k < 30; k++) {
          const mid = 0.5 * (lo + hi);
          const dtm = mid - lo;
          const sMid = rk4Step(derivs, lo, sLo, dtm);
          if (ev.cond(mid, sMid)) { hi = mid; sHi = sMid; }
          else { lo = mid; sLo = sMid; }
          if (hi - lo < 1e-6) break;
        }
        eventLog.push({ name: ev.name, t: hi, state: sHi.slice() });
        return { t: hi, state: sHi, terminal: !!ev.terminal };
      }
    }
    return null;
  };

  while (t < tEnd) {
    if (dt > tEnd - t) dt = tEnd - t;

    // Два параллельных решения: один шаг dt и два шага dt/2 — для оценки ошибки.
    const big = rk4Step(derivs, t, state, dt);
    const mid = rk4Step(derivs, t, state, dt / 2);
    const small = rk4Step(derivs, t + dt / 2, mid, dt / 2);

    const err = estimateError(big, small);

    if (err > rtol && dt > minDt) {
      // Шаг отклоняем, уменьшаем.
      dt = Math.max(minDt, 0.9 * dt * Math.pow(rtol / Math.max(err, 1e-15), 0.2));
      rejected++;
      continue;
    }

    // Шаг принимаем. Для лучшей точности используем экстраполяцию:
    //   y_new ≈ y_small + (y_small - y_big) / 15
    const next = new Array(state.length);
    for (let i = 0; i < state.length; i++) {
      next[i] = small[i] + (small[i] - big[i]) / 15;
    }
    const tNext = t + dt;

    // Проверка событий на интервале.
    const evHit = checkEvents(t, state, tNext, next);
    if (evHit) {
      t = evHit.t;
      state = evHit.state;
      times.push(t); states.push(state.slice()); accepted++;
      if (onTrace) onTrace({ t, state: state.slice(), dt, accepted: true, event: eventLog[eventLog.length - 1].name });
      if (evHit.terminal) break;
    } else {
      t = tNext;
      state = next;
      times.push(t); states.push(state.slice()); accepted++;
      if (onTrace) onTrace({ t, state: state.slice(), dt, accepted: true });
    }

    // Адаптация шага вверх, если ошибка была существенно меньше допустимой.
    if (err > 0) {
      const factor = 0.9 * Math.pow(rtol / err, 0.2);
      dt = Math.min(maxDt, dt * Math.max(0.2, Math.min(5.0, factor)));
    } else {
      dt = maxDt;
    }
  }

  return {
    times,
    states,
    events: eventLog,
    stats: { accepted, rejected, finalDt: dt },
  };
}
