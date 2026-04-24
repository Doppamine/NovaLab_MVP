import React, { useState } from 'react';
import Header from './components/Constructor/Header';
import PartsPanel from './components/PartsPanel/PartsPanel';
import WorkArea from './components/WorkArea/WorkArea';
import CarDemo3D from './components/CarDemo3D/CarDemo3D';
import Car3DConstructor from './components/Car3DConstructor/Car3DConstructor';
import RocketConstructor from './components/RocketConstructor/RocketConstructor';
import CarVRConstructor from './features/car-vr-constructor/CarVRConstructor';
import WaterModuleRouter from './components/WaterModule/WaterModuleRouter';
import PhysicsRouter from './components/PhysicsModule/PhysicsRouter';

import PhysicsLab from './components/PhysicsLab/PhysicsLab';
import AetherLabModule from './components/AetherLab/AetherLabModule';

import './App.css';

function App() {
  const [showCarDemo, setShowCarDemo] = useState(false);

  const [showPhysicsLab, setShowPhysicsLab] = useState(false);
  const [showAetherLab, setShowAetherLab] = useState(false);

  const [mode, setMode] = useState('2d');
  const [mode3d, setMode3d] = useState('car');
  const [isVRMode, setIsVRMode] = useState(false);

  const handleCarLaunch = () => setShowCarDemo(true);
  const handleCarDemoComplete = () => setShowCarDemo(false);

  return (
    <div className="app">

      {/* 1. ЭКРАН НОВОЙ ЛАБОРАТОРИИ (APOLLO 15) */}
      {showPhysicsLab && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10000,
          background: '#0a1220', // Цвет из палитры лабы
          overflowY: 'auto',     // РАЗРЕШАЕМ СКРОЛЛ ТУТ
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Кнопка выхода — зафиксирована, чтобы не уплывала при скролле */}
          <button
            onClick={() => setShowPhysicsLab(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '40px',
              zIndex: 10001,
              padding: '12px 24px',
              background: '#c85c3c',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              fontFamily: 'sans-serif'
            }}
          >
            ✖ ВЫЙТИ ИЗ МИССИИ
          </button>
          <PhysicsLab />
        </div>
      )}

      {showAetherLab && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000 }}>
          <AetherLabModule onClose={() => setShowAetherLab(false)} />
        </div>
      )}

      {/* 2. ОСТАЛЬНОЙ КОНТЕНТ (СКРЫВАЕМ, КОГДА ОТКРЫТА ЛАБА) */}
      {!showPhysicsLab && !showAetherLab && (
        <>
          {showCarDemo ? (
            <CarDemo3D onComplete={handleCarDemoComplete} />
          ) : (
            <>
              <Header>
                <div className="mode-tabs">
                  <button className={`tab-btn ${mode === '2d' ? 'active' : ''}`} onClick={() => setMode('2d')}>2D Конструктор</button>
                  <button className={`tab-btn ${mode === '3d' ? 'active' : ''}`} onClick={() => setMode('3d')}>3D Конструктор ✨</button>
                  <button className={`tab-btn ${mode === 'physics' ? 'active' : ''}`} onClick={() => setMode('physics')}>⚛️ Физика (7 кл)</button>

                  <button
                    className="tab-btn"
                    onClick={() => setShowPhysicsLab(true)}
                    style={{ background: '#e8b54a', color: '#000', marginLeft: '30px', fontWeight: 'bold' }}
                  >
                    🚀 Apollo 15 Lab
                  </button>
                  <button
                    className="tab-btn"
                    onClick={() => setShowAetherLab(true)}
                    style={{ background: '#7cffc9', color: '#03111a', fontWeight: 'bold' }}
                  >
                    ⚡ Aether VR Lab
                  </button>
                </div>

                {mode === '3d' && (
                  <div className="mode-tabs sub-tabs">
                    <button className={`tab-btn sub ${mode3d === 'car' ? 'active' : ''}`} onClick={() => setMode3d('car')}>🚗 Машина</button>
                    <button className={`tab-btn sub ${mode3d === 'rocket' ? 'active' : ''}`} onClick={() => setMode3d('rocket')}>🚀 Ракета</button>
                    <button className={`tab-btn sub ${mode3d === 'water' ? 'active' : ''}`} onClick={() => setMode3d('water')}>💧 Вода</button>
                    {mode3d === 'car' && (
                      <button 
                        className={`tab-btn sub ${isVRMode ? 'active' : ''}`}
                        onClick={() => setIsVRMode(!isVRMode)}
                        style={{ background: isVRMode ? '#9d4edd' : 'rgba(157,78,221,0.1)' }}
                      >
                        🥽 VR Режим
                      </button>
                    )}
                  </div>
                )}
              </Header>

              <main className="main-content">
                {mode === 'physics' ? (
                  <PhysicsRouter />
                ) : mode === '2d' ? (
                  <div className="main-layout">
                    <PartsPanel />
                    <WorkArea onCarLaunch={handleCarLaunch} />
                  </div>
                ) : mode3d === 'car' ? (
                  isVRMode ? (
                    <CarVRConstructor onCarLaunch={handleCarLaunch} />
                  ) : (
                    <Car3DConstructor onCarLaunch={handleCarLaunch} />
                  )
                ) : mode3d === 'rocket' ? (
                  <RocketConstructor onLaunch={() => alert('Полет на Луну скоро!')} />
                ) : (
                  <WaterModuleRouter />
                )}
              </main>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
