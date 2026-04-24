/**
 * NovaLab Physics — Каталог физических констант.
 *
 * ВСЕ значения в СИ. ВСЕ значения имеют источник.
 * Конвертация в удобные для UI единицы (см, г, °C, кПа) — ТОЛЬКО на слое отображения.
 *
 * Источники:
 *  - CODATA 2018: https://physics.nist.gov/cuu/Constants/
 *  - NIST Chemistry WebBook: https://webbook.nist.gov/chemistry/
 *  - CRC Handbook of Chemistry and Physics, 102nd ed.
 *  - US Standard Atmosphere 1976
 *
 * Любое добавление — с указанием источника в поле `source`.
 */

export const PHYSICAL_CONSTANTS = {
  // --- Универсальные ---
  g_standard: {
    value: 9.80665, unit: 'm/s^2',
    source: 'CODATA, standard gravity',
    note: 'Стандартное ускорение свободного падения на поверхности Земли.',
  },
  G_gravitational: {
    value: 6.6743e-11, unit: 'N*m^2/kg^2',
    source: 'CODATA 2018',
  },
  c_light: {
    value: 299792458, unit: 'm/s',
    source: 'Exact by SI definition (1983)',
  },
  R_gas: {
    value: 8.314462618, unit: 'J/(mol*K)',
    source: 'CODATA 2018, exact',
  },
  k_Boltzmann: {
    value: 1.380649e-23, unit: 'J/K',
    source: 'SI 2019, exact',
  },
  N_Avogadro: {
    value: 6.02214076e23, unit: '1/mol',
    source: 'SI 2019, exact',
  },
  sigma_StefanBoltzmann: {
    value: 5.670374419e-8, unit: 'W/(m^2*K^4)',
    source: 'CODATA 2018',
  },

  // --- Воздух и атмосфера ---
  rho_air_sea_level: {
    value: 1.225, unit: 'kg/m^3',
    source: 'US Standard Atmosphere 1976, 15°C / 101325 Pa',
    note: 'Плотность воздуха на уровне моря при стандартных условиях.',
  },
  rho_air_20C: {
    value: 1.204, unit: 'kg/m^3',
    source: 'NIST, 20°C / 101325 Pa',
  },
  nu_air_20C: {
    value: 1.516e-5, unit: 'm^2/s',
    source: 'NIST, kinematic viscosity at 20°C',
  },
  p_atm_sea_level: {
    value: 101325, unit: 'Pa',
    source: 'Exact by definition (standard atmosphere)',
  },
  oxygen_fraction_air: {
    value: 0.2095, unit: '1',
    source: 'NOAA Earth atmosphere composition (dry air, sea level)',
    note: 'Объёмная доля кислорода в обычном земном воздухе.',
  },
  T_room_standard: {
    value: 293.15, unit: 'K',
    source: 'NIST reference room temperature (20 C)',
  },
};

/**
 * Гравитация небесных тел (м/с²) — для сценариев «а что если уронить на Луне?».
 * Все значения — средние поверхностные значения.
 */
export const CELESTIAL_GRAVITY = {
  Earth:   { g: 9.80665, source: 'CODATA standard' },
  Moon:    { g: 1.625,   source: 'NASA Moon Fact Sheet' },
  Mars:    { g: 3.71,    source: 'NASA Mars Fact Sheet' },
  Jupiter: { g: 24.79,   source: 'NASA Jupiter Fact Sheet (1 bar level)' },
  Sun:     { g: 274.0,   source: 'NASA Sun Fact Sheet (photosphere)' },
  Pluto:   { g: 0.62,    source: 'NASA Pluto Fact Sheet' },
  Vacuum:  { g: 9.80665, source: 'Earth gravity, but no atmosphere' },
};

/**
 * Коэффициенты аэродинамического сопротивления Cd для типовых форм.
 * Безразмерные, зависят от числа Рейнольдса — здесь приведены «школьные» средние
 * для диапазона Re ~ 10^4 … 10^6 (что покрывает обычные падения).
 *
 * Источник: Hoerner, S.F. "Fluid-Dynamic Drag" (1965), глава 3;
 *           Anderson, J.D. "Fundamentals of Aerodynamics".
 */
