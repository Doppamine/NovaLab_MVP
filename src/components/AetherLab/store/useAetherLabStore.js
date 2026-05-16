import { create } from 'zustand';
import { analyzeCircuit } from '../systems/CircuitEngine';
import { buildPostLevelAnalysis, explainCircuitFailure } from '../systems/ExplanationSystem';
import { AETHER_LEVELS, buildRuntimeLevel, getNextLevelId } from '../systems/LevelManager';
import { applyToolAction, TOOL_LIBRARY } from '../systems/ToolSystem';
import { createInitialInteractionState } from '../systems/XRInteractionSystem';

const DEFAULT_LEVEL_ID = AETHER_LEVELS[0].id;
const MAX_FEEDBACK_ITEMS = 8;
const MAX_LOG_ITEMS = 20;

function createFeedbackEntry(message, tone = 'info') {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    tone,
    message,
  };
}

function setWire(level, updatedWire) {
  return {
    ...level,
    wires: level.wires.map((wire) => (wire.id === updatedWire.id ? updatedWire : wire)),
  };
}

function setNode(level, updatedNode) {
  return {
    ...level,
    nodes: level.nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
  };
}

function rebuildAnalysis(level, simulationTick) {
  return analyzeCircuit(level, simulationTick);
}

function createLevelState(levelId) {
  const level = buildRuntimeLevel(levelId);
  level.xrayEnabled = false;

  return {
    level,
    simulationTick: 0,
    lastSimulationCommit: 0,
    analysis: rebuildAnalysis(level, 0),
    levelComplete: false,
    postLevelAnalysis: null,
    selectedEntity: null,
    measurement: null,
    actionLog: [],
    mistakes: [],
    feedback: [createFeedbackEntry(level.objectiveText)],
  };
}

function appendLog(items, nextItem) {
  return [nextItem, ...items].slice(0, MAX_LOG_ITEMS);
}

function appendFeedback(items, nextItem) {
  return [nextItem, ...items].slice(0, MAX_FEEDBACK_ITEMS);
}

function markMistake(mistakes, message) {
  if (!message) {
    return mistakes;
  }

  return [message, ...mistakes].slice(0, MAX_LOG_ITEMS);
}

function tryLatchRelay(level, analysis, nodeId) {
  const relay = level.nodes.find((node) => node.id === nodeId);

  if (!relay) {
    return {
      success: false,
      message: 'Relay not found.',
    };
  }

  if (!analysis.reachableNodeIds.includes(nodeId)) {
    return {
      success: false,
      message: `${relay.label} is not energized yet. Power must reach the relay before it can latch.`,
    };
  }

  if (relay.state.latched) {
    return {
      success: true,
      level,
      message: `${relay.label} is already latched.`,
    };
  }

  const expectedStep = level.progress.sequenceStep;

  if (relay.sequenceIndex !== expectedStep) {
    return {
      success: false,
      message: `Sequence error: expected relay ${expectedStep}, but ${relay.label} was activated instead.`,
    };
  }

  const nextLevel = {
    ...level,
    nodes: level.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            state: {
              ...node.state,
              latched: true,
            },
          }
        : node,
    ),
    progress: {
      ...level.progress,
      sequenceStep: expectedStep + 1,
    },
  };

  return {
    success: true,
    level: nextLevel,
    message: `${relay.label} latched successfully.`,
  };
}

