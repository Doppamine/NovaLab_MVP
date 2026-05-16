import React, { useMemo, useState } from 'react';
import './StuntJumpLab.css';
import StuntJumpScene from './StuntJumpScene';
import { simulateStuntJump, GRAVITY_PRESETS } from '../../../physics';
import { useLocale } from '../../../i18n/LocalizationContext';

const LESSONS = {
  conservation: {
    id: 'conservation',
    label: 'Conservation',
    title: 'Lesson A - Energy Conservation',
    blurb: 'Watch potential energy turn into kinetic energy as the car rolls down. Total energy never changes.',
  },
  mystery: {
    id: 'mystery',
    label: 'Mass Mystery',
    title: 'Lesson B - Does Mass Matter?',
    blurb: 'Predict before you launch. Will a heavier car jump further? Same? Shorter?',
  },
};

const PREDICTIONS = {
  further: { label: 'Further', symbol: '➡️' },
  same:    { label: 'Same spot', symbol: '🎯' },
  shorter: { label: 'Shorter', symbol: '⬅️' },
};

// Returns the actual prediction outcome for the trick question.
// On a frictionless ramp with same-height landing, both mass and gravity cancel
// → the car always lands in the same spot for fixed h, α, canyon.
function expectedPrediction(prevRange, nextRange) {
  const delta = nextRange - prevRange;
  if (Math.abs(delta) < 0.01) return 'same';
  return delta > 0 ? 'further' : 'shorter';
}

