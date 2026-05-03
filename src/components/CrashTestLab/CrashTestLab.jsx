import React, { useState } from 'react';
import './CrashTestLab.css';
import CrashTestScene from './CrashTestScene';

const BUMPERS = {
  rigid:    { name: 'Rigid Steel',      crumpleZone: 0.1, emoji: '🧱' },
  standard: { name: 'Standard Plastic', crumpleZone: 0.5, emoji: '🛡️' },
  foam:     { name: 'Soft Foam',        crumpleZone: 1.0, emoji: '🧽' },
};

const EGG_FORCE_LIMIT = 50000; // Newtons — threshold for egg survival

export default function CrashTestLab({ onCarLaunch }) {
  const [mass, setMass] = useState(1500);
  const [speed, setSpeed] = useState(15);
  const [bumperType, setBumperType] = useState('standard');
  const [simulationState, setSimulationState] = useState('idle');
  const [simKey, setSimKey] = useState(0);

  const bumper = BUMPERS[bumperType];
  const kineticEnergy = 0.5 * mass * Math.pow(speed, 2);
  const impactForce = kineticEnergy / bumper.crumpleZone;
  const isSafe = impactForce <= EGG_FORCE_LIMIT;

  // Force meter percentage (capped at 200% of limit for visual scale)
  const forcePct = Math.min(100, (impactForce / (EGG_FORCE_LIMIT * 2)) * 100);

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
      {/* ── Top Bar ── */}
      <header className="crash-lab-topbar">
        <div>
          <span className="crash-eyebrow">Kinematics & Momentum</span>
          <h2>Crash Test Facility</h2>
        </div>
        <div className="crash-lab-actions">
          {simulationState === 'idle' ? (
            <button className="crash-btn crash-btn-launch" onClick={handleLaunch}>
              🚀 Launch Test
            </button>
          ) : (
            <button className="crash-btn crash-btn-reset" onClick={handleReset}>
              ↺ Reset
            </button>
          )}
          {onCarLaunch && (
            <button className="crash-btn crash-btn-exit" onClick={onCarLaunch}>
              Exit
            </button>
          )}
        </div>
      </header>

      {/* ── Three-Column Layout ── */}
      <main className="crash-lab-grid">
        {/* Left: Controls */}
        <section className="crash-panel controls-panel">
          <div className="crash-panel-header">
            <h3>Vehicle Configuration</h3>
            <p>Adjust parameters to keep the impact force below {EGG_FORCE_LIMIT.toLocaleString()} N.</p>
          </div>

          <div className="crash-control-group">
            <div className="crash-control-label">
              <span>Mass</span>
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
              <span>Speed</span>
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
              <span>Bumper Type</span>
            </div>
            <div className="crash-bumper-options">
              {Object.entries(BUMPERS).map(([key, data]) => (
                <button
                  key={key}
                  className={`crash-bumper-btn ${bumperType === key ? 'active' : ''}`}
                  onClick={() => setBumperType(key)}
                  disabled={simulationState !== 'idle'}
                >
                  {data.emoji} {data.name} — {data.crumpleZone}m crumple
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Center: 3D Scene */}
        <section className="crash-stage">
          <CrashTestScene
            speed={speed}
            bumperDistance={bumper.crumpleZone}
            isSafe={isSafe}
            simulationState={simulationState}
            onFinish={() => setSimulationState('finished')}
            simKey={simKey}
          />
        </section>

        {/* Right: Telemetry */}
        <aside className="crash-panel telemetry-panel">
          <div className="crash-panel-header">
            <h3>Telemetry</h3>
          </div>

          <div className="crash-stat">
            <span className="crash-stat-label">Kinetic Energy (E_k)</span>
            <span className="crash-stat-formula">E_k = ½ × m × v²</span>
            <span className="crash-stat-value">{kineticEnergy.toLocaleString()} J</span>
          </div>

          <div className="crash-stat">
            <span className="crash-stat-label">Crumple Zone (d)</span>
            <span className="crash-stat-value">{bumper.crumpleZone} m</span>
          </div>

          <div className={`crash-stat ${isSafe ? 'crash-stat-safe' : 'crash-stat-danger'}`}>
            <span className="crash-stat-label">Impact Force (F)</span>
            <span className="crash-stat-formula">F = E_k ÷ d</span>
            <span className="crash-stat-value">{Math.round(impactForce).toLocaleString()} N</span>
          </div>

          {/* Visual force meter */}
          <div className="crash-force-meter">
            <div className="crash-meter-track">
              <div
                className={`crash-meter-fill ${isSafe ? 'safe' : 'danger'}`}
                style={{ width: `${forcePct}%` }}
              />
            </div>
            <div className="crash-meter-labels">
              <span>0 N</span>
              <span>{EGG_FORCE_LIMIT.toLocaleString()} N (limit)</span>
            </div>
          </div>

          <div className="crash-separator" />

          {/* Result banner */}
          {simulationState === 'finished' && (
            <div className={`crash-status-banner ${isSafe ? 'passed' : 'failed'}`}>
              {isSafe
                ? '✅ Test Passed! The egg survived.'
                : '💥 Test Failed! Impact force too high.'}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
