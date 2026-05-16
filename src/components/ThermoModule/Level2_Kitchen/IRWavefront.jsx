import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { IRWavefrontMaterial } from '../_core/shaders';
import { useThermoStore } from '../_core/useThermoStore';

/**
 * Expanding infrared shell from the kettle.
 * Radius is driven by sim time vs. level2Duration; intensity tapers as it
 * approaches the room walls.
 */
export default function IRWavefront({ origin = [0, 0.6, 0], maxRadius = 4.5 }) {
    const [material] = useState(() => new IRWavefrontMaterial());

    /* eslint-disable react-hooks/immutability */
    useFrame((state) => {
        const s = useThermoStore.getState();
        const elapsed = s.simTime;
        const duration = s.level2Duration ?? 6;
        const t = Math.min(1, elapsed / duration);

        material.uniforms.uTime.value = state.clock.elapsedTime;
        material.uniforms.uRadius.value = t * maxRadius;
        material.uniforms.uIntensity.value = (1 - Math.pow(t, 2.5)) * 1.2;
        material.uniforms.uOrigin.value.set(origin[0], origin[1], origin[2]);
    });
    /* eslint-enable react-hooks/immutability */

    return (
        <mesh frustumCulled={false}>
            <sphereGeometry args={[maxRadius * 1.1, 96, 96]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}
