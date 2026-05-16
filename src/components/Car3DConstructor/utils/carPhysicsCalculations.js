import {
  BATTERY_TYPES,
  BODY_TYPES,
  ENGINE_TYPES,
  G,
  LIGHT_TYPES,
  ROAD_BIOMES,
  TIRE_TYPES
} from '../data/carPhysicsData';

export function byId(collection, id) {
  return collection.find((item) => item.id === id) || collection[0];
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function safeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((safeNumber(value) + Number.EPSILON) * factor) / factor;
}

export function formatNumber(value, digits = 2) {
  const rounded = round(value, digits);
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded));
  return String(rounded);
}

export function getSelectedParts(selection) {
  return {
    body: byId(BODY_TYPES, selection.bodyType),
    engine: byId(ENGINE_TYPES, selection.engineType),
    tire: byId(TIRE_TYPES, selection.tireType),
    road: byId(ROAD_BIOMES, selection.roadBiome),
    battery: byId(BATTERY_TYPES, selection.batteryType),
    light: byId(LIGHT_TYPES, selection.lightType)
  };
}

export function calculateEffectiveMu(tire, road) {
  const modifier = tire.modifiers[road.id] ?? 1;
  return clamp(road.baseMu * modifier, 0.04, 1.35);
}

export function calculateBrakingDistance(speed, mu, bodyFactor = 1) {
  const v = Math.max(0, safeNumber(speed));
  const safeMu = Math.max(0.01, safeNumber(mu, 0.01));
  return (v * v * bodyFactor) / (2 * safeMu * G);
}

export function calculateSpeedParams(params) {
  const distance = Math.max(0, safeNumber(params.distance));
  const time = safeNumber(params.time);
  const speed = Math.max(0, safeNumber(params.speed));
  const target = params.target || 'speed';

  if (target === 'speed') {
    return {
      target,
      distance,
      time,
      speed: time > 0 ? distance / time : 0,
      invalid: time <= 0 ? 'Time must be greater than 0 to calculate speed.' : ''
    };
  }

  if (target === 'distance') {
    return {
      target,
      distance: speed * Math.max(0, time),
      time,
      speed,
      invalid: time < 0 ? 'Time cannot be negative.' : ''
    };
  }

  return {
    target,
    distance,
    time: speed > 0 ? distance / speed : 0,
    speed,
    invalid: speed <= 0 ? 'Speed must be greater than 0 to calculate time.' : ''
  };
}

export function calculateRelativeMotion(params) {
  const speedA = Math.max(0, safeNumber(params.speedA));
  const speedB = Math.max(0, safeNumber(params.speedB));
  const initialDistance = Math.max(0, safeNumber(params.initialDistance));
  const simTime = Math.max(0, safeNumber(params.simTime));
  const scenario = params.scenario || 'toward';
  const delayA = Math.max(0, safeNumber(params.delayA));
  const delayB = Math.max(0, safeNumber(params.delayB));
  const activeTimeA = Math.max(0, simTime - delayA);
  const activeTimeB = Math.max(0, simTime - delayB);

  if (scenario === 'same') {
    const relativeSpeed = Math.abs(speedA - speedB);
    const catchTime = relativeSpeed > 0 ? initialDistance / relativeSpeed : Infinity;
    const finalDistance = Math.max(0, initialDistance - relativeSpeed * Math.min(activeTimeA, activeTimeB));
    return { scenario, relativeSpeed, meetTime: catchTime, finalDistance };
  }

  if (scenario === 'away') {
    const relativeSpeed = speedA + speedB;
    const finalDistance = initialDistance + speedA * activeTimeA + speedB * activeTimeB;
    return { scenario, relativeSpeed, meetTime: Infinity, finalDistance };
  }

  const relativeSpeed = speedA + speedB;
  const meetTime = relativeSpeed > 0 ? initialDistance / relativeSpeed : Infinity;
  const finalDistance = Math.max(0, initialDistance - speedA * activeTimeA - speedB * activeTimeB);
  return { scenario, relativeSpeed, meetTime, finalDistance };
}

export function calculateElectricalState(electricityState, battery, light) {
  const voltage = Math.max(0, safeNumber(electricityState.voltage, battery.voltage));
  const resistance = Math.max(0, safeNumber(electricityState.resistance, light.resistanceOhm));
  const circuitClosed = Boolean(electricityState.circuitClosed && electricityState.wireConnected);
  const current = circuitClosed && resistance > 0 ? voltage / resistance : 0;
  const power = voltage * current;

  return {
    voltage,
    resistance,
    circuitClosed,
    current,
    power,
    invalid: resistance <= 0 ? 'Resistance must be greater than 0 for current calculation.' : ''
  };
}

