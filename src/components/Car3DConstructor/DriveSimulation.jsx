import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Sky, Stars, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { BODIES, MOTORS, WHEELS, ENVIRONMENTS } from './carPartsData';
import { useLocale } from '../../i18n/LocalizationContext';

function useKeyboard() {
  const keys = useRef({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyW') keys.current.w = true;
      if (e.code === 'KeyS') keys.current.s = true;
      if (e.code === 'KeyA') keys.current.a = true;
      if (e.code === 'KeyD') keys.current.d = true;
    };
    const handleKeyUp = (e) => {
      if (e.code === 'KeyW') keys.current.w = false;
      if (e.code === 'KeyS') keys.current.s = false;
      if (e.code === 'KeyA') keys.current.a = false;
      if (e.code === 'KeyD') keys.current.d = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);
  return keys;
}

export function EnhancedCarModel({ config }) {
  const body = (config && config.body && BODIES) ? BODIES[config.body] : null;
  const wL = (config && config.wheelLeft && WHEELS) ? WHEELS[config.wheelLeft] : { radius: 0.4 };
  const rL = wL.radius;

  return (
    <group>
      <mesh position={[0, rL, 0]} castShadow>
        <boxGeometry args={[1.8, 0.2, 4]} />
        <meshStandardMaterial color="#111" metalness={0.9} />
      </mesh>
      {body && (
        <mesh position={[0, rL + 0.4, 0]} castShadow>
          <boxGeometry args={[1.7, 0.8, 3.8]} />
          <meshStandardMaterial color={body.color} metalness={0.6} roughness={0.2} />
        </mesh>
      )}
      {[-1.3, 1.3].map((z, i) => (
        <group key={i}>
          <mesh position={[-1, rL, z]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[rL, rL, 0.4, 32]} /><meshStandardMaterial color="#050505" />
          </mesh>
          <mesh position={[1, rL, z]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[rL, rL, 0.4, 32]} /><meshStandardMaterial color="#050505" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PhysicsCar({ config, setTelemetry }) {
  const carRef = useRef();
  const keys = useKeyboard();
  const state = useRef({ v: 0, h: 0, x: 0, z: 0 });

  useFrame((stateObj, delta) => {
    let { v, h, x, z } = state.current;
    const motorPower = (config && MOTORS[config.motor]) ? MOTORS[config.motor].torque : 50;
    
    const throttle = keys.current.w ? 1 : keys.current.s ? -1 : 0;
    v += throttle * (motorPower * 0.05) * delta;
    v *= 0.97;
    if (v > 26) v = 26; 
    if (v < -10) v = -10;

    const steer = keys.current.a ? 1 : keys.current.d ? -1 : 0;
    const turnFactor = Math.min(Math.abs(v) * 0.05, 0.6);
    h += steer * turnFactor * 2 * delta;
    x += Math.sin(h) * v * delta;
    z += Math.cos(h) * v * delta;
    state.current = { v, h, x, z };

    if (carRef.current) {
      carRef.current.position.set(x, 0, z);
      carRef.current.rotation.y = h;
      const camX = x - Math.sin(h) * 12;
      const camZ = z - Math.cos(h) * 12;
      stateObj.camera.position.lerp(new THREE.Vector3(camX, 6, camZ), 0.1);
      stateObj.camera.lookAt(x, 1, z);
    }
    setTelemetry({ speed: Math.abs(v * 10).toFixed(0) });
  });
  return <group ref={carRef}><EnhancedCarModel config={config} /></group>;
}

export default function DriveSimulation({ config, setPhase }) {
  const { t } = useLocale();
  const [telemetry, setTelemetry] = useState({ speed: 0 });

  return (
    <div style={{width: '100vw', height: '100vh', background: '#0a0a0a', position: 'fixed', top: 0, left: 0, overflow: 'hidden'}}>
      
      {/* СПИДОМЕТР: ТЕПЕРЬ НАД КНОПКОЙ */}
      <div style={{
        position: 'absolute', bottom: '100px', left: '30px', zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', padding: '15px 20px', borderRadius: '10px',
        border: '1px solid #38bdf8', color: 'white', pointerEvents: 'none'
      }}>
        <h1 style={{fontSize: '2.2rem', margin: 0, color: '#38bdf8', fontFamily: 'monospace'}}>
          {telemetry.speed} <small style={{fontSize: '0.9rem', color: '#fff'}}>{t('КМ/Ч')}</small>
        </h1>
      </div>

      <button onClick={() => setPhase('build')} style={{position: 'absolute', bottom: '30px', left: '30px', zIndex: 9999, padding: '12px 24px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>🔙 {t('В ГАРАЖ')}</button>
      <button onClick={() => setPhase('aero')} style={{position: 'absolute', bottom: '30px', right: '30px', zIndex: 9999, padding: '12px 24px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>🌪️ {t('АЭРОДИНАМИКА')}</button>

      <div style={{width: '100%', height: '100%'}}>
        <Canvas shadows>
          <color attach="background" args={['#111']} />
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 50, 10]} castShadow intensity={2} />
          <PhysicsCar config={config} setTelemetry={setTelemetry} />
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[20, 2000]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          <gridHelper args={[20, 100, '#38bdf8', '#444']} position={[0, 0.01, 0]} />
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <planeGeometry args={[2000, 2000]} /><meshStandardMaterial color="#0a0a0a" />
          </mesh>
          <ContactShadows position={[0, 0, 0]} opacity={0.7} scale={20} blur={2} far={5} />
        </Canvas>
      </div>
    </div>
  );
}
