export const XR_HAND_LAYOUT = {
  left: {
    label: 'Left Hand',
    defaultTool: 'multimeter',
  },
  right: {
    label: 'Right Hand',
    defaultTool: 'connectorTool',
  },
};

export function supportsNativeXR() {
  return typeof navigator !== 'undefined' && 'xr' in navigator;
}

export function createInitialInteractionState() {
  return {
    xrAvailable: supportsNativeXR(),
    hoveredEntity: null,
    selectedEntity: null,
    leftHandTool: XR_HAND_LAYOUT.left.defaultTool,
    rightHandTool: XR_HAND_LAYOUT.right.defaultTool,
    snappedTargetId: null,
  };
}

export function resolveHandForTool(tool) {
  return tool.hand ?? 'right';
}

export function getSnapCandidate({ point, anchors, radius = 1.2 }) {
  if (!point || !anchors.length) {
    return null;
  }

  let bestCandidate = null;
  let bestDistance = radius;

  anchors.forEach((anchor) => {
    const dx = point[0] - anchor.position[0];
    const dy = point[1] - anchor.position[1];
    const dz = point[2] - anchor.position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < bestDistance) {
      bestCandidate = anchor;
      bestDistance = distance;
    }
  });

  return bestCandidate;
}
