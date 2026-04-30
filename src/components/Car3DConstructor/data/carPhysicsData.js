export const G = 9.8;

export const LABS = [
  { id: 'constructor', label: 'Constructor', topic: 'Parts change physical properties' },
  { id: 'speed', label: 'Speed', topic: 'Speed, distance, and time' },
  { id: 'acceleration', label: 'Acceleration', topic: 'Force, mass, and acceleration' },
  { id: 'twoCar', label: 'Two-Car Motion', topic: 'Relative motion' },
  { id: 'friction', label: 'Friction & Tires', topic: 'Friction, normal force, and grip' },
  { id: 'braking', label: 'Braking Distance', topic: 'Stopping distance and safety' },
  { id: 'electricity', label: 'Electricity', topic: 'Current, voltage, resistance, and circuits' },
  { id: 'battery', label: 'Battery', topic: 'Power, energy, and battery drain' },
  { id: 'lights', label: 'Lights', topic: 'Power, brightness, and light direction' },
  { id: 'challenges', label: 'Tasks', topic: 'Mixed car physics challenges' }
];

export const BODY_TYPES = [
  {
    id: 'light',
    name: 'Light body',
    shortName: 'Light',
    mass: 760,
    dragCoefficient: 0.34,
    energyFactor: 0.88,
    brakingFactor: 0.92,
    stability: 62,
    color: '#4fd1c5',
    silhouette: 'compact',
    note: 'Lower mass gives faster acceleration and needs less energy.'
  },
  {
    id: 'standard',
    name: 'Standard body',
    shortName: 'Standard',
    mass: 1080,
    dragCoefficient: 0.36,
    energyFactor: 1,
    brakingFactor: 1,
    stability: 72,
    color: '#3b82f6',
    silhouette: 'sedan',
    note: 'Balanced mass, stability, and energy use.'
  },
  {
    id: 'heavy',
    name: 'Heavy body',
    shortName: 'Heavy',
    mass: 1560,
    dragCoefficient: 0.42,
    energyFactor: 1.22,
    brakingFactor: 1.1,
    stability: 82,
    color: '#64748b',
    silhouette: 'large',
    note: 'Higher mass lowers acceleration with the same engine force.'
  },
  {
    id: 'sport',
    name: 'Sport body',
    shortName: 'Sport',
    mass: 940,
    dragCoefficient: 0.24,
    energyFactor: 1.14,
    brakingFactor: 0.95,
    stability: 78,
    color: '#ef4444',
    silhouette: 'sport',
    note: 'Low drag and lower body height help it reach higher speed.'
  },
  {
    id: 'suv',
    name: 'Cargo / SUV body',
    shortName: 'SUV',
    mass: 1740,
    dragCoefficient: 0.48,
    energyFactor: 1.32,
    brakingFactor: 1.16,
    stability: 88,
    color: '#f59e0b',
    silhouette: 'suv',
    note: 'Very stable visually, but heavy and energy hungry.'
  }
];

export const ENGINE_TYPES = [
  {
    id: 'lowPower',
    name: 'Low-power motor',
    shortName: 'Low power',
    powerKw: 42,
    forceN: 1900,
    maxSpeed: 23,
    energyRateKw: 10,
    mass: 70,
    electric: false,
    color: '#93c5fd',
    note: 'Good for learning how low force limits acceleration.'
  },
  {
    id: 'standard',
    name: 'Standard motor',
    shortName: 'Standard',
    powerKw: 72,
    forceN: 3100,
    maxSpeed: 32,
    energyRateKw: 18,
    mass: 92,
    electric: false,
    color: '#38bdf8',
    note: 'Balanced force, speed, and energy use.'
  },
  {
    id: 'highPower',
    name: 'High-power motor',
    shortName: 'High power',
    powerKw: 115,
    forceN: 4800,
    maxSpeed: 42,
    energyRateKw: 31,
    mass: 122,
    electric: false,
    color: '#f97316',
    note: 'More force gives stronger acceleration but uses more energy.'
  },
  {
    id: 'electric',
    name: 'Electric motor',
    shortName: 'Electric',
    powerKw: 88,
    forceN: 4200,
    maxSpeed: 36,
    energyRateKw: 24,
    mass: 105,
    electric: true,
    color: '#22c55e',
    note: 'High low-speed force and a direct battery connection.'
  },
  {
    id: 'sport',
    name: 'Sport motor',
    shortName: 'Sport',
    powerKw: 168,
    forceN: 6500,
    maxSpeed: 55,
    energyRateKw: 44,
    mass: 145,
    electric: false,
    color: '#fb7185',
    note: 'Fastest acceleration, highest power draw.'
  }
];

