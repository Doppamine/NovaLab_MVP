import { getDamageProfile } from './DamageSystem';
import { buildLearningFeedback } from './ExplanationSystem';
import { getZoneMultiplier, indexById } from './WireSystem';

function flipPolarity(polarity) {
  return polarity === 'positive' ? 'negative' : 'positive';
}

function getZoneMap(level) {
  return (level.zones ?? []).reduce((accumulator, zone) => {
    accumulator[zone.id] = zone;
    return accumulator;
  }, {});
}

function getWireZoneMultiplier(wire, zoneMap, simulationTick) {
  return wire.zoneIds.reduce((multiplier, zoneId) => {
    return multiplier * getZoneMultiplier(zoneMap[zoneId], simulationTick);
  }, 1);
}

function getBasicWireStatus(wire, level, simulationTick) {
  const zoneMap = getZoneMap(level);
  const damageProfile = getDamageProfile(wire, { xrayEnabled: true });
  const zoneMultiplier = getWireZoneMultiplier(wire, zoneMap, simulationTick);
  const integrityMultiplier = 1 + (100 - wire.integrity) / 150;
  const resistance = wire.baseResistance * damageProfile.resistanceMultiplier * zoneMultiplier * integrityMultiplier;

  let reason = null;
  if (!wire.state.connected) {
    reason = 'Branch disconnected';
  } else if (damageProfile.openCircuit) {
    reason = 'Open circuit due to unresolved structural damage';
  } else if (wire.material === 'fiber' && !wire.modules.converterInstalled) {
    reason = 'Fiber branch requires a converter coupler';
  } else if (wire.type === 'induction' && !wire.modules.inductionBridgeInstalled) {
    reason = 'Faraday gap requires an induction bridge';
  }

  return {
    conductive: reason === null,
    blockedReason: reason,
    damageProfile,
    effectiveResistance: resistance,
    shortRisk: damageProfile.shortRisk,
  };
}

function buildContinuityGraph(level, wireStatusMap) {
  const adjacency = {};

  level.nodes.forEach((node) => {
    adjacency[node.id] = [];
  });

  level.wires.forEach((wire) => {
    const status = wireStatusMap[wire.id];
    if (!status.conductive) {
      return;
    }

    adjacency[wire.from].push({ nodeId: wire.to, wireId: wire.id });
    adjacency[wire.to].push({ nodeId: wire.from, wireId: wire.id });
  });

  return adjacency;
}

function findReachableNodes(level, adjacency) {
  const reachable = new Set([level.sourceId]);
  const queue = [level.sourceId];

  while (queue.length) {
    const nodeId = queue.shift();

    (adjacency[nodeId] ?? []).forEach(({ nodeId: nextNodeId }) => {
      if (reachable.has(nextNodeId)) {
        return;
      }

      reachable.add(nextNodeId);
      queue.push(nextNodeId);
    });
  }

  return [...reachable];
}

function buildGateStates(level, reachableNodeIds, nodeMap) {
  const reachable = new Set(reachableNodeIds);

  return level.nodes.reduce((accumulator, node) => {
    if (node.kind === 'sequenceRelay') {
      accumulator[node.id] = {
        open: Boolean(node.state.latched),
        reason: node.state.latched ? null : `Relay ${node.label} is not latched.`,
      };
      return accumulator;
    }

    if (node.kind === 'gate') {
      const inputStates = node.inputNodeIds.map((inputId) => reachable.has(inputId) && (nodeMap[inputId].state.latched || nodeMap[inputId].kind !== 'sequenceRelay'));
      let open = true;

      if (node.gateType === 'AND') {
        open = inputStates.every(Boolean);
      } else if (node.gateType === 'OR') {
        open = inputStates.some(Boolean);
      } else if (node.gateType === 'XOR') {
        open = inputStates.filter(Boolean).length === 1;
      }

      accumulator[node.id] = {
        open,
        reason: open ? null : `${node.label} gate condition is not satisfied.`,
      };
      return accumulator;
    }

    accumulator[node.id] = { open: true, reason: null };
    return accumulator;
  }, {});
}

function buildPassableAdjacency(level, adjacency, gateStates) {
  const passable = {};

  level.nodes.forEach((node) => {
    passable[node.id] = [];
  });

  level.nodes.forEach((node) => {
    const isNodeOpen = gateStates[node.id]?.open ?? true;
    if (!isNodeOpen && node.id !== level.sourceId && node.id !== level.targetId) {
      return;
    }

    (adjacency[node.id] ?? []).forEach((edge) => {
      const nextNodeOpen = gateStates[edge.nodeId]?.open ?? true;
      if (!nextNodeOpen && edge.nodeId !== level.targetId) {
        return;
      }

      passable[node.id].push(edge);
    });
  });

  return passable;
}

