import { RAW_AETHER_LEVELS } from '../levels/aetherLevels';
import { createNode, createWire, cloneLevelEntity } from './WireSystem';

function decorateLevel(level) {
  const nodes = level.nodes.map((node) => createNode(node));
  const wires = level.wires.map((wire) => createWire(wire));

  return {
    ...level,
    nodes,
    wires,
  };
}

export const AETHER_LEVELS = RAW_AETHER_LEVELS.map(decorateLevel);

export function getLevelById(levelId) {
  return AETHER_LEVELS.find((level) => level.id === levelId) ?? AETHER_LEVELS[0];
}

export function buildRuntimeLevel(levelId) {
  const level = getLevelById(levelId);

  return {
    ...cloneLevelEntity(level),
    activeSolutionId: null,
    progress: {
      testsRun: 0,
      sequenceStep: 1,
    },
  };
}

export function getLevelOrder(levelId) {
  return AETHER_LEVELS.findIndex((level) => level.id === levelId);
}

export function getNextLevelId(levelId) {
  const currentIndex = getLevelOrder(levelId);
  const nextLevel = AETHER_LEVELS[currentIndex + 1];
  return nextLevel?.id ?? null;
}
