import React, { useMemo, useState } from 'react';
import './DragRaceLab.css';
import DragRaceScene from './DragRaceScene';
import RaceGraph from './RaceGraph';
import { simulateDragRace } from '../../../physics';

const TRACK_LENGTH = 100; // metres — fixed for this lab

const PREDICTIONS = {
  carA: { label: 'Car wins', symbol: '🏎️' },
  tie:  { label: 'It\'s a tie', symbol: '🎯' },
  carB: { label: 'Truck wins', symbol: '🚚' },
};

function formatNum(n, digits = 2) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

export default function DragRaceLab({ onExit }) {
  // Defaults tuned so a = F/m matches → a clean tie out of the box (the "wow")
  // Car A (sports car): 3000 N / 1000 kg = 3.0 m/s²
  // Car B (truck):      6000 N / 2000 kg = 3.0 m/s²
  const [forceA, setForceA] = useState(3000);
  const [massA, setMassA] = useState(1000);
  const [forceB, setForceB] = useState(6000);
  const [massB, setMassB] = useState(2000);

  const [simulationState, setSimulationState] = useState('idle');
  const [simKey, setSimKey] = useState(0);
  const [liveSample, setLiveSample] = useState({ t: 0, xA: 0, xB: 0, vA: 0, vB: 0 });

  // Predict-first state
  const [prediction, setPrediction] = useState(null);

  const raceResult = useMemo(
    () =>
      simulateDragRace({
        carA: { force: forceA, mass: massA },
        carB: { force: forceB, mass: massB },
        trackLength: TRACK_LENGTH,
      }),
    [forceA, massA, forceB, massB],
  );

  const handleLaunchClick = () => {
    setPrediction(null);
    setSimulationState('predicting');
  };

  const handlePredictAndLaunch = (id) => {
    setPrediction(id);
    setSimulationState('running');
    setSimKey((k) => k + 1);
  };

  const handleReset = () => {
    setSimulationState('idle');
    setSimKey((k) => k + 1);
    setLiveSample({ t: 0, xA: 0, xB: 0, vA: 0, vB: 0 });
    setPrediction(null);
  };

  const winnerKey =
    raceResult.winner === 'tie' ? 'tie' : raceResult.winner === 'A' ? 'carA' : 'carB';
  const predictionCorrect = prediction !== null && prediction === winnerKey;

  // Graph axes — keep stable across runs by computing from the precomputed samples
  const yMaxV = Math.max(raceResult.aA, raceResult.aB) *
    Math.max(raceResult.tA_finish, raceResult.tB_finish) * 1.05;
  const yMaxX = TRACK_LENGTH * 1.02;
  const xMaxT = Math.max(raceResult.tA_finish, raceResult.tB_finish) * 1.05;

  return (
    <div className="dr-lab">
      <main className="dr-lab-grid">
        {/* Left: Controls */}
        <section className="dr-panel controls-panel">
          <div className="dr-panel-header">
            <h3>Newton's 2nd Law & Tie Mystery</h3>
            <p>Predict the winner before each race. Even very different forces and masses can tie when F/m is equal.</p>
          </div>

          <div className="dr-assumption-callout">
            <span className="dr-assumption-pill">Idealized</span>
            Constant engine force · No friction · No air drag
          </div>

          <CarControls
            label="Car"
            symbol="🏎️"
            color="red"
            force={forceA}
            mass={massA}
            onForce={setForceA}
            onMass={setMassA}
            disabled={simulationState !== 'idle'}
          />

          <CarControls
            label="Truck"
            symbol="🚚"
            color="blue"
            force={forceB}
            mass={massB}
            onForce={setForceB}
            onMass={setMassB}
            disabled={simulationState !== 'idle'}
          />

          {onExit && (
            <div className="crash-action-row" style={{ marginTop: 'auto' }}>
              <button
                className="crash-btn crash-btn-exit"
                onClick={onExit}
                style={{ width: '100%' }}
              >
                Exit to Modules
              </button>
            </div>
          )}
        </section>

        {/* Right: 3D Stage */}
        <section className="dr-stage">
          <DragRaceScene
            raceResult={raceResult}
            simulationState={simulationState}
            simKey={simKey}
            onFinish={() => setSimulationState('finished')}
            onLiveSample={setLiveSample}
          />

          {/* Live HUD: graphs + accelerations */}
          <div className="dr-hud" aria-label="Race telemetry">
            <div className="dr-hud-row">
              <div className="dr-hud-tile dr-hud-tile-car">
                <span className="dr-hud-label"><span style={{ color: '#ff5a5a' }}>●</span> Car</span>
                <span className="dr-hud-value" style={{ color: '#fff', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.4)' }}>
                  v = {formatNum(liveSample.vA, 1)} m/s
                </span>
              </div>
              <div className="dr-hud-tile dr-hud-tile-truck">
                <span className="dr-hud-label"><span style={{ color: '#5ab4ff' }}>●</span> Truck</span>
                <span className="dr-hud-value" style={{ color: '#fff', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.4)' }}>
                  v = {formatNum(liveSample.vB, 1)} m/s
                </span>
              </div>
            </div>
            <div className="dr-hud-graphs">
              <div className="dr-hud-graph-block">
                <div className="dr-hud-graph-title">Distance vs time</div>
                <RaceGraph
                  samples={raceResult.samples}
                  currentT={liveSample.t}
                  yKeyA="xA"
                  yKeyB="xB"
                  yMax={yMaxX}
                  xMax={xMaxT}
                  yLabel="d"
                  unit="m"
                />
              </div>
              <div className="dr-hud-graph-block">
                <div className="dr-hud-graph-title">Velocity vs time</div>
                <RaceGraph
                  samples={raceResult.samples}
                  currentT={liveSample.t}
                  yKeyA="vA"
                  yKeyB="vB"
                  yMax={yMaxV}
                  xMax={xMaxT}
                  yLabel="v"
                  unit="m/s"
                />
              </div>
            </div>
          </div>

          {/* Floating Launch button */}
          {simulationState === 'idle' && (
            <div className="dr-stage-actions">
              <button
                type="button"
                className="dr-btn dr-btn-launch dr-btn-floating"
                onClick={handleLaunchClick}
              >
                🚦 Launch Race
              </button>
            </div>
          )}

          {/* Predicting Overlay */}
          {simulationState === 'predicting' && (
            <div className="dr-results-overlay">
              <div className="dr-results-modal">
                <h2 className="dr-results-header" style={{ marginBottom: '1.5rem', borderBottom: 'none' }}>
                  Who will win?
                </h2>
                <p style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#a1a1aa' }}>
                  You must lock in your prediction based on the parameters you set before the simulation can begin.
                </p>
                <div className="dr-predict-options" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  {Object.entries(PREDICTIONS).map(([id, p]) => (
                    <button
                      key={id}
                      type="button"
                      className="dr-predict-btn"
                      onClick={() => handlePredictAndLaunch(id)}
                      style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: '2.5rem' }}>{p.symbol}</span>
                      <span style={{ fontWeight: '500' }}>{p.label}</span>
                    </button>
                  ))}
                </div>
                <div className="dr-results-actions" style={{ marginTop: '2.5rem' }}>
                  <button
                    type="button"
                    className="dr-btn dr-btn-reset dr-btn-results-reset"
                    onClick={handleReset}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Overlay */}
          {simulationState === 'finished' && (
            <div className="dr-results-overlay">
              <div
                className={`dr-results-modal ${
                  raceResult.winner === 'tie' ? 'tie' : 'winner'
                }`}
              >
                <h2 className="dr-results-header">
                  {raceResult.winner === 'tie'
                    ? '🎯 It\'s a tie!'
                    : raceResult.winner === 'A'
                    ? '🏎️ The Car wins!'
                    : '🚚 The Truck wins!'}
                </h2>

                <div className="dr-results-stats">
                  <div className="dr-stat dr-stat-A">
                    <span className="dr-stat-label">🏎️ Car</span>
                    <span className="dr-stat-formula">a = F / m</span>
                    <span className="dr-stat-value">
                      {forceA} / {massA} = {formatNum(raceResult.aA)} m/s²
                    </span>
                    <span className="dr-stat-sub">
                      finished in {formatNum(raceResult.tA_finish)} s
                    </span>
                  </div>
                  <div className="dr-stat dr-stat-B">
                    <span className="dr-stat-label">🚚 Truck</span>
                    <span className="dr-stat-formula">a = F / m</span>
                    <span className="dr-stat-value">
                      {forceB} / {massB} = {formatNum(raceResult.aB)} m/s²
                    </span>
                    <span className="dr-stat-sub">
                      finished in {formatNum(raceResult.tB_finish)} s
                    </span>
                  </div>
                </div>

                <div className="dr-results-graphs">
                  <div className="dr-results-graph-block">
                    <div className="dr-results-graph-title">Distance vs time (m)</div>
                    <RaceGraph
                      samples={raceResult.samples}
                      currentT={raceResult.totalTime}
                      yKeyA="xA"
                      yKeyB="xB"
                      yMax={yMaxX}
                      xMax={xMaxT}
                      yLabel="d"
                      unit="m"
                      width={300}
                      height={140}
                    />
                  </div>
                  <div className="dr-results-graph-block">
                    <div className="dr-results-graph-title">Velocity vs time (m/s)</div>
                    <RaceGraph
                      samples={raceResult.samples}
                      currentT={raceResult.totalTime}
                      yKeyA="vA"
                      yKeyB="vB"
                      yMax={yMaxV}
                      xMax={xMaxT}
                      yLabel="v"
                      unit="m/s"
                      width={300}
                      height={140}
                    />
                  </div>
                </div>

                {prediction !== null && (
                  <div
                    className={`dr-mystery-reveal ${
                      predictionCorrect ? 'correct' : 'wrong'
                    }`}
                  >
                    <div className="dr-mystery-line">
                      You predicted: <strong>{PREDICTIONS[prediction].label}</strong>
                    </div>
                    <div className="dr-mystery-line">
                      Actual: <strong>{PREDICTIONS[winnerKey].label}</strong>
                    </div>
                    <p className="dr-mystery-explain">
                      The winner is whichever car has the larger <code>a = F / m</code>.
                      The Truck's engine is bigger, but its mass is bigger too. When the
                      ratio matches, accelerations match — and the race is a tie regardless of
                      how big the numbers get.
                    </p>
                  </div>
                )}

                <div className="dr-results-actions">
                  <button
                    type="button"
                    className="dr-btn dr-btn-reset dr-btn-results-reset"
                    onClick={handleReset}
                  >
                    ↺ Reset Race
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

function CarControls({ label, symbol, color, force, mass, onForce, onMass, disabled }) {
  return (
    <div className={`dr-car-block dr-car-block-${color}`}>
      <div className="dr-car-block-header">
        <span className="dr-car-block-symbol">{symbol}</span>
        <span className="dr-car-block-name">{label}</span>
      </div>

      <div className="dr-control-group">
        <div className="dr-control-label">
          <span>Engine Force (F)</span>
          <span className="dr-control-value">{force} N</span>
        </div>
        <input
          className={`dr-slider dr-slider-${color}`}
          type="range"
          min="500"
          max="10000"
          step="100"
          value={force}
          onChange={(e) => onForce(Number(e.target.value))}
          disabled={disabled}
        />
      </div>

      <div className="dr-control-group">
        <div className="dr-control-label">
          <span>Mass (m)</span>
          <span className="dr-control-value">{mass} kg</span>
        </div>
        <input
          className={`dr-slider dr-slider-${color}`}
          type="range"
          min="500"
          max="3500"
          step="50"
          value={mass}
          onChange={(e) => onMass(Number(e.target.value))}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
