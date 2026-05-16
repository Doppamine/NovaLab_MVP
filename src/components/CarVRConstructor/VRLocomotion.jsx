import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRInputSourceState, XROrigin } from '@react-three/xr';
import * as THREE from 'three';

/**
 * VRLocomotion — handles player movement and camera rotation in VR.
 *
 * Left thumbstick:  Walk (camera-relative, ground-plane only)
 * Right thumbstick X: Smooth-turn (rotate XROrigin yaw)
 *
 * Movement is ALWAYS active — even when the player is holding a part.
 * The held part follows the controller, not the thumbstick.
 */
export default function VRLocomotion() {
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');
  const originRef = useRef(null);
  const camera = useThree((state) => state.camera);

  const MOVE_SPEED = 3;       // meters per second
  const TURN_SPEED = 2;       // radians per second (smooth turn)
  const DEADZONE = 0.1;

  // Reusable objects — allocated once, reused every frame to avoid GC pressure
  const _worldQuat = useRef(new THREE.Quaternion());
  const _euler = useRef(new THREE.Euler());
  const _moveVec = useRef(new THREE.Vector3());
  const _upAxis = useRef(new THREE.Vector3(0, 1, 0));

  const getThumbstick = (gamepad) => {
    if (!gamepad || !gamepad.axes) return { x: 0, y: 0 };
    // Meta Quest xr-standard: thumbstick on axes 2 (X) and 3 (Y)
    if (gamepad.axes.length >= 4) return { x: gamepad.axes[2], y: gamepad.axes[3] };
    if (gamepad.axes.length >= 2) return { x: gamepad.axes[0], y: gamepad.axes[1] };
    return { x: 0, y: 0 };
  };

  useFrame((_, delta) => {
    if (!originRef.current) return;

    // ──────────────── LEFT THUMBSTICK: camera-relative walk ────────────────
    const leftGamepad = leftController?.inputSource?.gamepad;
    const leftTS = getThumbstick(leftGamepad);

    if (Math.abs(leftTS.x) > DEADZONE || Math.abs(leftTS.y) > DEADZONE) {
      // Get camera WORLD quaternion — in VR the camera is a child of XROrigin,
      // so camera.quaternion is only local (headset-tracked) rotation.
      camera.getWorldQuaternion(_worldQuat.current);

      // Extract yaw only so movement stays locked to the ground plane
      _euler.current.setFromQuaternion(_worldQuat.current, 'YXZ');
      const yaw = _euler.current.y;

      // Build movement vector: ts.x = strafe, ts.y = forward/back
      // Thumbstick Y: -1 = push forward, +1 = pull back → maps to -Z in Three.js
      const move = _moveVec.current.set(leftTS.x, 0, leftTS.y);
      move.applyAxisAngle(_upAxis.current, yaw);
      move.multiplyScalar(MOVE_SPEED * delta);

      originRef.current.position.add(move);
    }

    // ──────────────── RIGHT THUMBSTICK X: smooth turn ────────────────
    const rightGamepad = rightController?.inputSource?.gamepad;
    const rightTS = getThumbstick(rightGamepad);

    if (Math.abs(rightTS.x) > DEADZONE) {
      // Rotate XROrigin around Y axis — this rotates the entire VR rig,
      // effectively turning the camera without moving the headset tracker.
      originRef.current.rotation.y -= rightTS.x * TURN_SPEED * delta;
    }
  });

  return <XROrigin ref={originRef} />;
}