export const useAetherLabStore = create((set, get) => ({
  activeToolId: 'multimeter',
  interaction: createInitialInteractionState(),
  ...createLevelState(DEFAULT_LEVEL_ID),

  selectTool: (toolId) => {
    set((state) => ({
      activeToolId: toolId,
      interaction: {
        ...state.interaction,
        selectedEntity: state.selectedEntity,
      },
    }));
  },

  loadLevel: (levelId) => {
    set(() => createLevelState(levelId));
  },

  resetLevel: () => {
    const { level } = get();
    set(() => createLevelState(level.id));
  },

  nextLevel: () => {
    const { level } = get();
    const nextLevelId = getNextLevelId(level.id);

    if (!nextLevelId) {
      return;
    }

    set(() => createLevelState(nextLevelId));
  },

  toggleXRay: (nextValue) => {
    set((state) => {
      const xrayEnabled = typeof nextValue === 'boolean' ? nextValue : !state.level.xrayEnabled;
      const level = {
        ...state.level,
        xrayEnabled,
      };

      return {
        level,
        analysis: rebuildAnalysis(level, state.simulationTick),
        feedback: appendFeedback(
          state.feedback,
          createFeedbackEntry(xrayEnabled ? 'X-Ray overlay engaged.' : 'X-Ray overlay disengaged.'),
        ),
      };
    });
  },

  setHoveredEntity: (hoveredEntity) => {
    set((state) => ({
      interaction: {
        ...state.interaction,
        hoveredEntity,
      },
    }));
  },

  selectEntity: (selectedEntity) => {
    set((state) => ({
      selectedEntity,
      interaction: {
        ...state.interaction,
        selectedEntity,
      },
    }));
  },

  applyToolToEntity: (entityType, entityId) => {
    const state = get();
    const { level, activeToolId, analysis } = state;
    const tool = TOOL_LIBRARY[activeToolId];

    if (!tool) {
      return;
    }

    const target =
      entityType === 'wire'
        ? level.wires.find((wire) => wire.id === entityId)
        : level.nodes.find((node) => node.id === entityId);

    if (!target) {
      return;
    }

    if (entityType === 'node' && target.kind === 'sequenceRelay' && activeToolId === 'connectorTool') {
      const relayResult = tryLatchRelay(level, analysis, entityId);

      set((currentState) => {
        const nextLevel = relayResult.level ?? currentState.level;
        const nextAnalysis = rebuildAnalysis(nextLevel, currentState.simulationTick);

        return {
          level: nextLevel,
          analysis: nextAnalysis,
          selectedEntity: { type: entityType, id: entityId },
          actionLog: appendLog(currentState.actionLog, `${tool.label}: ${relayResult.message}`),
          feedback: appendFeedback(
            currentState.feedback,
            createFeedbackEntry(relayResult.message, relayResult.success ? 'success' : 'warning'),
          ),
          mistakes: relayResult.success
            ? currentState.mistakes
            : markMistake(currentState.mistakes, relayResult.message),
        };
      });

      return;
    }

    const nodeMap = level.nodes.reduce((accumulator, node) => {
      accumulator[node.id] = node;
      return accumulator;
    }, {});

    const result = applyToolAction({
      toolId: activeToolId,
      targetType: entityType,
      target,
      level,
      analysis,
      nodeMap,
      xrayEnabled: level.xrayEnabled,
    });

    set((currentState) => {
      let nextLevel = currentState.level;

      if (result.updatedTarget && entityType === 'wire') {
        nextLevel = setWire(nextLevel, result.updatedTarget);
      }

      if (result.updatedTarget && entityType === 'node') {
        nextLevel = setNode(nextLevel, result.updatedTarget);
      }

      if (result.nodeUpdate) {
        nextLevel = setNode(nextLevel, result.nodeUpdate);
      }

      if (result.toggleXRay) {
        nextLevel = {
          ...nextLevel,
          xrayEnabled: !currentState.level.xrayEnabled,
        };
      }

      const nextAnalysis = rebuildAnalysis(nextLevel, currentState.simulationTick);

      return {
        level: nextLevel,
        analysis: nextAnalysis,
        selectedEntity: { type: entityType, id: entityId },
        measurement: result.measurement ?? currentState.measurement,
        actionLog: appendLog(currentState.actionLog, `${tool.label} -> ${target.label}: ${result.message}`),
        feedback: appendFeedback(
          currentState.feedback,
          createFeedbackEntry(result.message, result.success ? 'success' : 'warning'),
        ),
        mistakes: result.success
          ? currentState.mistakes
          : markMistake(currentState.mistakes, `${tool.label} on ${target.label}: ${result.message}`),
      };
    });
  },

  runCircuitTest: () => {
    set((state) => {
      const nextLevel = {
        ...state.level,
        progress: {
          ...state.level.progress,
          testsRun: state.level.progress.testsRun + 1,
        },
      };

      const nextAnalysis = rebuildAnalysis(nextLevel, state.simulationTick);
      const summary = explainCircuitFailure(nextAnalysis, nextLevel);
      const levelComplete = nextAnalysis.success;
      const postLevelAnalysis = levelComplete
        ? buildPostLevelAnalysis({
            level: nextLevel,
            analysis: nextAnalysis,
            mistakes: state.mistakes,
            actionLog: state.actionLog,
          })
        : null;

      return {
        level: nextLevel,
        analysis: nextAnalysis,
        levelComplete,
        postLevelAnalysis,
        feedback: appendFeedback(
          state.feedback,
          createFeedbackEntry(summary, levelComplete ? 'success' : 'warning'),
        ),
      };
    });
  },

  dismissFeedback: (feedbackId) => {
    set((state) => ({
      feedback: state.feedback.filter((item) => item.id !== feedbackId),
    }));
  },

  advanceSimulation: (delta) => {
    const state = get();
    const hasOscillation = (state.level.zones ?? []).some((zone) => zone.type === 'oscillation');

    if (!hasOscillation) {
      return;
    }

    const nextTick = state.simulationTick + delta;
    if (nextTick - state.lastSimulationCommit < 0.15) {
      set({
        simulationTick: nextTick,
      });
      return;
    }

    const nextAnalysis = rebuildAnalysis(state.level, nextTick);

    set({
      simulationTick: nextTick,
      lastSimulationCommit: nextTick,
      analysis: nextAnalysis,
    });
  },
}));
