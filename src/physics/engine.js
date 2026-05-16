// Константы NIST/CODATA
export const CONSTANTS = {
  g: 9.80665,
  rho_air: 1.204, // при 20 C, 1 атм
};

// Классический интегратор Рунге-Кутты 4-го порядка (RK4)
export function rungeKutta4(state, t, dt, derivativesFunc) {
  const k1 = derivativesFunc(state, t);
  const k2 = derivativesFunc(
    Object.fromEntries(Object.entries(state).map(([k, v]) => [k, v + 0.5 * dt * k1[k]])),
    t + 0.5 * dt
  );
  const k3 = derivativesFunc(
    Object.fromEntries(Object.entries(state).map(([k, v]) => [k, v + 0.5 * dt * k2[k]])),
    t + 0.5 * dt
  );
  const k4 = derivativesFunc(
    Object.fromEntries(Object.entries(state).map(([k, v]) => [k, v + dt * k3[k]])),
    t + dt
  );

  const nextState = {};
  for (let key in state) {
    nextState[key] = state[key] + (dt / 6) * (k1[key] + 2 * k2[key] + 2 * k3[key] + k4[key]);
  }
  return nextState;
}

// Модель: Свободное падение с квадратичным сопротивлением
export function freeFallModel(state, params) {
  return (currentState, t) => {
    const { y, v } = currentState;
    const { m, Cd, A, rho } = params;

    // F_drag = 1/2 * rho * v^2 * Cd * A * sign(v)
    const F_drag = 0.5 * rho * (v * v) * Cd * A * Math.sign(v);
    const F_gravity = -m * CONSTANTS.g;
    
    const F_net = F_gravity + F_drag; // Вектор вверх положительный, гравитация тянет вниз

    return {
      y: v,               // dy/dt = v
      v: F_net / m        // dv/dt = a = F/m
    };
  };
}