export const TIRE_TYPES = [
  {
    id: 'summer',
    name: 'Summer tires',
    shortName: 'Summer',
    mass: 14,
    tread: 'shallow',
    gripBase: 0.78,
    energyFactor: 0.96,
    modifiers: {
      dryAsphalt: 1.12,
      wetAsphalt: 0.82,
      snow: 0.34,
      ice: 0.22,
      mud: 0.42,
      gravel: 0.72
    },
    note: 'Strong on dry asphalt, weak in snow and ice.'
  },
  {
    id: 'winter',
    name: 'Winter tires',
    shortName: 'Winter',
    mass: 16,
    tread: 'deep',
    gripBase: 0.84,
    energyFactor: 1.02,
    modifiers: {
      dryAsphalt: 0.94,
      wetAsphalt: 0.88,
      snow: 0.98,
      ice: 0.7,
      mud: 0.58,
      gravel: 0.78
    },
    note: 'Soft compound and deep tread improve cold-road grip.'
  },
  {
    id: 'studded',
    name: 'Studded winter tires',
    shortName: 'Studded',
    mass: 18,
    tread: 'studded',
    gripBase: 0.86,
    energyFactor: 1.08,
    modifiers: {
      dryAsphalt: 0.82,
      wetAsphalt: 0.78,
      snow: 1.05,
      ice: 1.18,
      mud: 0.55,
      gravel: 0.72
    },
    note: 'Studs bite into ice and shorten braking distance there.'
  },
  {
    id: 'velcro',
    name: 'Velcro friction winter tires',
    shortName: 'Velcro',
    mass: 17,
    tread: 'dense',
    gripBase: 0.88,
    energyFactor: 1.05,
    modifiers: {
      dryAsphalt: 0.9,
      wetAsphalt: 0.9,
      snow: 1.08,
      ice: 0.88,
      mud: 0.6,
      gravel: 0.76
    },
    note: 'Dense tread gives strong snow grip without metal studs.'
  },
  {
    id: 'offroad',
    name: 'Off-road tires',
    shortName: 'Off-road',
    mass: 24,
    tread: 'rugged',
    gripBase: 0.82,
    energyFactor: 1.16,
    modifiers: {
      dryAsphalt: 0.86,
      wetAsphalt: 0.82,
      snow: 0.76,
      ice: 0.48,
      mud: 1.22,
      gravel: 1.08
    },
    note: 'Large tread blocks work best in mud and gravel.'
  }
];

export const ROAD_BIOMES = [
  {
    id: 'dryAsphalt',
    name: 'Dry asphalt',
    shortName: 'Dry',
    baseMu: 0.92,
    color: '#242933',
    accent: '#94a3b8',
    sky: '#102033',
    texture: 'lane',
    note: 'High friction gives strong acceleration and short braking.'
  },
  {
    id: 'wetAsphalt',
    name: 'Wet asphalt',
    shortName: 'Wet',
    baseMu: 0.62,
    color: '#1f2937',
    accent: '#67e8f9',
    sky: '#123047',
    texture: 'shine',
    note: 'Water lowers friction, so stopping takes longer.'
  },
  {
    id: 'snow',
    name: 'Snow',
    shortName: 'Snow',
    baseMu: 0.36,
    color: '#e2e8f0',
    accent: '#60a5fa',
    sky: '#dbeafe',
    texture: 'snow',
    note: 'Snow needs winter-style tread for useful grip.'
  },
  {
    id: 'ice',
    name: 'Ice',
    shortName: 'Ice',
    baseMu: 0.18,
    color: '#bfdbfe',
    accent: '#38bdf8',
    sky: '#e0f2fe',
    texture: 'ice',
    note: 'Very low friction causes slipping and long braking.'
  },
  {
    id: 'mud',
    name: 'Mud',
    shortName: 'Mud',
    baseMu: 0.28,
    color: '#6b3f22',
    accent: '#f59e0b',
    sky: '#3f2f1d',
    texture: 'mud',
    note: 'Soft ground wastes energy unless the tires can dig in.'
  },
  {
    id: 'gravel',
    name: 'Gravel',
    shortName: 'Gravel',
    baseMu: 0.52,
    color: '#57534e',
    accent: '#d6d3d1',
    sky: '#292524',
    texture: 'gravel',
    note: 'Loose stones give medium grip and more rolling loss.'
  }
];

