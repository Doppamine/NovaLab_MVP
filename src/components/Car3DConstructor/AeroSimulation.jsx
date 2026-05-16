import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Stars, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// 1. СНАРЯД (Projectile)
function Shell({ position, onHit }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
    </mesh>
  );
}

// 2. МИШЕНЬ (Target)
function Target({ position, active }) {
  if (!active) return null;
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.5, 0.51]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

// 3. ОСНОВНАЯ СЦЕНА ПОЛИГОНА
function TankLab({ barrelAngle, power, fireKey, setTelemetry }) {
  const [shells, setShells] = useState([]);
  const [targets, setTargets] = useState([
    { id: 1, pos: [10, 1, 0], active: true },
    { id: 2, pos: [15, 1, 3], active: true },
    { id: 3, pos: [15, 1, -3], active: true },
    { id: 4, pos: [20, 1, 0], active: true },
  ]);

  // Логика выстрела
  useEffect(() => {
    if (fireKey > 0) {
      const angleRad = THREE.MathUtils.degToRad(barrelAngle);
      const vx = Math.cos(angleRad) * (power / 5);
      const vy = Math.sin(angleRad) * (power / 5);
      
      const newShell = {
        id: Date.now(),
        pos: [1.5, 1.5, 0], // Старт из дула
        vel: [vx, vy, 0],
      };
      setShells(prev => [...prev, newShell]);
    }
  }, [fireKey]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    setShells(prev => {
      const next = [];
      prev.forEach(s => {
        let [x, y, z] = s.pos;
        let [vx, vy, vz] = s.vel;

        // Физика снаряда
        vy -= 9.8 * dt * 0.5; // Гравитация
        x += vx * 10 * dt;
        y += vy * 10 * dt;

        // Проверка столкновения с полом
        if (y < 0) return; 

        // Проверка столкновения с мишенями
        let hit = false;
        setTargets(targList => targList.map(t => {
          if (!t.active) return t;
          const dist = Math.sqrt(Math.pow(x - t.pos[0], 2) + Math.pow(y - t.pos[1], 2));
          if (dist < 1.0) {
            hit = true;
            setTelemetry("ПОПАДАНИЕ!");
            return { ...t, active: false };
          }
          return t;
        }));

        if (!hit) next.push({ ...s, pos: [x, y, z], vel: [vx, vy, vz] });
      });
      return next;
    });
  });

  return (
    <group>
      {/* МОДЕЛЬ ТАНКА */}
      <group position={[0, 0, 0]}>
        {/* Корпус */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[3, 1, 2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Башня */}
        <group position={[0, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.6, 1.5]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          {/* Дуло (вращается углом barrelAngle) */}
          <group rotation={[0, 0, THREE.MathUtils.degToRad(barrelAngle)]}>
            <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.15, 2]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        </group>
      </group>

      {/* СНАРЯДЫ */}
      {shells.map(s => <Shell key={s.id} position={s.pos} />)}

      {/* МИШЕНИ */}
      {targets.map(t => <Target key={t.id} position={t.pos} active={t.active} />)}

      {/* ЗЕМЛЯ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 20]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <gridHelper args={[50, 25, "#38bdf8", "#1e293b"]} position={[10, 0, 0]} />
    </group>
  );
}

// 4. ГЛАВНЫЙ ЭКРАН
export default function AeroSimulation({ setPhase }) {
  const [angle, setAngle] = useState(20);
  const [power, setPower] = useState(50);
  const [fireKey, setFireKey] = useState(0);
  const [telemetry, setTelemetry] = useState("ГОТОВ К БОЮ");

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020617', color: 'white', position: 'fixed' }}>
      
      <Canvas shadows camera={{ position: [10, 10, 15], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <directionalLight position={[0, 20, 10]} intensity={1} castShadow />
        
        <TankLab 
            barrelAngle={angle} 
            power={power} 
            fireKey={fireKey} 
            setTelemetry={setTelemetry} 
        />
        
        <OrbitControls makeDefault />
        <Stars count={500} />
      </Canvas>

      {/* УПРАВЛЕНИЕ (СЛЕВА) */}
      <div style={{ position: 'absolute', bottom: '110px', left: '30px', zIndex: 100, width: '280px', background: 'rgba(0,15,30,0.95)', padding: '20px', borderRadius: '15px', border: '1px solid #38bdf8' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>TANK COMMAND</h3>
        
        <label>Угол пушки: {angle}°</label>
        <input type="range" min="0" max="60" value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />
        
        <label>Сила выстрела: {power}</label>
        <input type="range" min="20" max="100" value={power} onChange={(e) => setPower(Number(e.target.value))} style={{ width: '100%', marginBottom: '20px' }} />

        <button 
          onClick={() => setFireKey(k => k + 1)}
          style={{ width: '100%', padding: '15px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          🔥 ОГОНЬ!
        </button>
      </div>

      {/* ТЕЛЕМЕТРИЯ (СПРАВА) */}
      <div style={{ position: 'absolute', bottom: '110px', right: '30px', zIndex: 100, width: '300px', background: 'rgba(0,15,30,0.95)', padding: '20px', borderRadius: '15px', border: '1px solid #fbbf24' }}>
        <h3 style={{ color: '#fbbf24', margin: '0 0 10px 0' }}>БАЛЛИСТИКА</h3>
        <div style={{ background: '#000', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: '#fbbf24' }}>{telemetry}</h2>
        </div>
        <p style={{ fontSize: '0.75rem', marginTop: '10px', opacity: 0.7, lineHeight: '1.4' }}>
          Траектория снаряда рассчитывается по формуле: <br/>
          <b>y = x·tan(α) - (g·x²) / (2v²·cos²(α))</b>
        </p>
      </div>

      <button onClick={() => setPhase('drive')} style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 100, padding: '12px 30px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔙 ВЕРНУТЬСЯ НА ТРАССУ</button>
    </div>
  );
}