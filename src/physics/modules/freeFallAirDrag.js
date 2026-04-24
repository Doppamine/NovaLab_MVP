/**
 * NovaLab Physics — Модуль «Свободное падение с сопротивлением воздуха».
 *
 * Школьная формула (вакуум):
 *      h = g t² / 2        →        t = sqrt(2h / g)
 *
 * Реальная модель (квадратичное сопротивление, Ньютон):
 *      m * dv/dt = -m*g + ½ * Cd * ρ * A * v²   (вверх положительно)
 *      dy/dt = v
 *
 * Терминальная скорость:
 *      v_terminal = sqrt( 2*m*g / (Cd * ρ * A) )
 *
 * При ρ = 0 (вакуум) член сопротивления зануляется и уравнение сводится к школьному.
 * Именно это и есть «Apollo 15 момент» — та же симуляция, без магии, просто параметр.
 *
 * Область применимости:
 *  - Квадратичный закон работает при 10³ < Re < 3·10⁵ (дозвуковой турбулентный режим).
 *    Для стандартных школьных задач (яблоко, мяч, парашютист) это выполняется.
 *  - Не учитываются: вращение объекта (эффект Магнуса), сжимаемость при v > 100 м/с,
 *    изменение плотности воздуха с высотой (для высот < 1 км погрешность < 10%).
 *  - Объект считается точкой с фиксированными A и Cd (без кувыркания).
 *  Эти упрощения декларируются в сценарии в поле `assumptions`.
 *
 * Источники:
 *  - Halliday, Resnick, Walker «Fundamentals of Physics», 10th ed., §6.4.
 *  - Taylor, J.R. «Classical Mechanics», Ch.2.
 *  - NASA Glenn Research Center: Drag Equation (exploration.grc.nasa.gov).
 */

import { integrate } from '../integrators/rk4.js';

/**
 * Аналитическое решение для вакуума — чтобы не гонять интегратор зря
 * и чтобы в режиме «Объяснить» показать школьную формулу «как есть».
 */
export function freeFallVacuum({ h0, g }) {
  if (g <= 0) throw new Error('g must be positive');
  if (h0 < 0) throw new Error('h0 must be non-negative');
  const tGround = Math.sqrt((2 * h0) / g);
  const vGround = g * tGround; // |v| на земле

  // Генерируем траекторию для отрисовки (50 точек)
  const N = 50;
  const times = [];
  const states = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * tGround;
    const y = h0 - 0.5 * g * t * t;
    const v = -g * t;
    times.push(t);
    states.push([y, v]);
  }

  return {
    times,
    states,
    events: [{ name: 'impact', t: tGround, state: [0, -vGround] }],
    result: {
      fall_time: tGround,
      impact_speed: vGround,
      terminal_velocity: null, // в вакууме нет терминальной скорости
    },
    formula_trace: {
      regime: 'vacuum_analytical',
      equation: 'h = g*t^2 / 2  =>  t = sqrt(2h/g)',
      substitutions: {
        h: h0,
        g: g,
        result_t: tGround,
        result_v: vGround,
      },
    },
  };
}

/**
 * Численное решение с сопротивлением воздуха.
 * state = [y, v], где y — высота над землёй (м), v — вертикальная скорость (м/с, вверх +).
 */
export function freeFallWithDrag({
  h0,            // начальная высота, м
  v0 = 0,        // начальная скорость, м/с (вниз = отрицательная)
  mass,          // масса, кг
  Cd,            // коэффициент лобового сопротивления
  area,          // площадь миделя, м²
  rhoAir,        // плотность среды, кг/м³ (0 = вакуум)
  g,             // гравитация, м/с²
  tMax = 60,     // максимум симуляции (с)
  rtol = 1e-4,
  onTrace,
}) {
  // Валидация входных данных — никакого «молча спотыкнулись» (пункт 12.2 промта).
  if (!(mass > 0))   throw new Error('mass must be > 0');
  if (!(area >= 0))  throw new Error('area must be >= 0');
  if (!(Cd >= 0))    throw new Error('Cd must be >= 0');
  if (!(rhoAir >= 0))throw new Error('rhoAir must be >= 0');
  if (!(g > 0))      throw new Error('g must be > 0');
  if (!(h0 >= 0))    throw new Error('h0 must be >= 0');

  // Быстрая оптимизация: если ρ=0 ИЛИ Cd=0 ИЛИ A=0 — вакуум, аналитика.
  if (rhoAir === 0 || Cd === 0 || area === 0) {
    return freeFallVacuum({ h0, g });
  }

  const k = 0.5 * Cd * rhoAir * area; // коэффициент, чтобы не пересчитывать в derivs
  const vTerminal = Math.sqrt((mass * g) / k);

  const derivs = (_t, [y, v]) => {
    // dy/dt = v
    // F_drag = -½·Cd·ρ·A·v·|v|  (всегда против скорости; член v·|v| сохраняет знак)
    // m·dv/dt = -m·g - ½·Cd·ρ·A·v·|v|
    // При v<0 (падение): -(k/m)·v·|v| = -(k/m)·(-v²) = +(k/m)·v² → тормозит падение.
    // При v>0 (подъём после отскока): тот же член отрицательный → тормозит подъём. ✓
    const dvdt = -g - (k / mass) * v * Math.abs(v);
    return [v, dvdt];
  };

  const { times, states, events, stats } = integrate({
    state0: [h0, v0],
    derivs,
    tEnd: tMax,
    maxDt: 0.02,
    rtol,
    events: [{
      name: 'impact',
      cond: (_t, [y]) => y <= 0,
      terminal: true,
    }],
    onTrace,
  });

  const impact = events.find((e) => e.name === 'impact');
  const fallTime = impact ? impact.t : null;
  const impactSpeed = impact ? Math.abs(impact.state[1]) : null;

  return {
    times,
    states,
    events,
    result: {
      fall_time: fallTime,
      impact_speed: impactSpeed,
      terminal_velocity: vTerminal,
    },
    formula_trace: {
      regime: 'quadratic_drag_numerical',
      equation: 'm*dv/dt = -m*g + ½*Cd*ρ*A*v² ;    dy/dt = v',
      integrator: `RK4 adaptive, accepted=${stats.accepted}, rejected=${stats.rejected}`,
      substitutions: {
        mass, Cd, area, rhoAir, g, h0, v0,
        k_drag: k,
        v_terminal: vTerminal,
        result_t: fallTime,
        result_v: impactSpeed,
      },
    },
  };
}

/**
 * Унифицированная точка входа для сценария «Apollo 15» —
 * запускает оба объекта одновременно в одном окружении и возвращает общий результат.
 */
export function runApollo15Scenario({
  object1, object2, // каждый: { name, mass, Cd, area }
  environment,      // { rhoAir, g, h0 }
  tMax = 30,
  rtol = 1e-4,
}) {
  const r1 = freeFallWithDrag({ ...environment, ...object1, tMax, rtol });
  const r2 = freeFallWithDrag({ ...environment, ...object2, tMax, rtol });
  return {
    object1: { ...r1, name: object1.name },
    object2: { ...r2, name: object2.name },
    environment,
  };
}
