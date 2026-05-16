import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { LossParticleMaterial } from '../_core/shaders';
import { useThermoStore } from '../_core/useThermoStore';
import HeatEngine from '../_core/HeatEngine';

const MAX = 600;

function createBuffers() {
    const positions = new Float32Array(MAX * 3);
    const aStart = new Float32Array(MAX * 3);
    const aTC = new Float32Array(MAX * 3);
    const aTL = new Float32Array(MAX * 3);
    const aBirth = new Float32Array(MAX);
    const aLifetime = new Float32Array(MAX);
    const aFate = new Float32Array(MAX);
    for (let i = 0; i < MAX; i++) {
        aBirth[i] = -100;
        aLifetime[i] = 1;
    }
    return { positions, aStart, aTC, aTL, aBirth, aLifetime, aFate };
}

/**
 * Heater photon emitter. Each particle is born at the heater surface, then
 * travels EITHER into the pipe (CAPTURED, blue) OR off into space (LOST, red).
 * Fate is decided at birth from the live efficiency η. Visual density of red
 * vs blue particles IS the visualization of (1−η).
 */
export default function LossParticles({ heaterPos = [0, 0.5, 0], pipeInlet = [-2.5, 0.5, 0] }) {
    const pointsRef = useRef();
    const cursor = useRef(0);
    const accum = useRef(0);
    const [buffers] = useState(createBuffers);
    const [material] = useState(() => new LossParticleMaterial());

    /* eslint-disable react-hooks/immutability */
    useFrame((state, dt) => {
        const time = state.clock.elapsedTime;
        material.uniforms.uTime.value = time;

        const s = useThermoStore.getState();
        if (s.level !== 3 || !s.flow) return;

        const { eta } = HeatEngine.solveFlow({
            P_total: s.flow.heaterPower,
            velocity: s.flow.velocity,
            diameter: s.flow.diameter,
            material: 'water',
            T_in: s.flow.T_in,
            T_out: s.flow.T_out,
        });

        // Aim for ~120 emissions/sec scaled by visible heater intensity
        const emitRate = 120;
        accum.current += emitRate * dt;
        while (accum.current >= 1) {
            accum.current -= 1;
            const fate = Math.random() > eta ? 1.0 : 0.0;
            emit(buffers, cursor.current, time, fate, heaterPos, pipeInlet);
            cursor.current = (cursor.current + 1) % MAX;
        }

        const geom = pointsRef.current?.geometry;
        if (geom) {
            geom.attributes.aStart.needsUpdate = true;
            geom.attributes.aTargetCaptured.needsUpdate = true;
            geom.attributes.aTargetLost.needsUpdate = true;
            geom.attributes.aBirth.needsUpdate = true;
            geom.attributes.aLifetime.needsUpdate = true;
            geom.attributes.aFate.needsUpdate = true;
        }
    });
    /* eslint-enable react-hooks/immutability */

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={MAX} array={buffers.positions} itemSize={3} />
                <bufferAttribute attach="attributes-aStart" count={MAX} array={buffers.aStart} itemSize={3} />
                <bufferAttribute attach="attributes-aTargetCaptured" count={MAX} array={buffers.aTC} itemSize={3} />
                <bufferAttribute attach="attributes-aTargetLost" count={MAX} array={buffers.aTL} itemSize={3} />
                <bufferAttribute attach="attributes-aBirth" count={MAX} array={buffers.aBirth} itemSize={1} />
                <bufferAttribute attach="attributes-aLifetime" count={MAX} array={buffers.aLifetime} itemSize={1} />
                <bufferAttribute attach="attributes-aFate" count={MAX} array={buffers.aFate} itemSize={1} />
            </bufferGeometry>
            <primitive object={material} attach="material" />
        </points>
    );
}

function emit(buf, i, time, fate, heaterPos, pipeInlet) {
    const i3 = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const r = 0.18;
    buf.aStart[i3] = heaterPos[0] + Math.cos(angle) * r * 0.4;
    buf.aStart[i3 + 1] = heaterPos[1] + Math.sin(angle) * r * 0.4;
    buf.aStart[i3 + 2] = heaterPos[2];

    // Captured target = into pipe near inlet
    buf.aTC[i3] = pipeInlet[0] + (Math.random() - 0.5) * 0.3;
    buf.aTC[i3 + 1] = pipeInlet[1];
    buf.aTC[i3 + 2] = pipeInlet[2] + (Math.random() - 0.5) * 0.05;

    // Lost target = a sphere of "sky" around the heater
    const lostDir = new Float32Array(3);
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI * 0.55; // upper hemisphere
    lostDir[0] = Math.sin(theta) * Math.cos(phi);
    lostDir[1] = Math.cos(theta);
    lostDir[2] = Math.sin(theta) * Math.sin(phi);
    const dist = 3.5 + Math.random() * 1.5;
    buf.aTL[i3] = heaterPos[0] + lostDir[0] * dist;
    buf.aTL[i3 + 1] = heaterPos[1] + lostDir[1] * dist;
    buf.aTL[i3 + 2] = heaterPos[2] + lostDir[2] * dist;

    buf.aBirth[i] = time;
    buf.aLifetime[i] = 1.0 + Math.random() * 0.6;
    buf.aFate[i] = fate;
}