export function calculateBatteryLoad(batteryState, light, selectedBattery) {
  const lightsPower = batteryState.headlightsOn ? light.powerW : 0;
  const dashboardPower = batteryState.dashboardOn ? 18 : 0;
  const screenPower = batteryState.screenOn ? 22 : 0;
  const motorControllerPower = batteryState.motorControllerOn ? 36 : 0;
  const totalPower = lightsPower + dashboardPower + screenPower + motorControllerPower;
  const availableEnergy = selectedBattery.capacityWh * clamp(safeNumber(batteryState.charge, 100), 0, 100) / 100;
  const hoursLeft = totalPower > 0 ? availableEnergy / totalPower : Infinity;

  return {
    lightsPower,
    dashboardPower,
    screenPower,
    motorControllerPower,
    totalPower,
    availableEnergy,
    hoursLeft
  };
}

export function calculateLightState(lightsState, battery, light) {
  const charge = clamp(safeNumber(lightsState.batteryCharge, battery.chargePercent), 0, 100);
  const circuitClosed = Boolean(lightsState.circuitClosed);
  const lowBeam = Boolean(lightsState.lowBeam);
  const highBeam = Boolean(lightsState.highBeam);
  const brake = Boolean(lightsState.brake);
  const turnSignal = Boolean(lightsState.turnSignal);
  const beamMultiplier = highBeam ? 1.45 : lowBeam ? 0.86 : 0;
  const activeLightPower = circuitClosed ? light.powerW * (highBeam ? 1.5 : lowBeam ? 1 : 0) : 0;
  const signalPower = circuitClosed && turnSignal ? 14 : 0;
  const brakePower = circuitClosed && brake ? 21 : 0;
  const totalPower = activeLightPower + signalPower + brakePower;
  const batteryFactor = charge <= 0 ? 0 : clamp(charge / 35, 0.18, 1);
  const brightness = circuitClosed ? clamp(light.brightness * beamMultiplier * batteryFactor, 0, 100) : 0;
  const beamMeters = circuitClosed ? light.beamMeters * beamMultiplier * batteryFactor : 0;

  return {
    charge,
    circuitClosed,
    totalPower,
    brightness,
    beamMeters
  };
}

export function calculateCarStats(selection, brakingSpeed = 20) {
  const { body, engine, tire, road, battery, light } = getSelectedParts(selection);
  const totalMass = body.mass + engine.mass + battery.mass + tire.mass * 4 + 120;
  const mu = calculateEffectiveMu(tire, road);
  const normalForce = totalMass * G;
  const frictionForce = mu * normalForce;
  const driveForce = Math.min(engine.forceN, frictionForce * 0.9);
  const isSlipping = engine.forceN > frictionForce * 0.9;
  const estimatedAcceleration = driveForce / totalMass;
  const maxSpeed = Math.max(8, engine.maxSpeed * (1 - body.dragCoefficient * 0.18) * (0.72 + mu * 0.28));
  const brakingDistance = calculateBrakingDistance(brakingSpeed, mu, body.brakingFactor);
  const movementEnergyKw = engine.energyRateKw * body.energyFactor * tire.energyFactor * (isSlipping ? 1.22 : 1);
  const lightPowerKw = light.powerW / 1000;
  const energyConsumptionKw = movementEnergyKw + lightPowerKw;
  const gripPercent = clamp((frictionForce / Math.max(engine.forceN, 1)) * 100, 0, 100);

  return {
    body,
    engine,
    tire,
    road,
    battery,
    light,
    totalMass,
    mu,
    normalForce,
    frictionForce,
    driveForce,
    isSlipping,
    estimatedAcceleration,
    maxSpeed,
    brakingDistance,
    energyConsumptionKw,
    gripPercent
  };
}

export function validateAnswer(task, rawAnswer) {
  const answer = Number(rawAnswer);
  if (!Number.isFinite(answer)) {
    return { ok: false, message: 'Enter a number before checking the answer.' };
  }

  const tolerance = task.tolerance ?? 0.1;
  const difference = Math.abs(answer - task.correctAnswer);
  if (difference <= tolerance) {
    return { ok: true, message: `Correct. ${formatNumber(task.correctAnswer)} ${task.unit}`.trim() };
  }

  if (difference <= tolerance * 3) {
    return { ok: false, message: 'Your answer is close. Check the unit or rounding.' };
  }

  return { ok: false, message: 'Not yet. Use the formula and try again.' };
}
