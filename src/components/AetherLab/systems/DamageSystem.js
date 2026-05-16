const TOOL_HINTS = {
  insulationTool: 'Surface insulation restores safety, but it cannot heal hidden conductor fractures.',
  connectorTool: 'Use a connector when the conductor is physically severed or when a coupler is needed.',
  internalRepairTool: 'Internal repairs work only after X-Ray exposes the hidden fault.',
};

export const DAMAGE_LIBRARY = {
  insulationBreak: {
    id: 'insulationBreak',
    label: 'Insulation Break',
    category: 'external',
    visible: true,
    openCircuit: false,
    shortRisk: true,
    resistanceMultiplier: 1.12,
    requiredTool: 'insulationTool',
    explanation: 'The conductor still exists, but the protective layer is broken and can arc.',
  },
  cutWire: {
    id: 'cutWire',
    label: 'Cut Wire',
    category: 'external',
    visible: true,
    openCircuit: true,
    shortRisk: false,
    resistanceMultiplier: 1,
    requiredTool: 'connectorTool',
    explanation: 'The path is physically open, so charge carriers cannot continue downstream.',
  },
  burnMarks: {
    id: 'burnMarks',
    label: 'Burn Marks',
    category: 'external',
    visible: true,
    openCircuit: false,
    shortRisk: true,
    resistanceMultiplier: 1.26,
    requiredTool: 'insulationTool',
    explanation: 'Heat damaged the surface and increases leakage risk.',
  },
  exposedMetal: {
    id: 'exposedMetal',
    label: 'Exposed Metal',
    category: 'external',
    visible: true,
    openCircuit: false,
    shortRisk: true,
    resistanceMultiplier: 1.08,
    requiredTool: 'insulationTool',
    explanation: 'The conductor is vulnerable to energy loss and accidental discharge.',
  },
  internalFracture: {
    id: 'internalFracture',
    label: 'Internal Fracture',
    category: 'internal',
    visible: false,
    xrayRequired: true,
    openCircuit: true,
    shortRisk: false,
    resistanceMultiplier: 1,
    requiredTool: 'internalRepairTool',
    explanation: 'The conductor core is broken inside the sheath, so no visual inspection can confirm the fault.',
  },
  oxidation: {
    id: 'oxidation',
    label: 'Oxidation',
    category: 'internal',
    visible: false,
    xrayRequired: true,
    openCircuit: false,
    shortRisk: false,
    resistanceMultiplier: 2.35,
    requiredTool: 'internalRepairTool',
    explanation: 'Oxidized metal narrows the conductive path and wastes voltage across the segment.',
  },
  partialConductivityLoss: {
    id: 'partialConductivityLoss',
    label: 'Partial Conductivity Loss',
    category: 'internal',
    visible: false,
    xrayRequired: true,
    openCircuit: false,
    shortRisk: false,
    resistanceMultiplier: 1.9,
    requiredTool: 'internalRepairTool',
    explanation: 'Microstructural degradation raises resistance without fully opening the circuit.',
  },
  microCracks: {
    id: 'microCracks',
    label: 'Micro-Cracks',
    category: 'internal',
    visible: false,
    xrayRequired: true,
    openCircuit: false,
    shortRisk: false,
    resistanceMultiplier: 1.65,
    requiredTool: 'internalRepairTool',
    explanation: 'Micro-cracks interrupt current paths and produce unstable conductivity.',
  },
};

function getActiveDamage(wire, category) {
  const damageIds = wire.damage?.[category] ?? [];

  return damageIds
    .filter((damageId) => !wire.repairedDamageIds.includes(damageId))
    .map((damageId) => DAMAGE_LIBRARY[damageId])
    .filter(Boolean);
}

export function getDamageProfile(wire, { xrayEnabled = false } = {}) {
  const external = getActiveDamage(wire, 'external');
  const internal = getActiveDamage(wire, 'internal');
  const internalVisible = xrayEnabled || wire.state?.xrayRevealed ? internal : [];
  const hiddenInternal = internalVisible.length ? [] : internal;
  const unresolved = [...external, ...internal];

  return {
    external,
    internal: internalVisible,
    hiddenInternal,
    unresolved,
    openCircuit: unresolved.some((damage) => damage.openCircuit),
    shortRisk: unresolved.some((damage) => damage.shortRisk),
    resistanceMultiplier: unresolved.reduce(
      (multiplier, damage) => multiplier * (damage.resistanceMultiplier ?? 1),
      1,
    ),
  };
}

export function getRepairHint(toolId) {
  return TOOL_HINTS[toolId] ?? 'That tool does not match the fault profile on this segment.';
}

export function repairDamage(wire, toolId, { xrayEnabled = false } = {}) {
  const profile = getDamageProfile(wire, { xrayEnabled });
  const nextDamage = profile.unresolved.find((damage) => {
    if (damage.requiredTool !== toolId) {
      return false;
    }

    if (damage.xrayRequired && !xrayEnabled && !wire.state?.xrayRevealed) {
      return false;
    }

    return true;
  });

  if (!nextDamage) {
    const hiddenInternal = profile.hiddenInternal.length > 0;

    return {
      success: false,
      reason: hiddenInternal
        ? 'Hidden structural issue detected. Activate X-Ray before attempting an internal repair.'
        : getRepairHint(toolId),
    };
  }

  const repairedDamageIds = [...wire.repairedDamageIds, nextDamage.id];
  const repairedWire = {
    ...wire,
    integrity: Math.min(wire.integrity + 18, 100),
    repairedDamageIds,
    isExternallyDamaged: profile.external.some((damage) => damage.id !== nextDamage.id),
    isInternallyDamaged:
      profile.hiddenInternal.some((damage) => damage.id !== nextDamage.id) ||
      profile.internal.some((damage) => damage.id !== nextDamage.id),
  };

  return {
    success: true,
    repairedWire,
    repairedDamage: nextDamage,
    message: `${nextDamage.label} repaired. ${nextDamage.explanation}`,
  };
}