export const BATTERY_TYPES = [
  {
    id: 'low',
    name: 'Low-capacity battery',
    shortName: 'Low',
    voltage: 12,
    capacityWh: 360,
    chargePercent: 100,
    mass: 18,
    stability: 68,
    color: '#facc15',
    note: 'Light, but drains quickly with strong lights.'
  },
  {
    id: 'standard',
    name: 'Standard battery',
    shortName: 'Standard',
    voltage: 12,
    capacityWh: 600,
    chargePercent: 100,
    mass: 26,
    stability: 82,
    color: '#38bdf8',
    note: 'Good classroom baseline for power and energy tasks.'
  },
  {
    id: 'high',
    name: 'High-capacity battery',
    shortName: 'High',
    voltage: 12,
    capacityWh: 960,
    chargePercent: 100,
    mass: 38,
    stability: 94,
    color: '#22c55e',
    note: 'More stored energy, but extra mass.'
  }
];

export const LIGHT_TYPES = [
  {
    id: 'standard',
    name: 'Standard headlights',
    shortName: 'Standard',
    resistanceOhm: 3,
    currentA: 4,
    powerW: 48,
    brightness: 62,
    beamMeters: 46,
    color: '#fef3c7',
    note: 'Simple incandescent-style baseline.'
  },
  {
    id: 'led',
    name: 'LED headlights',
    shortName: 'LED',
    resistanceOhm: 6,
    currentA: 2,
    powerW: 24,
    brightness: 76,
    beamMeters: 58,
    color: '#dbeafe',
    note: 'Bright beam with lower power consumption.'
  },
  {
    id: 'highPower',
    name: 'High-power headlights',
    shortName: 'High power',
    resistanceOhm: 2,
    currentA: 6,
    powerW: 72,
    brightness: 95,
    beamMeters: 82,
    color: '#fff7ed',
    note: 'Farther beam, faster battery drain.'
  }
];

export const DEFAULT_SELECTION = {
  bodyType: 'standard',
  engineType: 'standard',
  tireType: 'winter',
  roadBiome: 'dryAsphalt',
  batteryType: 'standard',
  lightType: 'led'
};