export default function StuntJumpLab({ onExit }) {
  const { t } = useLocale();
  const [lesson, setLesson] = useState('conservation');
  const [height, setHeight] = useState(20);            // metres
  const [mass, setMass] = useState(1500);              // kg
  const [gravityId, setGravityId] = useState('earth');
  const [canyonWidth, setCanyonWidth] = useState(18);  // metres

  const [simulationState, setSimulationState] = useState('idle');
  const [simKey, setSimKey] = useState(0);
  const [liveSample, setLiveSample] = useState(null);

  // Mystery-mode predict-first state
  const [prediction, setPrediction] = useState(null);
  const [prevRange, setPrevRange] = useState(null);
  const [prevMass, setPrevMass] = useState(null);

  const gravity = GRAVITY_PRESETS[gravityId];

  const jumpResult = useMemo(() => {
    return simulateStuntJump({
      height,
      mass,
      gravity: gravity.g,
      canyonWidth,
    });
  }, [height, mass, gravity.g, canyonWidth]);

  const totalEnergy = jumpResult.totalEnergy;
  const live = liveSample ?? jumpResult.samples[0];
  const livePE = Math.max(0, Math.min(totalEnergy, live.pe));
  const liveKE = Math.max(0, Math.min(totalEnergy, live.ke));
  const pePct = totalEnergy > 0 ? (livePE / totalEnergy) * 100 : 0;
  const kePct = totalEnergy > 0 ? (liveKE / totalEnergy) * 100 : 0;

  const isMystery = lesson === 'mystery';
  const needsPrediction =
    isMystery && prevRange !== null && prevMass !== null && prevMass !== mass && prediction === null;

  const handleLaunch = () => {
    if (needsPrediction) return;
    setSimulationState('running');
    setSimKey((k) => k + 1);
  };

  const handleReset = () => {
    setSimulationState('idle');
    setSimKey((k) => k + 1);
    setLiveSample(null);
    if (isMystery) {
      // Remember last range/mass so the next mass change can be measured
      setPrevRange(jumpResult.range);
      setPrevMass(mass);
      setPrediction(null);
    }
  };

  const handleLessonSwitch = (id) => {
    setLesson(id);
    setSimulationState('idle');
    setSimKey((k) => k + 1);
    setLiveSample(null);
    setPrediction(null);
    setPrevRange(null);
    setPrevMass(null);
  };

  const massChanged = isMystery && prevMass !== null && prevMass !== mass;
  const actualOutcome =
    isMystery && prevRange !== null
      ? expectedPrediction(prevRange, jumpResult.range)
      : null;
  const predictionCorrect =
    actualOutcome !== null && prediction !== null && prediction === actualOutcome;

  return (
    <div className="stunt-lab">
      <main className="stunt-lab-grid">
        {/* Left: Controls */}
        <section className="stunt-panel controls-panel">
          <div className="stunt-panel-header">
            <h3>{t(LESSONS[lesson].title)}</h3>
            <p>{t(LESSONS[lesson].blurb)}</p>
          </div>

          <div className="stunt-lesson-tabs">
            {Object.values(LESSONS).map((l) => (
              <button
                key={l.id}
                type="button"
                className={`stunt-lesson-tab ${lesson === l.id ? 'active' : ''}`}
                onClick={() => handleLessonSwitch(l.id)}
              >
                {l.id === 'conservation' ? '🔋 ' : '⚖️ '}{t(l.label)}
              </button>
            ))}
          </div>

          <div className="stunt-assumption-callout">
            <span className="stunt-assumption-pill">{t('Idealized')}</span>
            {t('Frictionless track · No air drag')}
          </div>

          <div className="stunt-control-group">
            <div className="stunt-control-label">
              <span>{t('Starting Height (h)')}</span>
              <span className="stunt-control-value">{height} m</span>
            </div>
            <input
              className="stunt-slider"
              type="range"
              min="5"
              max="60"
              step="1"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              disabled={simulationState !== 'idle'}
            />
          </div>

          <div className="stunt-control-group">
            <div className="stunt-control-label">
              <span>{t('Canyon Gap')}</span>
              <span className="stunt-control-value">{canyonWidth} m</span>
            </div>
            <input
              className="stunt-slider"
              type="range"
              min="4"
              max="50"
              step="1"
              value={canyonWidth}
              onChange={(e) => setCanyonWidth(Number(e.target.value))}
              disabled={simulationState !== 'idle'}
            />
          </div>

          <div className="stunt-control-group">
            <div className="stunt-control-label"><span>{t('Gravity (g)')}</span></div>
            <div className="stunt-gravity-options">
              {Object.values(GRAVITY_PRESETS).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`stunt-gravity-btn ${gravityId === g.id ? 'active' : ''}`}
                  onClick={() => setGravityId(g.id)}
                  disabled={simulationState !== 'idle'}
                >
                  <span className="stunt-gravity-symbol">{g.symbol}</span>
                  <span className="stunt-gravity-name">{g.name}</span>
                  <span className="stunt-gravity-value">{g.g} m/s²</span>
                </button>
              ))}
            </div>
          </div>

          {isMystery && (
            <div className="stunt-control-group">
              <div className="stunt-control-label">
                <span>{t('Car Mass (m)')}</span>
                <span className="stunt-control-value">{mass} kg</span>
              </div>
              <input
                className="stunt-slider stunt-slider-mystery"
                type="range"
                min="500"
                max="3500"
                step="100"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                disabled={simulationState !== 'idle'}
              />
            </div>
          )}

          {isMystery && needsPrediction && (
            <div className="stunt-predict-card">
              <div className="stunt-predict-question">
                {t('You just changed mass')} {prevMass} kg → {mass} kg. {t('Will the car land...')}
              </div>
              <div className="stunt-predict-options">
                {Object.entries(PREDICTIONS).map(([id, p]) => (
                  <button
                    key={id}
                    type="button"
                    className={`stunt-predict-btn ${prediction === id ? 'active' : ''}`}
                    onClick={() => setPrediction(id)}
                  >
                    <span className="stunt-predict-symbol">{p.symbol}</span>
                    {t(p.label)}
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
                {t('Exit to Modules')}
              </button>
            </div>
          )}
        </section>

        {/* Right: 3D Stage */}
        <section className="stunt-stage">
          <StuntJumpScene
            jumpResult={jumpResult}
            simulationState={simulationState}
            simKey={simKey}
            onFinish={() => setSimulationState('finished')}
            onLiveSample={setLiveSample}
          />

          {/* Energy Bars HUD */}
          <div className="stunt-energy-hud" aria-label={t('Energy bars')}>
            <div className="stunt-energy-title">{t('Energy')}</div>
            <div className="stunt-energy-bars">
              <EnergyBar
                label="PE"
                color="blue"
                pct={pePct}
                value={livePE}
              />
              <EnergyBar
                label="KE"
                color="orange"
                pct={kePct}
                value={liveKE}
              />
              <EnergyBar
                label="Total"
                color="grey"
                pct={100}
                value={totalEnergy}
                static
              />
            </div>
            <div className="stunt-energy-formula">
              PE = m·g·h &nbsp;·&nbsp; KE = ½·m·v²
            </div>
          </div>

          {/* Floating Launch button */}
          {simulationState === 'idle' && (
            <div className="stunt-stage-actions">
              <button
                type="button"
                className="stunt-btn stunt-btn-launch stunt-btn-floating"
                onClick={handleLaunch}
                disabled={needsPrediction}
                title={needsPrediction ? t('Make a prediction first') : ''}
              >
                🚀 {t('Launch Jump')}
              </button>
            </div>
          )}

          {/* Results Overlay */}
          {simulationState === 'finished' && (
            <div className="stunt-results-overlay">
              <div
                className={`stunt-results-modal ${
                  jumpResult.cleared ? 'passed' : 'failed'
                }`}
              >
                <h2 className="stunt-results-header">
                  {jumpResult.cleared
                    ? t('🏁 Cleared the canyon!')
                    : t('💥 Fell short - into the canyon!')}
                </h2>

                <div className="stunt-results-stats">
                  <div className="stunt-stat">
                    <span className="stunt-stat-label">{t('Launch Speed (v)')}</span>
                    <span className="stunt-stat-formula">v = √(2·g·h)</span>
                    <span className="stunt-stat-value">
                      {jumpResult.launchSpeed.toFixed(1)} m/s
                    </span>
                  </div>
                  <div className="stunt-stat">
                    <span className="stunt-stat-label">{t('Total Energy')}</span>
                    <span className="stunt-stat-formula">E = m·g·h</span>
                    <span className="stunt-stat-value">
                      {Math.round(totalEnergy).toLocaleString()} J
                    </span>
                  </div>
                  <div
                    className={`stunt-stat ${
                      jumpResult.cleared ? 'stunt-stat-safe' : 'stunt-stat-danger'
                    }`}
                  >
                    <span className="stunt-stat-label">{t('Range vs Canyon')}</span>
                    <span className="stunt-stat-formula">R = 2·h·sin(2α)</span>
                    <span className="stunt-stat-value">
                      {jumpResult.range.toFixed(1)} m / {canyonWidth} m
                    </span>
                  </div>
                </div>

                {isMystery && actualOutcome !== null && massChanged && (
                  <div
                    className={`stunt-mystery-reveal ${
                      predictionCorrect ? 'correct' : 'wrong'
                    }`}
                  >
                    <div className="stunt-mystery-line">
                      {t('You predicted:')} <strong>{t(PREDICTIONS[prediction]?.label || '—')}</strong>
                    </div>
                    <div className="stunt-mystery-line">
                      {t('Actual:')} <strong>{t(PREDICTIONS[actualOutcome].label)}</strong>
                    </div>
                    <p className="stunt-mystery-explain">
                      {t("Even though the car's energy changed by")} {Math.abs(prevMass - mass)} kg of{' '}
                      {t('mass, both PE = m·g·h and KE = ½·m·v² scale with m. The masses cancel:')}{' '}
                      <code>v = √(2gh)</code>. {t('The car always reaches the lip at the')}{' '}
                      <strong>{t('same speed')}</strong> - {t('and lands in the')}{' '}
                      <strong>{t('same spot')}</strong>.
                    </p>
                  </div>
                )}

                {!isMystery && (
                  <p className="stunt-explain">
                    {t('PE turned into KE as the car rolled. The total energy bar never moved - energy did not disappear, it just changed form.')}
                  </p>
                )}

                <div className="stunt-results-actions">
                  <button
                    type="button"
                    className="stunt-btn stunt-btn-reset stunt-btn-results-reset"
                    onClick={handleReset}
                  >
                    {t('↺ Reset Jump')}
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

function EnergyBar({ label, color, pct, value, static: isStatic }) {
  return (
    <div className={`stunt-bar stunt-bar-${color} ${isStatic ? 'is-static' : ''}`}>
      <div className="stunt-bar-track">
        <div className="stunt-bar-fill" style={{ height: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <div className="stunt-bar-label">{label}</div>
      <div className="stunt-bar-value">
        {value > 9999 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)} J
      </div>
    </div>
  );
}
