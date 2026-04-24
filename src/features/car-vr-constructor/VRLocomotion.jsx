import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRInputSourceState, XROrigin } from '@react-three/xr';
import * as THREE from 'three';

export default function VRLocomotion({ isPartSelected }) {
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');
  const originRef = useRef(null);
  const camera = useThree((state) => state.camera);
  const SPEED = 3; // meters per second

  const getThumbstick = (gamepad) => {
    if (!gamepad || !gamepad.axes) return { x: 0, y: 0 };
    // Usually Meta Quest / standard WebXR has thumbstick on axes 2 and 3
    if (gamepad.axes.length >= 4) return { x: gamepad.axes[2], y: gamepad.axes[3] };
    if (gamepad.axes.length >= 2) return { x: gamepad.axes[0], y: gamepad.axes[1] };
    return { x: 0, y: 0 };
  };

  useFrame((_, delta) => {
    if (isPartSelected) return; // Don't walk if a part is selected
    if (!originRef.current) return;

    // Use left or right thumbstick for walking (fallback if left isn't available)
    const leftGamepad = leftController?.gamepad;
    const rightGamepad = rightController?.gamepad;
    
    let ts = getThumbstick(leftGamepad);
    if (Math.abs(ts.x) < 0.1 && Math.abs(ts.y) < 0.1) {
        ts = getThumbstick(rightGamepad); // fallback to right if left not touched
    }

    // Deadzone
    if (Math.abs(ts.x) > 0.1 || Math.abs(ts.y) > 0.1) {
      // Calculate forward vector from camera yaw
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      const yaw = euler.y;
      
      const localMove = new THREE.Vector3(ts.x, 0, ts.y);
      localMove.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      
      originRef.current.position.add(localMove.multiplyScalar(SPEED * delta));
    }
  });

  return <XROrigin ref={originRef} />;
}