export const LAB_TASKS = {
  constructor: [
    {
      id: 'constructor_accel_01',
      lab: 'constructor',
      title: 'Heavy body acceleration',
      condition: 'A heavy car body has mass 1560 kg. A high-power motor creates 4800 N of driving force. Find the acceleration.',
      given: { mass: '1560 kg', force: '4800 N' },
      find: 'acceleration',
      formula: 'a = F / m',
      correctAnswer: 3.08,
      unit: 'm/s^2',
      tolerance: 0.08,
      hints: [
        'Acceleration becomes smaller when the same force pushes a larger mass.',
        'Use Newton second law in the form a = F / m.',
        'Substitute force = 4800 N and mass = 1560 kg.',
        '4800 / 1560 is about 3.08.',
        'Run the visualization and compare it with a lighter body.'
      ],
      visualizationParams: { bodyType: 'heavy', engineType: 'highPower', lab: 'acceleration', mass: 1560, force: 4800 },
      explanation: 'The heavy body still accelerates, but the same force is spread over more mass.'
    },
    {
      id: 'constructor_energy_02',
      lab: 'constructor',
      title: 'Headlight working time',
      condition: 'A standard battery stores 600 Wh. LED headlights use 24 W. How many hours can they work?',
      given: { energy: '600 Wh', power: '24 W' },
      find: 'time',
      formula: 't = E / P',
      correctAnswer: 25,
      unit: 'h',
      tolerance: 0.1,
      hints: [
        'Working time depends on stored energy and power consumption.',
        'Use t = E / P.',
        'Substitute E = 600 Wh and P = 24 W.',
        '600 / 24 = 25.',
        'The battery bar drains more slowly with LED headlights.'
      ],
      visualizationParams: { batteryType: 'standard', lightType: 'led', lab: 'battery', energy: 600, power: 24 },
      explanation: 'Lower power lights let the same battery work for more time.'
    },
    {
      id: 'constructor_force_03',
      lab: 'constructor',
      title: 'Dry-road grip',
      condition: 'A 1200 kg car is on dry asphalt with friction coefficient 0.8. Find the maximum friction force.',
      given: { mass: '1200 kg', mu: '0.8', g: '9.8 m/s^2' },
      find: 'friction force',
      formula: 'F_friction = mu x m x g',
      correctAnswer: 9408,
      unit: 'N',
      tolerance: 15,
      hints: [
        'First find normal force N = m x g.',
        'Then multiply normal force by the friction coefficient.',
        'N = 1200 x 9.8 = 11760 N.',
        'F = 0.8 x 11760 = 9408 N.',
        'Higher grip means the wheels can transfer more driving force.'
      ],
      visualizationParams: { roadBiome: 'dryAsphalt', tireType: 'summer', lab: 'friction', mass: 1200, mu: 0.8, force: 3000 },
      explanation: 'A high friction coefficient gives the tires a large force limit before slipping.'
    }
  ],
  speed: [
    {
      id: 'speed_task_01',
      lab: 'speed',
      title: 'Find the car speed',
      condition: 'The car traveled 120 meters in 12 seconds. Find its speed.',
      given: { distance: '120 m', time: '12 s' },
      find: 'speed',
      formula: 'v = s / t',
      correctAnswer: 10,
      unit: 'm/s',
      tolerance: 0.1,
      hints: [
        'Speed tells how much distance is covered in one second.',
        'Use the formula v = s / t.',
        'Substitute s = 120 m and t = 12 s.',
        '120 / 12 = 10.',
        'The speedometer should show 10 m/s during the proof run.'
      ],
      visualizationParams: { lab: 'speed', target: 'speed', distance: 120, time: 12, speed: 10 },
      explanation: 'The car moves 10 meters every second, so in 12 seconds it covers 120 meters.'
    },
    {
      id: 'speed_task_02',
      lab: 'speed',
      title: 'Find distance',
      condition: 'A car moves at 10 m/s for 15 seconds. Find the distance.',
      given: { speed: '10 m/s', time: '15 s' },
      find: 'distance',
      formula: 's = v x t',
      correctAnswer: 150,
      unit: 'm',
      tolerance: 0.5,
      hints: [
        'Distance grows when speed or time grows.',
        'Use s = v x t.',
        'Substitute v = 10 m/s and t = 15 s.',
        '10 x 15 = 150.',
        'The finish marker moves to 150 m in the simulation.'
      ],
      visualizationParams: { lab: 'speed', target: 'distance', distance: 150, time: 15, speed: 10 },
      explanation: 'At 10 m/s, every second adds 10 meters of travel.'
    },
    {
      id: 'speed_task_03',
      lab: 'speed',
      title: 'Find travel time',
      condition: 'The car must drive 150 meters at 10 m/s. How much time is needed?',
      given: { distance: '150 m', speed: '10 m/s' },
      find: 'time',
      formula: 't = s / v',
      correctAnswer: 15,
      unit: 's',
      tolerance: 0.1,
      hints: [
        'Time tells how long the motion lasts.',
        'Use t = s / v.',
        'Substitute s = 150 m and v = 10 m/s.',
        '150 / 10 = 15.',
        'The timer should stop at 15 seconds when the car reaches the marker.'
      ],
      visualizationParams: { lab: 'speed', target: 'time', distance: 150, time: 15, speed: 10 },
      explanation: 'A speed of 10 m/s needs 15 seconds to cover 150 meters.'
    }
  ],
  acceleration: [
    {
      id: 'accel_task_01',
      lab: 'acceleration',
      title: 'Use Newton second law',
      condition: 'A car has mass 1000 kg. The engine creates 3000 N of force. Find acceleration.',
      given: { mass: '1000 kg', force: '3000 N' },
      find: 'acceleration',
      formula: 'a = F / m',
      correctAnswer: 3,
      unit: 'm/s^2',
      tolerance: 0.05,
      hints: [
        'Acceleration depends on force divided by mass.',
        'Use a = F / m.',
        'Substitute F = 3000 N and m = 1000 kg.',
        '3000 / 1000 = 3.',
        'The speedometer increases by about 3 m/s each second.'
      ],
      visualizationParams: { lab: 'acceleration', bodyType: 'standard', engineType: 'standard', mass: 1000, force: 3000 },
      explanation: 'The engine force changes the car speed by 3 m/s every second.'
    },
    {
      id: 'accel_task_02',
      lab: 'acceleration',
      title: 'Compare a light body',
      condition: 'A 760 kg light body is pushed by 1900 N. Find acceleration.',
      given: { mass: '760 kg', force: '1900 N' },
      find: 'acceleration',
      formula: 'a = F / m',
      correctAnswer: 2.5,
      unit: 'm/s^2',
      tolerance: 0.08,
      hints: [
        'A lighter body needs less force for the same acceleration.',
        'Use a = F / m.',
        'Substitute F = 1900 N and m = 760 kg.',
        '1900 / 760 = 2.5.',
        'Switch to a heavy body to see the acceleration drop.'
      ],
      visualizationParams: { lab: 'acceleration', bodyType: 'light', engineType: 'lowPower', mass: 760, force: 1900 },
      explanation: 'Even a low-power motor can accelerate a light body reasonably well.'
    },
    {
      id: 'accel_task_03',
      lab: 'acceleration',
      title: 'Choose enough force',
      condition: 'A 1200 kg car must accelerate at 4 m/s^2. What engine force is needed?',
      given: { mass: '1200 kg', acceleration: '4 m/s^2' },
      find: 'force',
      formula: 'F = m x a',
      correctAnswer: 4800,
      unit: 'N',
      tolerance: 20,
      hints: [
        'To find force, use the same law in another form.',
        'Use F = m x a.',
        'Substitute m = 1200 kg and a = 4 m/s^2.',
        '1200 x 4 = 4800.',
        'A high-power motor is close to this force in the constructor.'
      ],
      visualizationParams: { lab: 'acceleration', bodyType: 'standard', engineType: 'highPower', mass: 1200, force: 4800 },
      explanation: 'A stronger motor is needed because the target acceleration is high.'
    }
  ],
  twoCar: [
    {
      id: 'relative_task_01',
      lab: 'twoCar',
      title: 'Cars moving toward each other',
      condition: 'Two cars are 300 meters apart and move toward each other. Car A moves at 10 m/s, Car B at 20 m/s. When will they meet?',
      given: { distance: '300 m', speedA: '10 m/s', speedB: '20 m/s' },
      find: 'meeting time',
      formula: 't = s / (v1 + v2)',
      correctAnswer: 10,
      unit: 's',
      tolerance: 0.1,
      hints: [
        'When cars move toward each other, the gap closes by both speeds each second.',
        'Relative speed is v1 + v2.',
        'v_relative = 10 + 20 = 30 m/s.',
        't = 300 / 30 = 10.',
        'The cars should meet at the timer value of 10 seconds.'
      ],
      visualizationParams: { lab: 'twoCar', scenario: 'toward', speedA: 10, speedB: 20, initialDistance: 300, simTime: 10 },
      explanation: 'The distance shrinks by 30 meters every second, so 300 meters closes in 10 seconds.'
    },
    {
      id: 'relative_task_02',
      lab: 'twoCar',
      title: 'Same direction relative speed',
      condition: 'Car A moves at 22 m/s and Car B moves in the same direction at 14 m/s. Find the relative speed.',
      given: { speedA: '22 m/s', speedB: '14 m/s' },
      find: 'relative speed',
      formula: 'v_relative = |v1 - v2|',
      correctAnswer: 8,
      unit: 'm/s',
      tolerance: 0.1,
      hints: [
        'In the same direction, only the difference changes the gap.',
        'Use v_relative = |v1 - v2|.',
        'Substitute 22 and 14.',
        '|22 - 14| = 8.',
        'The faster car gains 8 meters each second.'
      ],
      visualizationParams: { lab: 'twoCar', scenario: 'same', speedA: 22, speedB: 14, initialDistance: 80, simTime: 8 },
      explanation: 'Because both cars move the same way, only the extra 8 m/s changes their distance.'
    },
    {
      id: 'relative_task_03',
      lab: 'twoCar',
      title: 'Distance after time',
      condition: 'Two cars start 100 m apart and move away from each other at 12 m/s and 8 m/s. What is the distance after 5 seconds?',
      given: { initialDistance: '100 m', speedA: '12 m/s', speedB: '8 m/s', time: '5 s' },
      find: 'final distance',
      formula: 's_final = s0 + (v1 + v2) x t',
      correctAnswer: 200,
      unit: 'm',
      tolerance: 0.5,
      hints: [
        'Moving away increases the gap.',
        'Add the speeds, then multiply by time.',
        'v_relative = 12 + 8 = 20 m/s.',
        's_final = 100 + 20 x 5 = 200.',
        'The distance line doubles during the proof run.'
      ],
      visualizationParams: { lab: 'twoCar', scenario: 'away', speedA: 12, speedB: 8, initialDistance: 100, simTime: 5 },
      explanation: 'The cars add 20 meters to the gap each second for 5 seconds.'
    }
  ],
  friction: [
    {
      id: 'friction_task_01',
      lab: 'friction',
      title: 'Find normal force',
      condition: 'A car has mass 1200 kg. Find the normal force on a flat road.',
      given: { mass: '1200 kg', g: '9.8 m/s^2' },
      find: 'normal force',
      formula: 'N = m x g',
      correctAnswer: 11760,
      unit: 'N',
      tolerance: 10,
      hints: [
        'On a flat road, the support force equals weight.',
        'Use N = m x g.',
        'Substitute m = 1200 kg and g = 9.8 m/s^2.',
        '1200 x 9.8 = 11760.',
        'The friction force uses this normal force next.'
      ],
      visualizationParams: { lab: 'friction', bodyType: 'standard', tireType: 'summer', roadBiome: 'dryAsphalt', mass: 1200, mu: 0.8, force: 2500 },
      explanation: 'Normal force is larger for a heavier car, so friction force can also be larger.'
    },
    {
      id: 'friction_task_02',
      lab: 'friction',
      title: 'Find friction force',
      condition: 'A car has mass 1200 kg and friction coefficient 0.4. Find friction force.',
      given: { mass: '1200 kg', mu: '0.4', g: '9.8 m/s^2' },
      find: 'friction force',
      formula: 'F_friction = mu x m x g',
      correctAnswer: 4704,
      unit: 'N',
      tolerance: 10,
      hints: [
        'Friction force equals coefficient times normal force.',
        'First calculate N = 1200 x 9.8.',
        'N = 11760 N.',
        'F = 0.4 x 11760 = 4704 N.',
        'Low friction means the grip bar cannot hold a large engine force.'
      ],
      visualizationParams: { lab: 'friction', tireType: 'summer', roadBiome: 'snow', bodyType: 'standard', mass: 1200, mu: 0.4, force: 5200 },
      explanation: 'A coefficient of 0.4 gives limited grip, so the car may slip under strong force.'
    },
    {
      id: 'friction_task_03',
      lab: 'friction',
      title: 'Choose tires for mud',
      condition: 'Off-road tires give the best grip in mud. If mud base mu is 0.28 and the off-road modifier is 1.22, what effective mu is used?',
      given: { baseMu: '0.28', tireModifier: '1.22' },
      find: 'effective friction coefficient',
      formula: 'mu_effective = mu_surface x tire_modifier',
      correctAnswer: 0.34,
      unit: '',
      tolerance: 0.02,
      hints: [
        'The surface gives a base coefficient.',
        'The tire modifies that coefficient.',
        'Multiply 0.28 by 1.22.',
        '0.28 x 1.22 = 0.3416.',
        'The mud visualization should improve when off-road tires are selected.'
      ],
      visualizationParams: { lab: 'friction', tireType: 'offroad', roadBiome: 'mud', bodyType: 'suv', mass: 1740, mu: 0.34, force: 4200 },
      explanation: 'Off-road tread raises the usable friction in mud compared with ordinary tires.'
    }
  ],
  braking: [
    {
      id: 'braking_task_01',
      lab: 'braking',
      title: 'Brake on ice',
      condition: 'The car moves at 20 m/s on ice where mu = 0.2. Find braking distance.',
      given: { speed: '20 m/s', mu: '0.2', g: '9.8 m/s^2' },
      find: 'braking distance',
      formula: 'd = v^2 / (2 x mu x g)',
      correctAnswer: 102.04,
      unit: 'm',
      tolerance: 0.8,
      hints: [
        'Braking distance grows with the square of speed.',
        'Use d = v^2 / (2 x mu x g).',
        'Substitute v = 20, mu = 0.2, g = 9.8.',
        '400 / 3.92 is about 102.',
        'The ice road should show a long stopping line.'
      ],
      visualizationParams: { lab: 'braking', initialSpeed: 20, tireType: 'studded', roadBiome: 'ice', mu: 0.2 },
      explanation: 'Low friction on ice makes the denominator small, so the stopping distance becomes long.'
    },
    {
      id: 'braking_task_02',
      lab: 'braking',
      title: 'Dry asphalt stop',
      condition: 'A car brakes from 18 m/s on dry asphalt with mu = 0.8. Find braking distance.',
      given: { speed: '18 m/s', mu: '0.8', g: '9.8 m/s^2' },
      find: 'braking distance',
      formula: 'd = v^2 / (2 x mu x g)',
      correctAnswer: 20.66,
      unit: 'm',
      tolerance: 0.4,
      hints: [
        'Square the speed before dividing.',
        'Use d = v^2 / (2 x mu x g).',
        'v^2 = 18 x 18 = 324.',
        '324 / 15.68 is about 20.7.',
        'Dry asphalt stops much sooner than ice.'
      ],
      visualizationParams: { lab: 'braking', initialSpeed: 18, tireType: 'summer', roadBiome: 'dryAsphalt', mu: 0.8 },
      explanation: 'High friction makes the braking force larger, reducing the stopping distance.'
    },
    {
      id: 'braking_task_03',
      lab: 'braking',
      title: 'Speed doubled',
      condition: 'If speed doubles from 10 m/s to 20 m/s with the same friction, how many times larger is braking distance?',
      given: { firstSpeed: '10 m/s', secondSpeed: '20 m/s' },
      find: 'distance multiplier',
      formula: 'd is proportional to v^2',
      correctAnswer: 4,
      unit: 'times',
      tolerance: 0.1,
      hints: [
        'The formula contains v squared.',
        'Compare 20^2 with 10^2.',
        '20^2 = 400 and 10^2 = 100.',
        '400 / 100 = 4.',
        'Run two braking attempts and compare the line length.'
      ],
      visualizationParams: { lab: 'braking', initialSpeed: 20, tireType: 'winter', roadBiome: 'wetAsphalt', mu: 0.6 },
      explanation: 'Doubling speed makes braking distance about four times longer.'
    }
  ],
  electricity: [
    {
      id: 'electric_task_01',
      lab: 'electricity',
      title: 'Current in a headlight',
      condition: 'The battery voltage is 12 V. The headlight resistance is 6 Ohm. Find the current.',
      given: { voltage: '12 V', resistance: '6 Ohm' },
      find: 'current',
      formula: 'I = U / R',
      correctAnswer: 2,
      unit: 'A',
      tolerance: 0.05,
      hints: [
        'Current is voltage divided by resistance.',
        'Use Ohm law: I = U / R.',
        'Substitute U = 12 V and R = 6 Ohm.',
        '12 / 6 = 2.',
        'Current particles should move only if the circuit is closed.'
      ],
      visualizationParams: { lab: 'electricity', voltage: 12, resistance: 6, circuitClosed: true, wireConnected: true },
      explanation: 'A closed 12 V circuit with 6 Ohm resistance carries 2 A of current.'
    },
    {
      id: 'electric_task_02',
      lab: 'electricity',
      title: 'Open circuit current',
      condition: 'A headlight switch is open. What current flows through that branch?',
      given: { circuit: 'open' },
      find: 'current',
      formula: 'open circuit -> I = 0',
      correctAnswer: 0,
      unit: 'A',
      tolerance: 0.01,
      hints: [
        'Charges need a complete path to move.',
        'An open switch breaks the path.',
        'With no path, there is no continuous current.',
        'The current is 0 A.',
        'The wire particles stop in the visualization.'
      ],
      visualizationParams: { lab: 'electricity', circuitClosed: false, wireConnected: true },
      explanation: 'Electric current flows only through a closed circuit.'
    },
    {
      id: 'electric_task_03',
      lab: 'electricity',
      title: 'Power from voltage and current',
      condition: 'A car screen uses 12 V and 1.5 A. Find its power.',
      given: { voltage: '12 V', current: '1.5 A' },
      find: 'power',
      formula: 'P = U x I',
      correctAnswer: 18,
      unit: 'W',
      tolerance: 0.1,
      hints: [
        'Power tells how quickly electric energy is used.',
        'Use P = U x I.',
        'Substitute U = 12 V and I = 1.5 A.',
        '12 x 1.5 = 18.',
        'More active components increase total power draw.'
      ],
      visualizationParams: { lab: 'electricity', voltage: 12, resistance: 8, circuitClosed: true, dashboardOn: true },
      explanation: 'The screen converts 18 joules of electrical energy each second.'
    }
  ],
  battery: [
    {
      id: 'battery_task_01',
      lab: 'battery',
      title: 'Headlight working time',
      condition: 'The battery has 600 Wh of energy. The headlights use 60 W. How long can they work?',
      given: { energy: '600 Wh', power: '60 W' },
      find: 'time',
      formula: 't = E / P',
      correctAnswer: 10,
      unit: 'h',
      tolerance: 0.1,
      hints: [
        'Battery time compares stored energy with power use.',
        'Use t = E / P.',
        'Substitute E = 600 Wh and P = 60 W.',
        '600 / 60 = 10.',
        'Higher-power lights drain the same battery faster.'
      ],
      visualizationParams: { lab: 'battery', batteryType: 'standard', lightType: 'highPower', headlightsOn: true, dashboardOn: false, energy: 600, power: 60 },
      explanation: 'A 60 W load can run for 10 hours from 600 Wh in this simplified model.'
    },
    {
      id: 'battery_task_02',
      lab: 'battery',
      title: 'Total power draw',
      condition: 'Headlights use 48 W and the dashboard uses 18 W. Find total power consumption.',
      given: { headlights: '48 W', dashboard: '18 W' },
      find: 'total power',
      formula: 'P_total = P1 + P2',
      correctAnswer: 66,
      unit: 'W',
      tolerance: 0.1,
      hints: [
        'Loads connected at the same time add their power use.',
        'Use P_total = P1 + P2.',
        'Substitute 48 W and 18 W.',
        '48 + 18 = 66.',
        'The active consumers list should show both loads.'
      ],
      visualizationParams: { lab: 'battery', lightType: 'standard', headlightsOn: true, dashboardOn: true, energy: 600, power: 66 },
      explanation: 'More active consumers increase total power and battery drain speed.'
    },
    {
      id: 'battery_task_03',
      lab: 'battery',
      title: 'Low power saves energy',
      condition: 'LED lights use 24 W. High-power lights use 72 W. How many times more power do high-power lights use?',
      given: { led: '24 W', highPower: '72 W' },
      find: 'power multiplier',
      formula: 'multiplier = P_high / P_led',
      correctAnswer: 3,
      unit: 'times',
      tolerance: 0.05,
      hints: [
        'Compare power values by division.',
        'Use multiplier = P_high / P_led.',
        'Substitute 72 / 24.',
        '72 / 24 = 3.',
        'The high-power setting should drain the battery faster.'
      ],
      visualizationParams: { lab: 'battery', batteryType: 'standard', lightType: 'highPower', headlightsOn: true, energy: 600, power: 72 },
      explanation: 'High-power headlights use three times the power of the LED option.'
    }
  ],
  lights: [
    {
      id: 'lights_task_01',
      lab: 'lights',
      title: 'Headlight power',
      condition: 'A headlight uses 12 V and 4 A. Find its power.',
      given: { voltage: '12 V', current: '4 A' },
      find: 'power',
      formula: 'P = U x I',
      correctAnswer: 48,
      unit: 'W',
      tolerance: 0.1,
      hints: [
        'Power is voltage times current.',
        'Use P = U x I.',
        'Substitute U = 12 V and I = 4 A.',
        '12 x 4 = 48.',
        'The light beam appears when the closed circuit powers the lamp.'
      ],
      visualizationParams: { lab: 'lights', lightType: 'standard', lowBeam: true, highBeam: false, circuitClosed: true, batteryCharge: 100, voltage: 12, current: 4 },
      explanation: 'The headlight converts 48 W of electrical power into light and heat.'
    },
    {
      id: 'lights_task_02',
      lab: 'lights',
      title: 'High beam comparison',
      condition: 'Low beam uses 24 W and high beam uses 72 W. How many times more power does high beam use?',
      given: { lowBeam: '24 W', highBeam: '72 W' },
      find: 'power multiplier',
      formula: 'multiplier = P_high / P_low',
      correctAnswer: 3,
      unit: 'times',
      tolerance: 0.05,
      hints: [
        'A farther beam uses more power in this model.',
        'Compare by dividing high beam power by low beam power.',
        'Substitute 72 / 24.',
        '72 / 24 = 3.',
        'The beam becomes longer and battery drain increases.'
      ],
      visualizationParams: { lab: 'lights', lightType: 'standard', lowBeam: false, highBeam: true, circuitClosed: true, power: 72, beamMeters: 82 },
      explanation: 'High beam shines farther because more electrical power is converted into light.'
    },
    {
      id: 'lights_task_03',
      lab: 'lights',
      title: 'Low battery brightness',
      condition: 'A lamp would have 80 brightness units at full battery. At 25 percent battery, brightness is modeled as 25 percent of full. Find brightness.',
      given: { fullBrightness: '80 units', battery: '25 percent' },
      find: 'brightness',
      formula: 'brightness = full x charge_fraction',
      correctAnswer: 20,
      unit: 'units',
      tolerance: 0.5,
      hints: [
        'Convert 25 percent into 0.25.',
        'Brightness is proportional to available battery level here.',
        'Substitute 80 x 0.25.',
        '80 x 0.25 = 20.',
        'The beam should look dim when the battery slider is low.'
      ],
      visualizationParams: { lab: 'lights', lightType: 'led', lowBeam: true, highBeam: false, circuitClosed: true, batteryCharge: 25, brightness: 20, beamMeters: 24 },
      explanation: 'A weak battery cannot keep the light at full brightness in this simplified circuit.'
    }
  ]
};

export const ALL_TASKS = Object.values(LAB_TASKS).flat();
