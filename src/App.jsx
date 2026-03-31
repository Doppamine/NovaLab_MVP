import React, { useState } from 'react';
import Header from './components/Constructor/Header';
import PartsPanel from './components/PartsPanel/PartsPanel';
import WorkArea from './components/WorkArea/WorkArea';
import CarDemo3D from './components/CarDemo3D/CarDemo3D';
import Car3DConstructor from './components/Car3DConstructor/Car3DConstructor';
import RocketConstructor from './components/RocketConstructor/RocketConstructor';
import WaterModuleRouter from './components/WaterModule/WaterModuleRouter';
import './App.css';

function App() {
  const [showCarDemo, setShowCarDemo] = useState(false);
  const [mode, setMode] = useState('2d'); // '2d' или '3d'
  const [mode3d, setMode3d] = useState('car'); // 'car' или 'rocket' (внутри 3D)

  const handleCarLaunch = () => {
    setShowCarDemo(true);
  };

  const handleCarDemoComplete = () => {
    setShowCarDemo(false);
  };

  return (
    <div className="app">
      {showCarDemo ? (
        <CarDemo3D onComplete={handleCarDemoComplete} />
      ) : (
        <>
          <Header>
            {/* Переключатель режимов */}
            <div className="mode-tabs">
              <button
                className={`tab-btn ${mode === '2d' ? 'active' : ''}`}
                onClick={() => setMode('2d')}
              >
                2D Режим
              </button>
              <button
                className={`tab-btn ${mode === '3d' ? 'active' : ''}`}
                onClick={() => setMode('3d')}
              >
                3D Режим ✨
              </button>
            </div>

            {/* Вложенные вкладки для 3D режима */}
            {mode === '3d' && (
              <div className="mode-tabs sub-tabs">
                <button
                  className={`tab-btn sub ${mode3d === 'car' ? 'active' : ''}`}
                  onClick={() => setMode3d('car')}
                >
                  🚗 Машина
                </button>
                <button
                  className={`tab-btn sub ${mode3d === 'rocket' ? 'active' : ''}`}
                  onClick={() => setMode3d('rocket')}
                >
                  🚀 Ракета
                </button>
                <button
                  className={`tab-btn sub ${mode3d === 'water' ? 'active' : ''}`}
                  onClick={() => setMode3d('water')}
                >
                  💧 Вода
                </button>
              </div>
            )}
          </Header>

          {mode === '2d' ? (
            <div className="main-layout">
              <PartsPanel />
              <WorkArea onCarLaunch={handleCarLaunch} />
            </div>
          ) : mode3d === 'car' ? (
            <Car3DConstructor onCarLaunch={handleCarLaunch} />
          ) : mode3d === 'rocket' ? (
            <RocketConstructor onLaunch={() => alert('Полет на Луну скоро!')} />
          ) : (
            <WaterModuleRouter />
          )}
        </>
      )}
    </div>
  );
}

export default App;
