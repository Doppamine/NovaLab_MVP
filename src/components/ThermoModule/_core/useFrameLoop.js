import { useEffect } from 'react';
import { useThermoStore } from './useThermoStore';

/**
 * useFrameLoop — DOM-side rAF driver for the simulation tick.
 *
 * The R3F Canvas has its own useFrame, but we want simulation to advance
 * even when the Canvas is hidden (e.g. during the answering modal). This
 * hook drives store.tick() via requestAnimationFrame at uncapped rate.
 *
 * Auto-stops when store.running flips to false.
 */
export function useFrameLoop() {
    const tick = useThermoStore(s => s.tick);

    useEffect(() => {
        let rafId = null;
        let active = true;
        let lastTime = performance.now();

        function loop(now) {
            if (!active) return;
            const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp to 50ms
            lastTime = now;
            const running = useThermoStore.getState().running;
            if (running) tick(dt);
            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);

        return () => {
            active = false;
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [tick]);
}
