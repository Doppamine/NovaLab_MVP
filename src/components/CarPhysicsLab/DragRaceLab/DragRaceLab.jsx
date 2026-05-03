import React, { useMemo, useState } from 'react';
import './DragRaceLab.css';
import DragRaceScene from './DragRaceScene';
import RaceGraph from './RaceGraph';
import { simulateDragRace } from '../../../physics';

const TRACK_LENGTH = 100; // metres — fixed for this lab

const LESSONS = {
  race: {
    id: 'race',
    label: '🏁 Race',
    title: 'Lesson A — Newton\'s 2nd Law',
    blurb: 'Adjust force and mass for each car. Acceleration a = F / m. The car with the higher acceleration wins.',
  },
  mystery: {
    id: 'mystery',
    label: '⚖️ Tie Mystery',
    title: 'Lesson B — Same Acceleration?',
    blurb: 'Predict the winner before each race. Even very different forces and masses can tie when F/m is equal.',
  },
};

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
  const [lesson, setLesson] = useState('race');

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

  // Mystery-mode predict-first state
  const [prediction, setPrediction] = useState(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState(null);

  const raceResult = useMemo(
    () =>
      simulateDragRace({
        carA: { force: forceA, mass: massA },
        carB: { force: forceB, mass: massB },
        trackLength: TRACK_LENGTH,
      }),
    [forceA, massA, forceB, massB],
  );

  const isMystery = lesson === 'mystery';
  const paramsChanged =
    isMystery &&
    baselineSnapshot &&
    (forceA !== baselineSnapshot.forceA ||
      massA !== baselineSnapshot.massA ||
      forceB !== baselineSnapshot.forceB ||
      massB !== baselineSnapshot.massB);
  const needsPrediction = paramsChanged && prediction === null;

  const handleLaunch = () => {
    if (needsPrediction) return;
    setSimulationState('running');
    setSimKey((k) => k + 1);
  };

  const handleReset = () => {
    setSimulationState('idle');
    setSimKey((k) => k + 1);
    setLiveSample({ t: 0, xA: 0, xB: 0, vA: 0, vB: 0 });
    if (isMystery) {
      setBaselineSnapshot({ forceA, massA, forceB, massB });
      setPrediction(null);
    }
  };

  const handleLessonSwitch = (id) => {
    setLesson(id);
    setSimulationState('idle');
    setSimKey((k) => k + 1);
    setLiveSample({ t: 0, xA: 0, xB: 0, vA: 0, vB: 0 });
    setPrediction(null);
    setBaselineSnapshot(null);
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
            <h3>{LESSONS[lesson].title}</h3>
            <p>{LESSONS[lesson].blurb}</p>
          </div>

          <div className="dr-lesson-tabs">
            {Object.values(LESSONS).map((l) => (
              <button
                key={l.id}
                type="button"
                className={`dr-lesson-tab ${lesson === l.id ? 'active' : ''}`}
                onClick={() => handleLessonSwitch(l.id)}
              >
                {l.label}
              </button>
            ))}
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

          {isMystery && needsPrediction && (
            <div className="dr-predict-card">
              <div className="dr-predict-question">
                You changed the parameters. Predict the winner before launching:
              </div>
              <div className="dr-predict-options">
                {Object.entries(PREDICTIONS).map(([id, p]) => (
                  <button
                    key={id}
                    type="button"
                    className={`dr-predict-btn ${prediction === id ? 'active' : ''}`}
                    onClick={() => setPrediction(id)}
                  >
                    <span className="dr-predict-symbol">{p.symbol}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {onExit && (
            <div className="crash-action-row" style={{ marginTop: '0.5rem' }}>
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
                <span className="dr-hud-value">a = {formatNum(raceResult.aA)} m/s²</span>
                <span className="dr-hud-sub">v = {formatNum(liveSample.vA, 1)} m/s</span>
              </div>
              <div className="dr-hud-tile dr-hud-tile-truck">
                <span className="dr-hud-label"><span style={{ color: '#5ab4ff' }}>●</span> Truck</span>
                <span className="dr-hud-value">a = {formatNum(raceResult.aB)} m/s²</span>
                <span className="dr-hud-sub">v = {formatNum(liveSample.vB, 1)} m/s</span>
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
                onClick={handleLaunch}
                disabled={needsPrediction}
                title={needsPrediction ? 'Make a prediction first' : ''}
              >
                🚦 Launch Race
              </button>
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

                {isMystery && prediction !== null && (
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
                      The Truck&apos;s engine is bigger, but its mass is bigger too. When the
                      ratio matches, accelerations match — and the race is a tie regardless of
                      how big the numbers get.
                    </p>
                  </div>
                )}

                {!isMystery && raceResult.winner === 'tie' && (
                  <p className="dr-explain">
                    Both cars have the same acceleration <code>a = F / m</code>, so they cross
                    the line at the same instant. The truck has more force AND more mass —
                    they cancel.
                  </p>
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
  const a = mass > 0 ? force / mass : 0;
  return (
    <div className={`dr-car-block dr-car-block-${color}`}>
      <div className="dr-car-block-header">
        <span className="dr-car-block-symbol">{symbol}</span>
        <span className="dr-car-block-name">{label}</span>
        <span className="dr-car-block-accel">a = {a.toFixed(2)} m/s²</span>
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
