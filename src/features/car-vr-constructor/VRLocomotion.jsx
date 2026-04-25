import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRInputSourceState, XROrigin } from '@react-three/xr';
import * as THREE from 'three';

export default function VRLocomotion({ isPartSelected }) {
  const leftController = useXRInputSourceState('controller', 'left');
  const originRef = useRef(null);
  const camera = useThree((state) => state.camera);
  const SPEED = 3; // meters per second

  // Reusable objects to avoid per-frame allocations
  const _worldQuat = useRef(new THREE.Quaternion());
  const _euler = useRef(new THREE.Euler());
  const _moveVec = useRef(new THREE.Vector3());

  const getThumbstick = (gamepad) => {
    if (!gamepad || !gamepad.axes) return { x: 0, y: 0 };
    // Meta Quest xr-standard: thumbstick on axes 2 (X) and 3 (Y)
    if (gamepad.axes.length >= 4) return { x: gamepad.axes[2], y: gamepad.axes[3] };
    if (gamepad.axes.length >= 2) return { x: gamepad.axes[0], y: gamepad.axes[1] };
    return { x: 0, y: 0 };
  };

  useFrame((_, delta) => {
    if (isPartSelected) return; // Don't walk if a part is selected
    if (!originRef.current) return;

    // Only use the LEFT thumbstick for movement — right thumbstick is intentionally ignored
    const leftGamepad = leftController?.inputSource?.gamepad;
    const ts = getThumbstick(leftGamepad);

    // Deadzone
    if (Math.abs(ts.x) > 0.1 || Math.abs(ts.y) > 0.1) {
      // Get camera's WORLD quaternion — in VR the camera is a child of XROrigin,
      // so camera.quaternion is only the local (headset-tracked) rotation.
      // We need the world rotation to compute the correct forward direction.
      camera.getWorldQuaternion(_worldQuat.current);

      // Extract only the yaw (horizontal rotation) so movement stays on the ground plane
      _euler.current.setFromQuaternion(_worldQuat.current, 'YXZ');
      const yaw = _euler.current.y;

      // Build movement vector: ts.x = strafe, ts.y = forward/back
      // Thumbstick Y: -1 = push forward, +1 = pull back → maps to -Z (Three.js forward)
      const move = _moveVec.current.set(ts.x, 0, ts.y);
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      move.multiplyScalar(SPEED * delta);

      originRef.current.position.add(move);
    }
  });

  return <XROrigin ref={originRef} />;
}
