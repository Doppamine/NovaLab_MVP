import { createXRStore } from '@react-three/xr';

export const thermoXRStore = createXRStore({
  controller: { teleportPointer: true },
  hand: { teleportPointer: true },
});
