export const LESSON_SNIPPETS = {
  resistance:
    'Higher resistance means a larger voltage drop across the segment, so less usable energy reaches the target.',
  polarity:
    'Polarity matters because many devices only accept current when charge direction matches the expected orientation.',
  transformer:
    'A transformer changes voltage level so the target receives energy inside its safe operating range.',
  diagnostics:
    'Diagnostics separate observation from repair: measure first, identify the fault, then choose the matching tool.',
  xray:
    'X-Ray reveals structural faults hidden inside the conductor, which surface tools cannot detect.',
  logicGate:
    'Logical relays emulate AND, OR, and XOR conditions, so electrical flow depends on circuit logic as well as continuity.',
};

export function explainToolFailure({ tool, target, reason }) {
  if (reason) {
    return reason;
  }

  if (!target) {
    return `The ${tool.label} needs a valid circuit object to interact with.`;
  }

  return `${tool.label} cannot be applied to ${target.label ?? target.id} in its current state.`;
}

export function explainCircuitFailure(analysis, level) {
  if (analysis.success) {
    return `Current reached ${level.targetLabel} with ${analysis.voltageAtTarget.toFixed(2)} V and ${analysis.currentAtTarget.toFixed(2)} A.`;
  }

  const primaryFailure = analysis.failureReasons[0];
  if (primaryFailure) {
    return primaryFailure.message;
  }

  return 'The circuit is still open. Inspect the conductive path, measure the branch, and verify hidden damage with X-Ray.';
}

export function buildLearningFeedback(analysis, level) {
  const snippets = [LESSON_SNIPPETS.diagnostics];

  if (analysis.hiddenFaultCount > 0) {
    snippets.push(LESSON_SNIPPETS.xray);
  }

  if (analysis.maxResistanceWireId) {
    snippets.push(LESSON_SNIPPETS.resistance);
  }

  if (analysis.requiresPolarityFix) {
    snippets.push(LESSON_SNIPPETS.polarity);
  }

  if (analysis.requiresTransformer) {
    snippets.push(LESSON_SNIPPETS.transformer);
  }

  if (level.concepts.includes('logicGate')) {
    snippets.push(LESSON_SNIPPETS.logicGate);
  }

  return snippets;
}

export function buildPostLevelAnalysis({ level, analysis, mistakes, actionLog }) {
  const optimalSolution = level.optimalSolutions[0];

  return {
    title: `${level.name} restored`,
    summary: explainCircuitFailure(analysis, level),
    mistakes: mistakes.length
      ? mistakes
      : ['No major diagnostic mistakes were recorded during this run.'],
    correctLogic:
      optimalSolution?.steps ??
      ['Diagnose the branch', 'Repair the matching damage', 'Verify voltage and polarity', 'Test current flow'],
    physicsExplanation: buildLearningFeedback(analysis, level),
    optimalSolution: optimalSolution?.label ?? 'Repair the valid path with the fewest interventions.',
    actionCount: actionLog.length,
  };
}
