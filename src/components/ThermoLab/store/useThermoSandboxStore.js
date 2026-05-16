import { create } from 'zustand';
import {
  THERMO_LEVELS,
  buildInitialParamMap,
  cloneLevelParams,
} from '../thermoLevels.js';

function deepSet(target, path, value) {
  const keys = path.split('.');
  const clone = JSON.parse(JSON.stringify(target));
  let cursor = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    cursor = cursor[keys[index]];
  }

  cursor[keys[keys.length - 1]] = value;
  return clone;
}

const PHASE_ORDER = ['setup', 'manual', 'simulate', 'compare', 'explain'];

export const useThermoSandboxStore = create((set, get) => ({
  levelId: THERMO_LEVELS[0].id,
  phase: 'setup',
  paramsByLevel: buildInitialParamMap(),
  answersByLevel: Object.fromEntries(THERMO_LEVELS.map((level) => [level.id, ''])),
  xrayEnabled: false,
  sceneRunId: 0,

  setLevel: (levelId) => {
    set((state) => ({
      levelId,
      phase: 'setup',
      xrayEnabled: false,
      sceneRunId: state.sceneRunId + 1,
    }));
  },

  setPhase: (phase) => {
    set({ phase });
  },

  stepPhase: (direction = 1) => {
    set((state) => {
      const index = PHASE_ORDER.indexOf(state.phase);
      const nextIndex = Math.max(0, Math.min(PHASE_ORDER.length - 1, index + direction));
      const phase = PHASE_ORDER[nextIndex];
      return {
        phase,
        xrayEnabled: phase === 'compare' ? state.xrayEnabled : false,
      };
    });
  },

  setAnswer: (value) => {
    set((state) => ({
      answersByLevel: {
        ...state.answersByLevel,
        [state.levelId]: value,
      },
    }));
  },

  updateCurrentParam: (path, value) => {
    set((state) => ({
      paramsByLevel: {
        ...state.paramsByLevel,
        [state.levelId]: deepSet(state.paramsByLevel[state.levelId], path, value),
      },
      sceneRunId: state.sceneRunId + 1,
    }));
  },

  launchSimulation: () => {
    set((state) => ({
      phase: 'simulate',
      xrayEnabled: false,
      sceneRunId: state.sceneRunId + 1,
    }));
  },

  openCompare: () => {
    set({ phase: 'compare' });
  },

  openExplain: () => {
    set({ phase: 'explain' });
  },

  restartScene: () => {
    set((state) => ({ sceneRunId: state.sceneRunId + 1 }));
  },

  resetCurrentLevel: () => {
    const { levelId } = get();
    set((state) => ({
      phase: 'setup',
      xrayEnabled: false,
      sceneRunId: state.sceneRunId + 1,
      answersByLevel: {
        ...state.answersByLevel,
        [levelId]: '',
      },
      paramsByLevel: {
        ...state.paramsByLevel,
        [levelId]: cloneLevelParams(levelId),
      },
    }));
  },

  toggleXRay: (nextValue) => {
    set((state) => ({
      xrayEnabled: typeof nextValue === 'boolean' ? nextValue : !state.xrayEnabled,
    }));
  },
}));
