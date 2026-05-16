const THERMO_LEVELS = [
  {
    id: 'multi-material',
    index: 1,
    shortLabel: 'L1',
    kicker: 'Static Heat Balance',
    theme: 'equilibrium',
    title: 'The Multi-Material Equilibrium',
    subtitle: 'Three materials collide. One final temperature survives.',
    description:
      'A beaker holds 200 g of water at 20 °C. You drop in a 300 g steel part at 10 °C and a 400 g copper plate at 25 °C. Find the final equilibrium temperature.',
    answer: {
      label: 'Final temperature',
      unit: '°C',
      placeholder: '19.47',
      tolerancePercent: 4,
      bounds: [10, 25],
    },
    prompt: 'Find the common final temperature after the three materials touch and exchange heat.',
    hints: [
      'Every object must finish at the same final temperature.',
      'Heat gained by cold objects must equal heat lost by hot objects.',
      'The real thermal weight is m · c, not just mass.',
    ],
    aha: 'Water barely budges because its specific heat is gigantic compared with metal.',
    explain: {
      story:
        'Think of each material placing a weight on a seesaw. The weight is not just how much stuff you have. It is how hard that stuff is to heat: m · c. Water walks in carrying a ridiculous backpack.',
      bullets: [
        'Copper starts hottest, so it must lose heat.',
        'Steel starts coldest, so it must gain heat.',
        'Water sits in the middle, but its huge c value makes it dominate the balance.',
      ],
    },
    controls: [
      { path: 'bodies.water.massKg', label: 'Water mass', min: 0.05, max: 0.5, step: 0.01, unit: 'kg' },
      { path: 'bodies.water.tempC', label: 'Water temperature', min: 0, max: 60, step: 1, unit: '°C' },
      { path: 'bodies.steel.tempC', label: 'Steel temperature', min: -10, max: 50, step: 1, unit: '°C' },
      { path: 'bodies.copper.tempC', label: 'Copper temperature', min: 0, max: 80, step: 1, unit: '°C' },
    ],
    references: [
      'Heat balance in closed systems',
      'Specific heat capacity comparison: water vs common metals',
    ],
    defaultParams: {
      bodies: {
        water: { label: 'Water', massKg: 0.2, cp: 4200, tempC: 20 },
        steel: { label: 'Steel', massKg: 0.3, cp: 460, tempC: 10 },
        copper: { label: 'Copper', massKg: 0.4, cp: 390, tempC: 25 },
      },
    },
  },
  {
    id: 'teapot-air',
    index: 2,
    shortLabel: 'L2',
    kicker: 'Macro-Scale Air Heating',
    theme: 'room',
    title: 'The Catastrophic Teapot',
    subtitle: 'One kettle. One sealed room. One horrifying hypothetical kitchen.',
    description:
      'A 3-liter kettle of boiling water cools to 20 °C. Pretend every joule goes into the kitchen air. The room has floor area 6 m² and height 3 m. How much does the air heat up?',
    answer: {
      label: 'Air temperature rise',
      unit: '°C',
      placeholder: '43.4',
      tolerancePercent: 6,
      bounds: [0, 200],
    },
    prompt: 'Compute how many degrees the room air would warm if the room were perfectly sealed and every joule hit the air.',
    hints: [
      'First find the heat lost by the water.',
      'Air mass is not guessed. Build it from volume and density.',
      'Area is not volume. The room has height for a reason.',
    ],
    aha: 'The impossible kitchen becomes a trap question about assumptions: in real life walls, leaks, and objects steal the heat too.',
    explain: {
      story:
        'The kettle problem is a theatrical lie designed to teach one honest lesson: a tiny amount of trapped air has surprisingly small thermal inertia. The absurd answer is the point.',
      bullets: [
        'Water carries a huge energy budget because c for water is large and the temperature drop is enormous.',
        'The room only joins the equation after you build air mass from V = S · h and m = ρ · V.',
        'Reality saves you because kitchens are not sealed calorimeters.',
      ],
    },
    controls: [
      { path: 'water.massKg', label: 'Water mass', min: 1, max: 5, step: 0.1, unit: 'kg' },
      { path: 'room.areaM2', label: 'Room area', min: 4, max: 20, step: 0.5, unit: 'm²' },
      { path: 'room.heightM', label: 'Room height', min: 2, max: 4, step: 0.1, unit: 'm' },
      { path: 'air.densityKgM3', label: 'Air density', min: 0.9, max: 1.4, step: 0.01, unit: 'kg/m³' },
    ],
    references: [
      'Heat capacity of water and air',
      'Density of air at room conditions',
    ],
    defaultParams: {
      water: { massKg: 3, cp: 4200, startTempC: 100, endTempC: 20 },
      room: { areaM2: 6, heightM: 3 },
      air: { densityKgM3: 1.29, cp: 1000, startTempC: 20 },
    },
  },
  {
    id: 'flow-heater',
    index: 3,
    shortLabel: 'L3',
    kicker: 'Dynamic Thermodynamics',
    theme: 'pipeline',
    title: 'The Flowing Heater',
    subtitle: 'A pipe turns thermodynamics into a race between power and throughput.',
    description:
      'A 50 kW heater warms water flowing at 1 m/s through a 2 cm diameter pipe. The water goes from 15 °C to 35 °C. What fraction of the heater power is lost to the environment?',
    answer: {
      label: 'Lost heat fraction',
      unit: '%',
      placeholder: '47.2',
      tolerancePercent: 6,
      bounds: [0, 100],
    },
    prompt: 'Find how much of the 50 kW fails to enter the water stream.',
    hints: [
      'In flow problems, mass becomes mass per second.',
      'Use the pipe diameter to build area first.',
      'Useful power and lost power must add up to total power.',
    ],
    aha: 'Efficiency becomes visible when energy is counted per second instead of per object.',
    explain: {
      story:
        'A flowing system never asks “how much water do we have?” It asks “how much water passes every second?” That single shift from m to m-dot changes everything.',
      bullets: [
        'The water stream absorbs only the useful fraction of the heater output.',
        'Mass flow grows linearly with speed and with pipe area.',
        'If you slow the flow too much, each kilogram gets a larger bite of energy and the pipe can creep toward boiling.',
      ],
    },
    controls: [
      { path: 'flow.velocityMs', label: 'Flow speed', min: 0.2, max: 2.5, step: 0.05, unit: 'm/s' },
      { path: 'flow.diameterM', label: 'Pipe diameter', min: 0.01, max: 0.05, step: 0.001, unit: 'm' },
      { path: 'heater.powerW', label: 'Heater power', min: 10000, max: 80000, step: 500, unit: 'W' },
      { path: 'flow.outletTempC', label: 'Outlet temperature', min: 20, max: 90, step: 1, unit: '°C' },
    ],
    references: [
      'Specific heat of water',
      'Mass flow rate in cylindrical pipes',
    ],
    defaultParams: {
      heater: { powerW: 50000 },
      flow: {
        velocityMs: 1,
        diameterM: 0.02,
        densityKgM3: 1000,
        cp: 4200,
        inletTempC: 15,
        outletTempC: 35,
      },
      environment: { tempC: 20 },
    },
  },
];

function cloneLevelParams(levelId) {
  const level = THERMO_LEVELS.find((entry) => entry.id === levelId);
  return JSON.parse(JSON.stringify(level?.defaultParams ?? {}));
}

function buildInitialParamMap() {
  return Object.fromEntries(THERMO_LEVELS.map((level) => [level.id, cloneLevelParams(level.id)]));
}

function getThermoLevelById(levelId) {
  return THERMO_LEVELS.find((level) => level.id === levelId) ?? THERMO_LEVELS[0];
}

export { THERMO_LEVELS, buildInitialParamMap, cloneLevelParams, getThermoLevelById };
