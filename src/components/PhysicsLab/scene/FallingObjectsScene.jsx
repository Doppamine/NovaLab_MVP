import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D-сцена для сценария Apollo 15.
 *
 * Рендерит:
 *  - «Планету» (плоскость) с подписью текущего мира (Earth/Moon/Mars/...)
 *  - Два падающих объекта (молоток — тёмная капсула, перо — светлое перо-подобие)
 *  - Вертикальную линейку высоты справа
 *  - Маркеры «начало отсчёта» и «земля»
 *
 * Анимация ВЕДЁТСЯ ПО ТРАЕКТОРИЯМ из физ. ядра, не симулируется заново.
 * Это даёт нам детерминированность + возможность scrub-it back and forth.
 *
 * props:
 *  result       — объект { object1: {times, states, result: {fall_time,...}}, object2: {...}, environment }
 *  currentTime  — текущий момент симуляции (c), управляется родителем
 *  planetLabel  — «Земля», «Луна», ...
 */
export default function FallingObjectsScene({ result, currentTime, planetLabel, dropHeight }) {
  if (!result) return null;

  return (
    <div className="scene-canvas-wrap">
      <Canvas
        shadows
        camera={{ position: [4, 2.5, 5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0a1220']} />
        <fog attach="fog" args={['#0a1220', 8, 25]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[4, 8, 3]} intensity={1.4} castShadow
          shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        />
        <hemisphereLight args={['#8ab4ff', '#1a1f30', 0.35]} />

        <Ground label={planetLabel} />
        <HeightRuler maxHeight={dropHeight} />

        <FallingBody
          trajectory={result.object1}
          currentTime={currentTime}
          position={[-0.8, 0, 0]}
          kind="hammer"
        />
        <FallingBody
          trajectory={result.object2}
          currentTime={currentTime}
          position={[0.8, 0, 0]}
          kind="feather"
        />

        <OrbitControls
          enablePan={false}
          minDistance={3} maxDistance={15}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      </Canvas>

      <Telemetry result={result} currentTime={currentTime} planetLabel={planetLabel} />
    </div>
  );
}

// ----------------------- Ground (planet surface) -----------------------
function Ground({ label }) {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={0}>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#2a3147" roughness={0.9} />
      </mesh>
      {/* Сетка */}
      <gridHelper args={[8, 16, '#3e4a68', '#1a2030']} position-y={0.001} />
      <Text
        position={[0, 0.02, 2.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color="#e8b54a"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// ----------------------- Height ruler -----------------------
function HeightRuler({ maxHeight }) {
  const marks = useMemo(() => {
    const step = maxHeight <= 3 ? 0.5 : maxHeight <= 10 ? 1 : 5;
    const vals = [];
    for (let h = 0; h <= maxHeight + 0.01; h += step) vals.push(h);
    return vals;
  }, [maxHeight]);
  return (
    <group position={[2.2, 0, 0]}>
      <mesh position={[0, maxHeight / 2, 0]}>
        <boxGeometry args={[0.02, maxHeight, 0.02]} />
        <meshBasicMaterial color="#e8b54a" opacity={0.5} transparent />
      </mesh>
      {marks.map((h) => (
        <group key={h} position={[0, h, 0]}>
          <mesh>
            <boxGeometry args={[0.1, 0.01, 0.02]} />
            <meshBasicMaterial color="#e8b54a" />
          </mesh>
          <Text position={[0.2, 0, 0]} fontSize={0.12} color="#e8b54a" anchorX="left" anchorY="middle">
            {h.toFixed(0)}м
          </Text>
        </group>
      ))}
    </group>
  );
}

// ----------------------- Falling body -----------------------
function FallingBody({ trajectory, currentTime, position, kind }) {
  const ref = useRef();
  const trailRef = useRef();

  // Сэмплируем y(t) через линейную интерполяцию между узлами решения.
  const yAt = useMemo(() => {
    const { times, states } = trajectory;
    return (t) => {
      if (t <= times[0]) return states[0][0];
      if (t >= times[times.length - 1]) return states[states.length - 1][0];
      // Бинарный поиск индекса
      let lo = 0, hi = times.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (times[mid] <= t) lo = mid; else hi = mid;
      }
      const a = (t - times[lo]) / (times[hi] - times[lo]);
      return states[lo][0] * (1 - a) + states[hi][0] * a;
    };
  }, [trajectory]);

  // След (trail) — последние N точек
  const trailPoints = useRef([]);

  useFrame(() => {
    const y = yAt(currentTime);
    if (ref.current) {
      ref.current.position.y = Math.max(0, y);
      // Лёгкое «качание» пера в воздухе
      if (kind === 'feather') {
        const wobble = Math.sin(currentTime * 6) * 0.05;
        ref.current.rotation.z = wobble;
      }
    }

    // Обновление следа
    trailPoints.current.push([position[0], Math.max(0, y), position[2]]);
    if (trailPoints.current.length > 60) trailPoints.current.shift();
    if (trailRef.current) {
      const geo = trailRef.current.geometry;
      const arr = new Float32Array(trailPoints.current.flat());
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      geo.setDrawRange(0, trailPoints.current.length);
      geo.computeBoundingSphere();
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref} castShadow>
        {kind === 'hammer' ? (
          <>
            <boxGeometry args={[0.35, 0.2, 0.15]} />
            <meshStandardMaterial color="#5d5d5d" metalness={0.85} roughness={0.4} />
          </>
        ) : (
          <>
            <coneGeometry args={[0.08, 0.4, 6]} />
            <meshStandardMaterial color="#e5d4a3" roughness={0.8} metalness={0.1} />
          </>
        )}
      </mesh>
      {/* Линия следа */}
      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial color={kind === 'hammer' ? '#e8b54a' : '#2d8b7a'} transparent opacity={0.5} />
      </line>
    </group>
  );
}

// ----------------------- HUD telemetry -----------------------
function Telemetry({ result, currentTime, planetLabel }) {
  const y1 = interpY(result.object1, currentTime);
  const y2 = interpY(result.object2, currentTime);
  const v1 = interpV(result.object1, currentTime);
  const v2 = interpV(result.object2, currentTime);

  return (
    <div className="scene-telemetry">
      <div className="row"><span className="k">Планета</span><span>{planetLabel}</span></div>
      <div className="row"><span className="k">T+</span><span>{currentTime.toFixed(2)} с</span></div>
      <hr style={{ border: 'none', borderTop: '1px dashed rgba(245,235,216,0.2)', margin: '6px 0' }} />
      <div className="row"><span className="k">🔨 h / v</span><span>{y1.toFixed(2)} м / {v1.toFixed(1)} м/с</span></div>
      <div className="row"><span className="k">🪶 h / v</span><span>{y2.toFixed(2)} м / {v2.toFixed(1)} м/с</span></div>
    </div>
  );
}

function interpY(tr, t) {
  const { times, states } = tr;
  if (t <= times[0]) return states[0][0];
  if (t >= times[times.length - 1]) return Math.max(0, states[states.length - 1][0]);
  let lo = 0, hi = times.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (times[m] <= t) lo = m; else hi = m; }
  const a = (t - times[lo]) / (times[hi] - times[lo]);
  return Math.max(0, states[lo][0] * (1 - a) + states[hi][0] * a);
}
function interpV(tr, t) {
  const { times, states } = tr;
  if (t <= times[0]) return Math.abs(states[0][1]);
  if (t >= times[times.length - 1]) return Math.abs(states[states.length - 1][1]);
  let lo = 0, hi = times.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (times[m] <= t) lo = m; else hi = m; }
  const a = (t - times[lo]) / (times[hi] - times[lo]);
  return Math.abs(states[lo][1] * (1 - a) + states[hi][1] * a);
}