export const DRAG_COEFFICIENTS = {
  sphere_smooth:        { Cd: 0.47, source: 'Hoerner, smooth sphere, Re~10^5' },
  cube:                 { Cd: 1.05, source: 'Hoerner, flat-on cube' },
  feather:              { Cd: 1.80, source: 'Approximation: flat plate + flexible edges' },
  hammer_claw:          { Cd: 1.10, source: 'Approximation: irregular body, Apollo 15 demo' },
  skydiver_belly:       { Cd: 1.00, source: 'Belly-to-earth free fall position' },
  skydiver_headfirst:   { Cd: 0.70, source: 'Head-first (tracking) position' },
  parachute_round:      { Cd: 1.40, source: 'Classical round parachute' },
  car_modern:           { Cd: 0.30, source: 'Modern sedan average' },
  raindrop:             { Cd: 0.55, source: 'Large raindrop, terminal' },
};

/**
 * Пресеты материалов — минимальный набор для первых сценариев.
 * Каждый материал хранит плотность в кг/м³ и ссылку на источник.
 */
export const MATERIALS = {
  steel:       { density: 7850, source: 'CRC Handbook, structural steel' },
  aluminum:    { density: 2700, source: 'CRC Handbook' },
  wood_pine:   { density: 510,  source: 'FPL Wood Handbook, dry pine' },
  lead:        { density: 11340, source: 'CRC Handbook' },
  rubber:      { density: 1100, source: 'CRC Handbook, vulcanized rubber' },
  feather:     { density: 80,   source: 'Approximation: bird contour feather (effective)' },
  hammer_apollo_15: {
    // Молоток из демонстрации Apollo 15 (Дэвид Скотт)
    // Масса 1.32 кг по данным NASA; для симуляции используем как эффективный объект.
    density: 7850, // сталь
    mass: 1.32,
    source: 'NASA Apollo 15 Mission Report, "Galileo experiment" demo',
  },
  falcon_feather_apollo_15: {
    // Перо сокола из той же демонстрации. Масса ~0.03 кг.
    density: 80,
    mass: 0.03,
    source: 'NASA Apollo 15 Mission Report, "Galileo experiment" demo',
  },
};

/**
 * Пресеты для учебных задач по горению.
 * Значения скорости — эффективные скорости распространения фронта вдоль тонкой палочки
 * в открытом воздухе; это не «фундаментальная константа», а калиброванный инженерный
 * параметр для детерминированной учебной модели.
 */
export const COMBUSTION_MATERIALS = {
  pine_stick: {
    label: 'Сосновая палочка',
    density: MATERIALS.wood_pine.density,
    base_linear_burn_rate: 0.0048, // м/с при reference-условиях
    reference_radius: 0.008,       // м
    ignition_temperature: 573.15,  // K, ~300 C
    flame_temperature: 1110,       // K, эффективная температура фронта
    heat_of_combustion: 16.0e6,    // Дж/кг
    source: 'NovaLab calibration on top of CRC wood density + classroom combustion benchmark',
  },
  bamboo_stick: {
    label: 'Бамбуковая шпажка',
    density: 700,
    base_linear_burn_rate: 0.0040,
    reference_radius: 0.007,
    ignition_temperature: 588.15,
    flame_temperature: 1140,
    heat_of_combustion: 17.2e6,
    source: 'NovaLab calibration for dry bamboo skewer under open-air burn',
  },
  oak_stick: {
    label: 'Дубовая рейка',
    density: 750,
    base_linear_burn_rate: 0.0033,
    reference_radius: 0.009,
    ignition_temperature: 603.15,
    flame_temperature: 1090,
    heat_of_combustion: 15.5e6,
    source: 'NovaLab calibration for dense hardwood sample under open-air burn',
  },
};

/**
 * Конвертеры единиц (UI <-> СИ).
 * ВАЖНО: движок работает ТОЛЬКО в СИ. Эти функции — исключительно для слоя UI.
 */
export const UNITS = {
  cm_to_m: (cm) => cm / 100,
  m_to_cm: (m) => m * 100,
  g_to_kg: (g) => g / 1000,
  kg_to_g: (kg) => kg * 1000,
  celsius_to_kelvin: (c) => c + 273.15,
  kelvin_to_celsius: (k) => k - 273.15,
  kmh_to_ms: (kmh) => kmh / 3.6,
  ms_to_kmh: (ms) => ms * 3.6,
};
