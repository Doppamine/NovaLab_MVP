import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { rungeKutta4, freeFallModel, CONSTANTS } from '../../physics/engine';

// --- 1. 3D КОМПОНЕНТ ДЛЯ ОТРИСОВКИ СИМУЛЯЦИИ ---
function Simulation3DView({ history, onComplete }) {
  const objectRef = useRef();
  const [frameIndex, setFrameIndex] = useState(0);

  useFrame((state) => {
    if (!history || history.length === 0) return;

    // Скорость воспроизведения: 1 кадр симуляции за 1 кадр рендера
    if (frameIndex < history.length - 1) {
      setFrameIndex(prev => prev + 1);
    } else {
      // Задержка 1 секунда перед экраном результатов
      setTimeout(() => { if (onComplete) onComplete(); }, 1000);
      return;
    }

    const currentState = history[frameIndex];
    
    if (objectRef.current) {
      // Двигаем объект вниз
      objectRef.current.position.y = currentState.y;
      
      // Камера плавно летит за объектом
      const targetCamPos = new THREE.Vector3(15, currentState.y + 5, 20);
      state.camera.position.lerp(targetCamPos, 0.5);
      state.camera.lookAt(0, currentState.y, 0);
    }

    // Обновляем HTML-телеметрию напрямую (без React-рендера для 60FPS)
    const yEl = document.getElementById('tele-y');
    const vEl = document.getElementById('tele-v');
    if (yEl && vEl) {
      yEl.innerText = currentState.y.toFixed(0);
      vEl.innerText = Math.abs(currentState.v).toFixed(1);
      
      // Индикация терминальной скорости
      if (Math.abs(currentState.v) > 40) {
          vEl.style.color = '#4ade80';
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#020617']} />
      <Sky sunPosition={[100, 20, 100]} turbidity={0.2} />
      <Stars count={1000} factor={4} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 50, 10]} intensity={1.5} castShadow />

      {/* Падающий объект */}
      <mesh ref={objectRef} castShadow position={[0, history[0]?.y || 2000, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} />
      </mesh>

      {/* Бесконечная шахта/башня для ощущения скорости */}
      {Array.from({ length: 25 }).map((_, i) => (
        <group key={i} position={[0, i * 100, 0]}>
          <mesh position={[-8, 0, 0]}>
            <boxGeometry args={[1, 100, 1]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[-4, 50, 0]}>
            <boxGeometry args={[8, 0.5, 0.5]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}

      {/* Земля */}
      <mesh position={[0, -0.5, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      
      <gridHelper args={[1000, 100, '#38bdf8', '#334155']} position={[0, 0.01, 0]} />
    </>
  );
}

// --- 2. ГЛАВНЫЙ ОРКЕСТРАТОР ---
export default function LessonOrchestrator() {
  const [phase, setPhase] = useState('setup');
  
  const [params, setParams] = useState({
    m: 80,       // кг
    Cd: 1.0,     // Коэфф. сопротивления
    A: 0.8,      // м^2
    rho: CONSTANTS.rho_air,
    h0: 2000     // Начальная высота
  });

  const [manualAnswer, setManualAnswer] = useState('');
  const [simResult, setSimResult] = useState(null);
  
  // Ядро физики
  const runPhysicsEngine = () => {
    let t = 0;
    const dt = 0.05; // 50 мс
    let state = { y: params.h0, v: 0 };
    const getDerivatives = freeFallModel(state, params);
    
    const history = [];
    
    while (state.y > 0 && t < 300) {
      history.push({ t, y: state.y, v: state.v });
      state = rungeKutta4(state, t, dt, getDerivatives);
      t += dt;
    }
    
    setSimResult({
      time: t.toFixed(2),
      terminalV: Math.abs(state.v).toFixed(1),
      history
    });
    setPhase('simulate');
  };

  // ФАЗА 1: ПОСТАНОВКА ЗАДАЧИ
  if (phase === 'setup') {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Фаза 1: Задача. "Падение в атмосфере"</h2>
        <div style={cardStyle}>
          <p>Тело массой <b>{params.m} кг</b> падает с высоты <b>{params.h0} метров</b>.</p>
          <p>Площадь сечения: <b>{params.A} м²</b>, Коэффициент обтекаемости (Cd): <b>{params.Cd}</b>.</p>
          <p>Плотность воздуха (ρ): <b>{params.rho} кг/м³</b>.</p>
        </div>
        <button onClick={() => setPhase('manual')} style={btnPrimary}>ПЕРЕЙТИ К РАСЧЕТУ →</button>
      </div>
    );
  }

  // ФАЗА 2: РУЧНОЙ РАСЧЕТ
  if (phase === 'manual') {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Фаза 2: Твой расчёт</h2>
        <div style={cardStyle}>
          <p style={{ color: '#fbbf24', fontWeight: 'bold' }}>Представь, что воздуха нет (Вакуум).</p>
          <p>Используя формулу <b>t = √(2h / g)</b>, рассчитай, через сколько секунд тело упадет на землю? (Прими g = 9.8)</p>
          <input 
            type="number" 
            value={manualAnswer} 
            onChange={(e) => setManualAnswer(e.target.value)}
            placeholder="Введи время (сек)..."
            style={inputStyle}
          />
        </div>
        <button 
          onClick={runPhysicsEngine} 
          disabled={!manualAnswer}
          style={manualAnswer ? btnPrimary : btnDisabled}
        >
          ЗАПУСТИТЬ СИМУЛЯЦИЮ 🚀
        </button>
      </div>
    );
  }

  // ФАЗА 3: 3D СИМУЛЯЦИЯ
  if (phase === 'simulate') {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#020617', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        
        {/* ЖИВАЯ ТЕЛЕМЕТРИЯ (HTML поверх Canvas) */}
        <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 100, background: 'rgba(0,10,20,0.85)', padding: '20px', borderRadius: '15px', border: '1px solid #38bdf8', color: 'white', width: '250px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>ДАТЧИКИ ПАДЕНИЯ</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Высота (y):</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
              <span id="tele-y">2000</span> <small style={{fontSize: '1rem'}}>м</small>
            </div>
          </div>
          
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Скорость (v):</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace' }}>
              <span id="tele-v">0.0</span> <small style={{fontSize: '1rem'}}>м/с</small>
            </div>
          </div>
        </div>

        {/* 3D CANVAS */}
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
          <Canvas style={{ width: '100%', height: '100%' }}>
            <React.Suspense fallback={null}>
              <Simulation3DView history={simResult.history} onComplete={() => setPhase('compare')} />
            </React.Suspense>
          </Canvas>
        </div>

        {/* КНОПКА ПРОПУСКА */}
        <button onClick={() => setPhase('compare')} style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 100, padding: '15px 30px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Пропустить ⏭
        </button>
      </div>
    );
  }

  // ФАЗА 4: СРАВНЕНИЕ
  if (phase === 'compare') {
    const manualTime = parseFloat(manualAnswer);
    const simTime = parseFloat(simResult.time);
    const error = Math.abs(manualTime - simTime) / simTime * 100;
    
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Фаза 4: Сравнение</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{...cardStyle, borderColor: '#fbbf24', textAlign: 'center'}}>
            <p style={{ margin: 0, color: '#94a3b8' }}>Твой расчёт (Вакуум)</p>
            <h1 style={{color: '#fbbf24', fontSize: '3rem', margin: '10px 0'}}>{manualTime} с</h1>
          </div>
          <div style={{...cardStyle, borderColor: '#4ade80', textAlign: 'center'}}>
            <p style={{ margin: 0, color: '#94a3b8' }}>Симуляция (Воздух)</p>
            <h1 style={{color: '#4ade80', fontSize: '3rem', margin: '10px 0'}}>{simTime} с</h1>
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '15px', border: '1px solid #f87171' }}>
          <h3 style={{color: '#f87171', margin: '0 0 10px 0'}}>Погрешность: {error.toFixed(1)}%</h3>
          <p style={{ lineHeight: '1.6' }}>Твой ответ отличается! Почему? В реальности воздух сопротивляется падению. Чем быстрее летит тело, тем сильнее воздух давит на него снизу. Школьная формула <b>h=gt²/2</b> работает только в безвоздушном пространстве.</p>
        </div>

        <button onClick={() => setPhase('explain')} style={btnPrimary}>ВЗЛОМАТЬ ФОРМУЛУ СИМУЛЯЦИИ 🔍</button>
      </div>
    );
  }

  // ФАЗА 5: ОБЪЯСНЕНИЕ
  if (phase === 'explain') {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Фаза 5: Реверс-инжиниринг симуляции</h2>
        
        <div style={cardStyle}>
          <h3 style={{color: '#38bdf8', marginTop: 0}}>Как считал движок NovaLab?</h3>
          <p>Движок учитывал силу сопротивления воздуха: <b>F_air = ½ · ρ · v² · Cd · A</b></p>
          
          <div style={{ background: '#000', padding: '20px', borderRadius: '10px', marginTop: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>Терминальная (максимальная) скорость падения:</p>
            <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#4ade80' }}>
              v_max = √((2 · m · g) / (Cd · ρ · A)) = {simResult.terminalV} м/с
            </span>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '10px' }}>
              *Тело не могло разгоняться быстрее {simResult.terminalV} м/с, поэтому падало дольше ({simResult.time} с).
            </p>
          </div>
        </div>

        <button onClick={() => {
            setManualAnswer('');
            setPhase('setup');
        }} style={{...btnPrimary, background: '#334155', color: 'white'}}>← ПОВТОРИТЬ ОПЫТ</button>
      </div>
    );
  }
}

// --- СТИЛИ ---
const containerStyle = { width: '100vw', height: '100vh', background: '#020617', color: 'white', padding: '40px', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, overflowY: 'auto', zIndex: 9999 };
const headerStyle = { color: '#38bdf8', borderBottom: '1px solid #1e293b', paddingBottom: '15px', marginBottom: '30px' };
const cardStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: '15px', padding: '30px', fontSize: '1.1rem', lineHeight: '1.6' };
const inputStyle = { width: '100%', padding: '20px', marginTop: '20px', background: '#000', border: '2px solid #38bdf8', color: 'white', fontSize: '1.5rem', borderRadius: '10px', textAlign: 'center', boxSizing: 'border-box' };
const btnPrimary = { width: '100%', padding: '20px', background: '#38bdf8', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', borderRadius: '10px', marginTop: '30px', cursor: 'pointer' };
const btnDisabled = { ...btnPrimary, background: '#1e293b', color: '#64748b', cursor: 'not-allowed' };