export const BODIES = {
  sleek: { name: 'Спорткар', mass: 800, cd: 0.28, area: 1.8, color: '#ef4444', type: 'sport' },
  boxy: { name: 'Внедорожник', mass: 1400, cd: 0.45, area: 2.8, color: '#3b82f6', type: 'suv' },
  truck: { name: 'Пикап', mass: 1800, cd: 0.55, area: 3.2, color: '#eab308', type: 'truck' }
};

export const MOTORS = {
  eco: { name: 'Эко-Двигатель V4', mass: 80, torque: 300, maxRpm: 5000 },
  sport: { name: 'Гоночный V8', mass: 150, torque: 900, maxRpm: 9000 },
  heavy: { name: 'Тяжелый V12', mass: 250, torque: 1500, maxRpm: 4000 }
};

export const WHEELS = {
  standard: { name: 'Городские 16"', mass: 15, radius: 0.35, grip: 0.8, friction: 0.015 },
  sport: { name: 'Гоночные 19"', mass: 20, radius: 0.4, grip: 1.5, friction: 0.02 },
  offroad: { name: 'Оффроуд 24"', mass: 40, radius: 0.55, grip: 1.0, friction: 0.05 }
};

export const ENVIRONMENTS = {
  asphalt: { name: 'Асфальт', friction: 1.0, color: '#333333' },
  sand: { name: 'Грунт / Песок', friction: 0.4, color: '#a1622b' },
  ice: { name: 'Лед', friction: 0.1, color: '#bae6fd' }
};