import React, { useState } from 'react';
import './CrashTestLab.css';
import CrashTestScene from './CrashTestScene';
import ForceGraph from './ForceGraph';
import { useLocale } from '../../../i18n/LocalizationContext';

const BUMPERS = {
  rigid:    { name: 'Rigid Steel',      crumpleZone: 0.1, emoji: '🧱' },
  standard: { name: 'Standard Plastic', crumpleZone: 0.5, emoji: '🛡️' },
  foam:     { name: 'Soft Foam',        crumpleZone: 1.0, emoji: '🧽' },
};

const EGG_FORCE_LIMIT = 50000; // Newtons — threshold for egg survival

export default function CrashTestLab({ onExit }) {
  const { t } = useLocale();
  const [mass, setMass] = useState(1500);
  const [speed, setSpeed] = useState(15);
  const [bumperType, setBumperType] = useState('standard');
  const [simulationState, setSimulationState] = useState('idle');
  const [simKey, setSimKey] = useState(0);

  const bumper = BUMPERS[bumperType];
  const kineticEnergy = 0.5 * mass * Math.pow(speed, 2);
  const impactForce = kineticEnergy / bumper.crumpleZone;
  const isSafe = impactForce <= EGG_FORCE_LIMIT;

  const handleLaunch = () => {
    setSimulationState('running');
    setSimKey((prev) => prev + 1);
  };

  const handleReset = () => {
    setSimulationState('idle');
    setSimKey((prev) => prev + 1);
  };

  return (
    <div className="crash-test-lab">
      {/* ── Two-Column Layout ── */}
      <main className="crash-lab-grid">
        {/* Left: Controls */}
        <section className="crash-panel controls-panel">
          <div className="crash-panel-header">
            <h3>{t('Vehicle Configuration')}</h3>
            <p>{t('Adjust parameters to keep the impact force below')} {EGG_FORCE_LIMIT.toLocaleString()} N.</p>
          </div>

          <div className="crash-control-group">
            <div className="crash-control-label">
              <span>{t('Mass')}</span>
              <span className="crash-control-value">{mass} kg</span>
            </div>
            <input
              className="crash-slider"
              type="range"
              min="500"
              max="3000"
              step="100"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              disabled={simulationState !== 'idle'}
            />
          </div>

          <div className="crash-control-group">
            <div className="crash-control-label">
              <span>{t('Speed')}</span>
              <span className="crash-control-value">{speed} m/s</span>
            </div>
            <input
              className="crash-slider"
              type="range"
              min="5"
              max="40"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={simulationState !== 'idle'}
            />
          </div>

          <div className="crash-separator" />

          <div className="crash-control-group">
            <div className="crash-control-label">
              <span>{t('Bumper Type')}</span>
            </div>
            <div className="crash-bumper-options">
              {Object.entries(BUMPERS).map(([key, data]) => (
                <button
                  key={key}
                  className={`crash-bumper-btn ${bumperType === key ? 'active' : ''}`}
                  onClick={() => setBumperType(key)}
                  disabled={simulationState !== 'idle'}
                >
                  {data.emoji} {t(data.name)} - {data.crumpleZone}m {t('crumple')}
                </button>
              ))}
            </div>
          </div>

          {onExit && (
            <div className="crash-action-row" style={{ marginTop: '0.5rem' }}>
                <button className="crash-btn crash-btn-exit" onClick={onExit} style={{ width: '100%' }}>
                  {t('Exit to Modules')}
                </button>
            </div>
          )}
        </section>

        {/* Right: 3D Scene with floating actions + results overlay */}
        <section className="crash-stage">
          <CrashTestScene
            speed={speed}
            bumperDistance={bumper.crumpleZone}
            isSafe={isSafe}
            simulationState={simulationState}
            onFinish={() => setSimulationState('finished')}
            simKey={simKey}
          />

          {simulationState === 'idle' && (
            <div className="crash-stage-actions">
              <button className="crash-btn crash-btn-launch crash-btn-floating" onClick={handleLaunch}>
                🚀 {t('Launch Test')}
              </button>
            </div>
          )}

          {simulationState === 'finished' && (
            <div className="crash-results-overlay">
              <div className={`crash-results-modal ${isSafe ? 'passed' : 'failed'}`}>
                <h2 className="crash-results-header">
                  {isSafe
                    ? t('✅ Test Passed! The egg survived.')
                    : t('💥 Test Failed! Impact force too high.')}
                </h2>

                <ForceGraph
                  impactForce={impactForce}
                  crumpleZone={bumper.crumpleZone}
                  speed={speed}
                  isSafe={isSafe}
                  forceLimit={EGG_FORCE_LIMIT}
                />

                <div className="crash-results-stats">
                  <div className="crash-stat">
                    <span className="crash-stat-label">{t('Kinetic Energy (E_k)')}</span>
                    <span className="crash-stat-formula">E_k = ½ × m × v²</span>
                    <span className="crash-stat-value">{kineticEnergy.toLocaleString()} J</span>
                  </div>

                  <div className="crash-stat">
                    <span className="crash-stat-label">{t('Crumple Zone (d)')}</span>
                    <span className="crash-stat-value">{bumper.crumpleZone} m</span>
                  </div>

                  <div className={`crash-stat ${isSafe ? 'crash-stat-safe' : 'crash-stat-danger'}`}>
                    <span className="crash-stat-label">{t('Impact Force (F)')}</span>
                    <span className="crash-stat-formula">F = E_k ÷ d</span>
                    <span className="crash-stat-value">{Math.round(impactForce).toLocaleString()} N</span>
                  </div>
                </div>

                <div className="crash-results-actions">
                  <button
                    className="crash-btn crash-btn-reset crash-btn-results-reset"
                    onClick={handleReset}
                  >
                    {t('↺ Reset Test')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
