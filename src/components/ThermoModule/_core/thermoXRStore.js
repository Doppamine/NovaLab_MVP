import { createXRStore } from '@react-three/xr';

export const thermoXRStore = createXRStore({
    offerSession: false,
    controller: { teleportPointer: true },
    hand: { teleportPointer: true },
});
