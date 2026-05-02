import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PhononMaterial } from '../_core/shaders';
import { useThermoStore } from '../_core/useThermoStore';
import HeatEngine from '../_core/HeatEngine';

const MAX_PARTICLES = 1200;

function createBuffers() {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const aStart = new Float32Array(MAX_PARTICLES * 3);
    const aEnd = new Float32Array(MAX_PARTICLES * 3);
    const aBirth = new Float32Array(MAX_PARTICLES);
    const aLifetime = new Float32Array(MAX_PARTICLES);
    const aArc = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
        aBirth[i] = -100;
        aLifetime[i] = 1;
        aArc[i] = 0;
    }
    return { positions, aStart, aEnd, aBirth, aLifetime, aArc };
}

/**
 * GPU-driven phonon particle field.
 *
 * Single THREE.Points draw call. Per-particle attributes (start, end, birth,
 * lifetime, arc) are mutated in-place inside useFrame; the shader handles
 * interpolation on the GPU. We RECYCLE dead particles instead of mounting/
 * unmounting buffers — this is what holds the frame-rate budget.
 *
 * Emission rate between any two bodies is proportional to the actual
 * conductive heat-flow rate (HeatEngine.conductiveRate). The animation
 * IS the physics, not theatre.
 *
 * We use refs (not useMemo) for resources we mutate at 60 Hz — React 19's
 * compiler treats useMemo returns as immutable.
 */
export default function PhononField({ bodyPositions }) {
    const pointsRef = useRef();
    // useState's lazy initializer is React's canonical "create once, mutate forever" pattern
    const [buffers] = useState(createBuffers);
    const [material] = useState(() => new PhononMaterial());

    const cursorRef = useRef(0);
    const accumRef = useRef({});

    // useFrame runs on rAF (post-render), so direct GPU uniform mutation here is
    // the canonical R3F pattern — React 19's strict purity rule misclassifies it.
    /* eslint-disable react-hooks/immutability */
    useFrame((state, dt) => {
        const time = state.clock.elapsedTime;
        material.uniforms.uTime.value = time;

        const s = useThermoStore.getState();
        if (!s.bodies || s.level !== 1) return;

        const bodies = Object.values(s.bodies).filter(b => b.inserted !== false);
        if (bodies.length < 2) return;

        // For each ordered pair, compute heat-flow rate, accumulate "particles owed",
        // and emit when we owe ≥ 1.
        const G = 3.0;
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                const rate = HeatEngine.conductiveRate(a, b, G); // W
                const absRate = Math.abs(rate);
                if (absRate < 0.05) continue;

                const hot = rate > 0 ? a : b;
                const cold = rate > 0 ? b : a;

                const key = `${hot.id}->${cold.id}`;
                accumRef.current[key] = (accumRef.current[key] || 0) + absRate * dt * 1.2;

                while (accumRef.current[key] >= 1) {
                    accumRef.current[key] -= 1;
                    emitParticle(hot.id, cold.id, bodyPositions, buffers, cursorRef, time);
                    cursorRef.current = (cursorRef.current + 1) % MAX_PARTICLES;
                }
            }
        }

        // Mark attribute updates
        const geom = pointsRef.current?.geometry;
        if (geom) {
            geom.attributes.aStart.needsUpdate = true;
            geom.attributes.aEnd.needsUpdate = true;
            geom.attributes.aBirth.needsUpdate = true;
            geom.attributes.aLifetime.needsUpdate = true;
            geom.attributes.aArc.needsUpdate = true;
        }
    });
    /* eslint-enable react-hooks/immutability */

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={MAX_PARTICLES}
                    array={buffers.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aStart"
                    count={MAX_PARTICLES}
                    array={buffers.aStart}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aEnd"
                    count={MAX_PARTICLES}
                    array={buffers.aEnd}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aBirth"
                    count={MAX_PARTICLES}
                    array={buffers.aBirth}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aLifetime"
                    count={MAX_PARTICLES}
                    array={buffers.aLifetime}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aArc"
                    count={MAX_PARTICLES}
                    array={buffers.aArc}
                    itemSize={1}
                />
            </bufferGeometry>
            <primitive object={material} attach="material" />
        </points>
    );
}

function emitParticle(fromId, toId, bodyPositions, buf, cursorRef, time) {
    const start = bodyPositions[fromId];
    const end = bodyPositions[toId];
    if (!start || !end) return;

    const i = cursorRef.current;
    const i3 = i * 3;

    // Slight random scatter around source/target so particles fan out
    const jitter = () => (Math.random() - 0.5) * 0.25;
    buf.aStart[i3] = start[0] + jitter();
    buf.aStart[i3 + 1] = start[1] + jitter();
    buf.aStart[i3 + 2] = start[2] + jitter();

    buf.aEnd[i3] = end[0] + jitter();
    buf.aEnd[i3 + 1] = end[1] + jitter();
    buf.aEnd[i3 + 2] = end[2] + jitter();

    buf.aBirth[i] = time;
    buf.aLifetime[i] = 1.4 + Math.random() * 0.6;
    buf.aArc[i] = 0.4 + Math.random() * 0.6;

    buf.positions[i3] = start[0];
    buf.positions[i3 + 1] = start[1];
    buf.positions[i3 + 2] = start[2];
}
