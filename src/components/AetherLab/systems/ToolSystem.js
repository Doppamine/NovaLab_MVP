import { repairDamage, getDamageProfile } from './DamageSystem';

export const TOOL_LIBRARY = {
  multimeter: {
    id: 'multimeter',
    label: 'Multimeter',
    hand: 'left',
    description: 'Measures voltage, current, and effective resistance.',
    targetTypes: ['wire', 'node'],
  },
  wireCutter: {
    id: 'wireCutter',
    label: 'Wire Cutter',
    hand: 'right',
    description: 'Disconnects a branch when rerouting or isolating unstable current paths.',
    targetTypes: ['wire'],
  },
  insulationTool: {
    id: 'insulationTool',
    label: 'Insulation Tool',
    hand: 'right',
    description: 'Repairs visible external damage and insulation breaches.',
    targetTypes: ['wire'],
  },
  connectorTool: {
    id: 'connectorTool',
    label: 'Connector Tool',
    hand: 'right',
    description: 'Reconnects cut conductors and installs converter or induction couplers.',
    targetTypes: ['wire', 'node'],
  },
  internalRepairTool: {
    id: 'internalRepairTool',
    label: 'Internal Repair Tool',
    hand: 'right',
    description: 'Restores hidden conductor faults after X-Ray inspection.',
    targetTypes: ['wire'],
  },
  transformerModule: {
    id: 'transformerModule',
    label: 'Transformer Module',
    hand: 'right',
    description: 'Steps voltage into the target operating window.',
    targetTypes: ['wire'],
  },
  polarityInverter: {
    id: 'polarityInverter',
    label: 'Polarity Inverter',
    hand: 'right',
    description: 'Flips charge direction on a branch.',
    targetTypes: ['wire', 'node'],
  },
  xrayScanner: {
    id: 'xrayScanner',
    label: 'X-Ray Scanner',
    hand: 'right',
    description: 'Reveals hidden conductor faults and internal microstructure.',
    targetTypes: ['wire', 'world'],
  },
};

function getMeasurementPayload({ targetType, target, analysis, nodeMap }) {
  if (targetType === 'wire') {
    const profile = getDamageProfile(target, { xrayEnabled: analysis.xrayEnabled });

    return {
      title: target.label,
      lines: [
        `Material: ${target.material}`,
        `Effective resistance: ${(analysis.resistanceByWireId[target.id] ?? target.baseResistance).toFixed(2)} ohm`,
        `Current: ${(analysis.currentByWireId[target.id] ?? 0).toFixed(2)} A`,
        `Integrity: ${target.integrity}%`,
        `Visible damage: ${profile.external.length ? profile.external.map((item) => item.label).join(', ') : 'none'}`,
        profile.hiddenInternal.length
          ? 'Internal condition: unresolved hidden fault'
          : `Internal condition: ${profile.internal.length ? profile.internal.map((item) => item.label).join(', ') : 'stable'}`,
      ],
    };
  }

  const nodeVoltage = analysis.voltageByNodeId[target.id] ?? nodeMap[analysis.level.sourceId]?.voltage ?? 0;
  return {
    title: target.label,
    lines: [
      `Node kind: ${target.kind}`,
      `Estimated voltage: ${nodeVoltage.toFixed(2)} V`,
      `Reachable from source: ${analysis.reachableNodeIds.includes(target.id) ? 'yes' : 'no'}`,
      `Active: ${analysis.activeNodeIds.includes(target.id) ? 'yes' : 'no'}`,
    ],
  };
}

function installTransformer(targetWire, level) {
  const desiredVoltage = targetWire.transformerOptions[0] ?? level.target.requiredVoltage.max;
  const nextValue =
    targetWire.modules.transformerInstalled?.outputVoltage === desiredVoltage
      ? null
      : { outputVoltage: desiredVoltage, efficiency: 0.96 };

  return {
    ...targetWire,
    modules: {
      ...targetWire.modules,
      transformerInstalled: nextValue,
    },
  };
}