function enumeratePaths(level, adjacency) {
  const paths = [];
  const maxDepth = Math.max(level.wires.length + 1, 6);

  function dfs(nodeId, visitedNodes, wireIds, nodeIds) {
    if (nodeId === level.targetId) {
      paths.push({ wireIds: [...wireIds], nodeIds: [...nodeIds] });
      return;
    }

    if (wireIds.length >= maxDepth) {
      return;
    }

    (adjacency[nodeId] ?? []).forEach((edge) => {
      if (visitedNodes.has(edge.nodeId)) {
        return;
      }

      visitedNodes.add(edge.nodeId);
      wireIds.push(edge.wireId);
      nodeIds.push(edge.nodeId);

      dfs(edge.nodeId, visitedNodes, wireIds, nodeIds);

      nodeIds.pop();
      wireIds.pop();
      visitedNodes.delete(edge.nodeId);
    });
  }

  dfs(level.sourceId, new Set([level.sourceId]), [], [level.sourceId]);

  return paths;
}

function evaluatePath(path, level, nodeMap, wireMap, wireStatusMap, gateStates) {
  const sourceNode = nodeMap[level.sourceId];
  const targetNode = nodeMap[level.targetId];
  const remainingResistanceMap = {};
  let rollingResistance = 0.1;

  [...path.wireIds].reverse().forEach((wireId) => {
    const wireStatus = wireStatusMap[wireId];
    rollingResistance += wireStatus.effectiveResistance;
    remainingResistanceMap[wireId] = rollingResistance;
  });

  let availableVoltage = sourceNode.voltage;
  let currentPolarity = sourceNode.polarity;
  const currentByWireId = {};
  const resistanceByWireId = {};
  const voltageByNodeId = {
    [sourceNode.id]: sourceNode.voltage,
  };
  const failureReasons = [];
  const overloadedWireIds = [];

  for (let index = 0; index < path.wireIds.length; index += 1) {
    const wireId = path.wireIds[index];
    const nextNodeId = path.nodeIds[index + 1];
    const wire = wireMap[wireId];
    const wireStatus = wireStatusMap[wireId];
    const nextNode = nodeMap[nextNodeId];

    if (!(gateStates[nextNodeId]?.open ?? true) && nextNodeId !== level.targetId) {
      failureReasons.push({
        code: 'gate-closed',
        message: gateStates[nextNodeId].reason,
      });
      break;
    }

    if (!wireStatus.conductive) {
      failureReasons.push({
        code: 'open-circuit',
        message: `${wire.label} is blocking current: ${wireStatus.blockedReason}.`,
      });
      break;
    }

    if (wire.modules.transformerInstalled) {
      availableVoltage = wire.modules.transformerInstalled.outputVoltage;
    }

    const remainingResistance = remainingResistanceMap[wireId] ?? wireStatus.effectiveResistance;
    const current = availableVoltage / Math.max(remainingResistance, 0.12);
    const voltageDrop = current * wireStatus.effectiveResistance;

    currentByWireId[wireId] = current;
    resistanceByWireId[wireId] = wireStatus.effectiveResistance;

    if (current > wire.currentLimit) {
      overloadedWireIds.push(wireId);
      failureReasons.push({
        code: 'wire-overload',
        message: `${wire.label} overload: ${current.toFixed(2)} A exceeds the ${wire.currentLimit.toFixed(2)} A limit.`,
      });
      break;
    }

    if (availableVoltage > wire.voltageLimit) {
      overloadedWireIds.push(wireId);
      failureReasons.push({
        code: 'wire-voltage-limit',
        message: `${wire.label} cannot accept ${availableVoltage.toFixed(2)} V. Install a transformer or choose a safer path.`,
      });
      break;
    }

    availableVoltage = Math.max(availableVoltage - voltageDrop, 0);

    if (wire.nativePolarityFlip) {
      currentPolarity = flipPolarity(currentPolarity);
    }

    if (wire.modules.inverterInstalled) {
      currentPolarity = flipPolarity(currentPolarity);
    }

    voltageByNodeId[nextNodeId] = availableVoltage;

    if (nextNode.kind === 'target') {
      if (currentPolarity !== level.target.requiredPolarity) {
        failureReasons.push({
          code: 'polarity-mismatch',
          message: `Target polarity mismatch: ${targetNode.label} expects ${level.target.requiredPolarity} current.`,
        });
      }

      if (availableVoltage < level.target.requiredVoltage.min || availableVoltage > level.target.requiredVoltage.max) {
        failureReasons.push({
          code: 'voltage-mismatch',
          message: `Target voltage mismatch: ${availableVoltage.toFixed(2)} V is outside the ${level.target.requiredVoltage.min}-${level.target.requiredVoltage.max} V window.`,
        });
      }

      if (current < level.target.currentWindow.min || current > level.target.currentWindow.max) {
        failureReasons.push({
          code: 'current-window',
          message: `Target current mismatch: ${current.toFixed(2)} A is outside the ${level.target.currentWindow.min}-${level.target.currentWindow.max} A window.`,
        });
      }

      if (current > (targetNode.currentLimit ?? Number.POSITIVE_INFINITY)) {
        failureReasons.push({
          code: 'target-overload',
          message: `${targetNode.label} overload: ${current.toFixed(2)} A exceeds the target current limit.`,
        });
      }
    }
  }

  return {
    path,
    valid: failureReasons.length === 0,
    failureReasons,
    currentByWireId,
    resistanceByWireId,
    voltageByNodeId,
    voltageAtTarget: voltageByNodeId[level.targetId] ?? 0,
    currentAtTarget: currentByWireId[path.wireIds[path.wireIds.length - 1]] ?? 0,
    overloadedWireIds,
    finalPolarity: currentPolarity,
  };
}

