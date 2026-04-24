import { createXRStore } from '@react-three/xr';

// XR store for the Car VR Constructor
// - teleportPointer on both hands/controllers for locomotion
export const carVRStore = createXRStore({
  controller: { teleportPointer: true },
  hand: { teleportPointer: true },
  emulate: false, // Disabled due to three.js version mismatch with the emulator's DevUI
});