export function applyToolAction({
  toolId,
  targetType,
  target,
  level,
  analysis,
  nodeMap,
  xrayEnabled,
}) {
  const tool = TOOL_LIBRARY[toolId];

  if (!tool) {
    return {
      success: false,
      message: 'Unknown tool selected.',
    };
  }

  if (!tool.targetTypes.includes(targetType)) {
    return {
      success: false,
      message: `${tool.label} cannot be used on ${targetType}.`,
    };
  }

  if (toolId === 'multimeter') {
    return {
      success: true,
      measurement: getMeasurementPayload({ targetType, target, analysis, nodeMap }),
      message: `${tool.label} measurement complete.`,
    };
  }

  if (toolId === 'xrayScanner') {
    if (targetType !== 'wire') {
      return {
        success: true,
        toggleXRay: true,
        message: xrayEnabled ? 'X-Ray overlay disabled.' : 'X-Ray overlay enabled.',
      };
    }

    return {
      success: true,
      updatedTarget: {
        ...target,
        state: {
          ...target.state,
          xrayRevealed: true,
        },
      },
      revealOnly: true,
      message: `${target.label} scanned. Internal structure now visible in X-Ray mode.`,
    };
  }

  if (targetType === 'wire' && ['insulationTool', 'connectorTool', 'internalRepairTool'].includes(toolId)) {
    const repairResult = repairDamage(target, toolId, { xrayEnabled });

    if (repairResult.success) {
      return {
        success: true,
        updatedTarget: repairResult.repairedWire,
        message: repairResult.message,
      };
    }
  }

  if (toolId === 'connectorTool' && targetType === 'wire') {
    if (target.material === 'fiber' && !target.modules.converterInstalled) {
      return {
        success: true,
        updatedTarget: {
          ...target,
          modules: {
            ...target.modules,
            converterInstalled: true,
          },
        },
        message: 'Converter coupler installed. Fiber branch can now interface with the metal network.',
      };
    }

    if (target.type === 'induction' && !target.modules.inductionBridgeInstalled) {
      return {
        success: true,
        updatedTarget: {
          ...target,
          modules: {
            ...target.modules,
            inductionBridgeInstalled: true,
          },
        },
        message: 'Induction bridge stabilized. The Faraday gap can now transmit energy wirelessly.',
      };
    }
  }

  if (toolId === 'wireCutter' && targetType === 'wire') {
    if (!target.state.connected) {
      return {
        success: true,
        updatedTarget: {
          ...target,
          state: {
            ...target.state,
            connected: true,
          },
        },
        message: `${target.label} reintroduced into the circuit path.`,
      };
    }

    return {
      success: true,
      updatedTarget: {
        ...target,
        state: {
          ...target.state,
          connected: false,
        },
      },
      message: `${target.label} disconnected to isolate the branch.`,
    };
  }

  if (toolId === 'transformerModule' && targetType === 'wire') {
    if (!target.allowModules.includes('transformerModule')) {
      return {
        success: false,
        message: 'This segment has no transformer socket. Choose a branch with a transformer pad.',
      };
    }

    return {
      success: true,
      updatedTarget: installTransformer(target, level),
      message: target.modules.transformerInstalled
        ? 'Transformer removed. Branch now passes raw source voltage again.'
        : `Transformer engaged. Output tuned toward ${target.transformerOptions[0] ?? level.target.requiredVoltage.max} V.`,
    };
  }

  if (toolId === 'polarityInverter') {
    if (targetType === 'wire') {
      if (!target.allowModules.includes('polarityInverter')) {
        return {
          success: false,
          message: 'This branch has no inverter mount.',
        };
      }

      return {
        success: true,
        updatedTarget: {
          ...target,
          modules: {
            ...target.modules,
            inverterInstalled: !target.modules.inverterInstalled,
          },
        },
        message: target.modules.inverterInstalled
          ? 'Polarity inverter removed.'
          : 'Polarity inverter mounted. Charge direction on this branch will flip.',
      };
    }

    return {
      success: true,
      nodeUpdate: {
        ...target,
        state: {
          ...target.state,
          inverted: !target.state?.inverted,
        },
      },
      message: `${target.label} inverter ${target.state?.inverted ? 'disabled' : 'enabled'}.`,
    };
  }

  return {
    success: false,
    message: `${tool.label} does not resolve the current fault profile on ${target.label}.`,
  };
}
