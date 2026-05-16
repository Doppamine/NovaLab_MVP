const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const MATERIAL_LIBRARY = {
  copper: {
    id: 'copper',
    label: 'Copper',
    color: '#e78c43',
    resistanceFactor: 1,
    voltageLimit: 18,
    currentLimit: 9,
    conductivity: 'high',
    learningNote: 'Copper provides low resistance and stable conductivity for standard classroom circuits.',
  },
  aluminum: {
    id: 'aluminum',
    label: 'Aluminum',
    color: '#9fb6d1',
    resistanceFactor: 1.45,
    voltageLimit: 16,
    currentLimit: 7,
    conductivity: 'medium',
    learningNote: 'Aluminum is lighter, but its higher resistance wastes more energy as heat.',
  },
  superconductor: {
    id: 'superconductor',
    label: 'Superconductor',
    color: '#71faff',
    resistanceFactor: 0.02,
    voltageLimit: 26,
    currentLimit: 14,
    conductivity: 'ideal',
    learningNote: 'Superconductors let current pass with almost no resistive loss.',
  },
  fiber: {
    id: 'fiber',
    label: 'Fiber',
    color: '#b47cff',
    resistanceFactor: 1.1,
    voltageLimit: 12,
    currentLimit: 5,
    conductivity: 'signal',
    learningNote: 'Fiber routes bio-electric signals but requires a converter when linked to metal circuits.',
  },
};

export const NODE_KINDS = {
  source: 'source',
  junction: 'junction',
  target: 'target',
  sequenceRelay: 'sequenceRelay',
  gate: 'gate',
  inverterPad: 'inverterPad',
  transformerPad: 'transformerPad',
  converterPad: 'converterPad',
  dynamicNode: 'dynamicNode',
};

export function createNode(config) {
  return {
    id: config.id,
    label: config.label ?? config.id,
    kind: config.kind ?? NODE_KINDS.junction,
    description: config.description ?? '',
    position: config.position ?? [0, 0, 0],
    voltage: config.voltage ?? 0,
    polarity: config.polarity ?? 'positive',
    maxVoltage: config.maxVoltage ?? null,
    minVoltage: config.minVoltage ?? null,
    currentLimit: config.currentLimit ?? null,
    gateType: config.gateType ?? null,
    inputNodeIds: config.inputNodeIds ?? [],
    sequenceIndex: config.sequenceIndex ?? null,
    dynamicProfile: config.dynamicProfile ?? null,
    supportsTools: config.supportsTools ?? [],
    state: {
      latched: false,
      reachable: false,
      active: false,
      overloaded: false,
      ...config.state,
    },
  };
}

export function estimateResistance({ material, length = 1, resistance }) {
  if (Number.isFinite(resistance)) {
    return resistance;
  }

  const materialDef = MATERIAL_LIBRARY[material] ?? MATERIAL_LIBRARY.copper;
  return Number((length * materialDef.resistanceFactor).toFixed(2));
}

export function createWire(config) {
  const materialDef = MATERIAL_LIBRARY[config.material] ?? MATERIAL_LIBRARY.copper;
  const resistance = estimateResistance({
    material: config.material,
    length: config.length,
    resistance: config.resistance,
  });

  return {
    id: config.id,
    label: config.label ?? config.id,
    from: config.from,
    to: config.to,
    material: config.material ?? 'copper',
    type: config.type ?? 'standard',
    resistance,
    baseResistance: resistance,
    voltageLimit: config.voltageLimit ?? materialDef.voltageLimit,
    currentLimit: config.currentLimit ?? materialDef.currentLimit,
    polarity: config.polarity ?? 'bidirectional',
    integrity: clamp(config.integrity ?? 100, 0, 100),
    isExternallyDamaged: Boolean(config.damage?.external?.length),
    isInternallyDamaged: Boolean(config.damage?.internal?.length),
    allowModules: config.allowModules ?? [],
    transformerOptions: config.transformerOptions ?? [],
    nativePolarityFlip: Boolean(config.nativePolarityFlip),
    zoneIds: config.zoneIds ?? [],
    curve: config.curve ?? [],
    damage: {
      external: config.damage?.external ?? [],
      internal: config.damage?.internal ?? [],
    },
    repairedDamageIds: config.repairedDamageIds ?? [],
    modules: {
      transformerInstalled: config.modules?.transformerInstalled ?? null,
      inverterInstalled: Boolean(config.modules?.inverterInstalled),
      converterInstalled: Boolean(config.modules?.converterInstalled),
      inductionBridgeInstalled: Boolean(config.modules?.inductionBridgeInstalled),
    },
    state: {
      connected: config.state?.connected ?? true,
      xrayRevealed: Boolean(config.state?.xrayRevealed),
      measured: false,
      active: false,
      overloaded: false,
      ...config.state,
    },
  };
}

export function getZoneMultiplier(zone, simulationTick = 0) {
  if (!zone) {
    return 1;
  }

  if (zone.type === 'instability') {
    return zone.multiplier ?? 1.35;
  }

  if (zone.type === 'oscillation') {
    const amplitude = zone.amplitude ?? 0.18;
    const speed = zone.speed ?? 0.65;
    return 1 + Math.sin(simulationTick * speed) * amplitude;
  }

  return 1;
}

export function getWireVisualProfile(wire, analysis, xrayEnabled) {
  const isActive = analysis.activeWireIds.includes(wire.id);
  const isOverloaded = analysis.overloadedWireIds.includes(wire.id);
  const resistance = analysis.resistanceByWireId[wire.id] ?? wire.baseResistance;
  const current = analysis.currentByWireId[wire.id] ?? 0;
  const heat = clamp(current / Math.max(wire.currentLimit || 1, 1), 0, 2);

  return {
    isActive,
    isOverloaded,
    resistance,
    current,
    opacity: xrayEnabled ? 0.32 : 0.95,
    emissiveIntensity: isActive ? 1.4 : 0.18,
    pulseIntensity: isOverloaded ? 1.9 : heat,
  };
}

export function cloneLevelEntity(entity) {
  return structuredClone(entity);
}

export function indexById(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {});
}