function chooseBestPath(evaluatedPaths) {
  if (!evaluatedPaths.length) {
    return null;
  }

  const validPath = evaluatedPaths.find((path) => path.valid);
  if (validPath) {
    return validPath;
  }

  return [...evaluatedPaths].sort((left, right) => {
    if (left.failureReasons.length !== right.failureReasons.length) {
      return left.failureReasons.length - right.failureReasons.length;
    }

    return right.voltageAtTarget - left.voltageAtTarget;
  })[0];
}

export function analyzeCircuit(level, simulationTick = 0) {
  const nodeMap = indexById(level.nodes);
  const wireMap = indexById(level.wires);
  const wireStatusMap = level.wires.reduce((accumulator, wire) => {
    accumulator[wire.id] = getBasicWireStatus(wire, level, simulationTick);
    return accumulator;
  }, {});

  const continuityGraph = buildContinuityGraph(level, wireStatusMap);
  const reachableNodeIds = findReachableNodes(level, continuityGraph);
  const gateStates = buildGateStates(level, reachableNodeIds, nodeMap);
  const passableAdjacency = buildPassableAdjacency(level, continuityGraph, gateStates);
  const candidatePaths = enumeratePaths(level, passableAdjacency);
  const evaluatedPaths = candidatePaths.map((path) =>
    evaluatePath(path, level, nodeMap, wireMap, wireStatusMap, gateStates),
  );
  const bestPath = chooseBestPath(evaluatedPaths);

  const activeWireIds = bestPath?.valid ? bestPath.path.wireIds : [];
  const activeNodeIds = bestPath?.valid ? bestPath.path.nodeIds : [];
  const overloadedWireIds = [...new Set(bestPath?.overloadedWireIds ?? [])];
  const failureReasons = bestPath?.failureReasons ?? [];
  const resistanceByWireId = bestPath?.resistanceByWireId ?? {};
  const currentByWireId = bestPath?.currentByWireId ?? {};
  const voltageByNodeId = bestPath?.voltageByNodeId ?? {};
  const hiddenFaultCount = level.wires.reduce((count, wire) => {
    const profile = getDamageProfile(wire, { xrayEnabled: false });
    return count + profile.hiddenInternal.length;
  }, 0);
  const maxResistanceWireId = Object.entries(
    bestPath?.resistanceByWireId ?? level.wires.reduce((accumulator, wire) => {
      accumulator[wire.id] = wire.baseResistance;
      return accumulator;
    }, {}),
  ).sort((left, right) => right[1] - left[1])[0]?.[0];
  const requiresPolarityFix = level.wires.some(
    (wire) => wire.nativePolarityFlip && !wire.modules.inverterInstalled,
  );
  const requiresTransformer = level.wires.some(
    (wire) => wire.allowModules.includes('transformerModule') && !wire.modules.transformerInstalled,
  );

  return {
    level,
    success: Boolean(bestPath?.valid),
    closedCircuit: Boolean(bestPath?.valid),
    xrayEnabled: level.xrayEnabled ?? false,
    continuityGraph,
    candidatePaths,
    evaluatedPaths,
    bestPath,
    reachableNodeIds,
    activeNodeIds,
    activeWireIds,
    gateStates,
    failureReasons,
    resistanceByWireId,
    currentByWireId,
    voltageByNodeId,
    overloadedWireIds,
    hiddenFaultCount,
    maxResistanceWireId,
    requiresPolarityFix,
    requiresTransformer,
    voltageAtTarget: bestPath?.voltageAtTarget ?? 0,
    currentAtTarget: bestPath?.currentAtTarget ?? 0,
    learningFeedback: buildLearningFeedback(
      {
        hiddenFaultCount,
        maxResistanceWireId,
        requiresPolarityFix,
        requiresTransformer,
      },
      level,
    ),
  };
}
