import React, { useCallback, useMemo, useState } from 'react';
import ProgressBar, { PHASES } from '../ui/ProgressBar.jsx';
import ParameterPanel from '../ui/ParameterPanel.jsx';
import {
  COMBUSTION_MATERIALS,
  UNITS,
  simulateBurningStick,
} from '../../../physics/index.js';
import PhaseBurningSetup from './phases/PhaseBurningSetup.jsx';
import PhaseBurningManual from './phases/PhaseBurningManual.jsx';
import PhaseBurningSimulate from './phases/PhaseBurningSimulate.jsx';
import PhaseBurningCompare from './phases/PhaseBurningCompare.jsx';
import PhaseBurningExplain from './phases/PhaseBurningExplain.jsx';

function applyDerivedParams(inputParams) {
  const next = { ...inputParams };
  const material = COMBUSTION_MATERIALS[next['stick.material_preset']] ?? COMBUSTION_MATERIALS.pine_stick;
  const ignitionMode = next['ignition.mode'] ?? 'one_end';

  next['environment.ambient_temperature_k'] = UNITS.celsius_to_kelvin(next['environment.ambient_temperature_c']);
  next['ignition.count'] = ignitionMode === 'two_ends' ? 2 : 1;
  next['stick.density'] = material.density;
  next['stick.base_burn_rate'] = material.base_linear_burn_rate;
  next['stick.reference_radius'] = material.reference_radius;
  next['stick.ignition_temperature'] = material.ignition_temperature;
  next['stick.flame_temperature'] = material.flame_temperature;
  next['stick.heat_of_combustion'] = material.heat_of_combustion;

  return next;
}

export default function BurningStickOrchestrator({ scenario, onBackToCatalog }) {
  const [phase, setPhase] = useState('setup');
  const [studentAnswer, setStudentAnswer] = useState(null);
  const [result, setResult] = useState(null);

  const initialParams = useMemo(() => {
    const params = {};
    for (const entry of scenario.parameters_ui) params[entry.key] = entry.default;
    return applyDerivedParams(params);
  }, [scenario]);

  const [params, setParams] = useState(initialParams);

  const material = useMemo(
    () => COMBUSTION_MATERIALS[params['stick.material_preset']] ?? COMBUSTION_MATERIALS.pine_stick,
    [params]
  );

  const ignitionLabel = params['ignition.mode'] === 'two_ends'
    ? 'Поджиг с двух концов'
    : 'Поджиг с одного конца';

  const handleParamChange = useCallback((key, value) => {
    setParams((prev) => applyDerivedParams({ ...prev, [key]: value }));
  }, []);

  const goToSimulate = useCallback(() => {
    const simulation = simulateBurningStick({
      length: params['stick.length'],
      radius: params['stick.radius'],
      density: params['stick.density'],
      moistureFraction: params['stick.moisture_fraction'],
      oxygenFraction: params['environment.oxygen_fraction'],
      windSpeed: params['environment.wind_speed'],
      ambientTemperature: params['environment.ambient_temperature_k'],
      ignitionCount: params['ignition.count'],
      baseBurnRate: params['stick.base_burn_rate'],
      referenceRadius: params['stick.reference_radius'],
      ignitionTemperature: params['stick.ignition_temperature'],
      flameTemperature: params['stick.flame_temperature'],
      heatOfCombustion: params['stick.heat_of_combustion'],
      tMax: scenario.solver.max_simulation_time,
      rtol: scenario.solver.relative_tolerance,
      maxDt: scenario.solver.max_dt,
    });
    setResult(simulation);
    setPhase('simulate');
  }, [params, scenario]);

  const restart = () => {
    setPhase('setup');
    setStudentAnswer(null);
    setResult(null);
  };

  const mode = phase === 'simulate' ? 'mission' : 'blueprint';
  const phaseIdx = PHASES.findIndex((entry) => entry.id === phase);

  return (
    <div className={`physics-lab lab-mode-${mode}`}>
      <div className="lab-container">
        <header className="lab-header">
          <div className="lab-title-row">
            {onBackToCatalog && (
              <button className="btn btn-ghost btn-catalog-back" onClick={onBackToCatalog}>
                ← Все симуляции
              </button>
            )}
            <div className="lab-title">
              <span className="eyebrow">NovaLab · Burn Lab</span>
              <h1 style={{ fontSize: '1.5rem' }}>{scenario.title}</h1>
            </div>
          </div>
          <ProgressBar current={phase} />
        </header>

        <div className="phase-panel">
          <main className="phase-primary">
            {phase === 'setup' && (
              <PhaseBurningSetup scenario={scenario} onNext={() => setPhase('manual')} />
            )}

            {phase === 'manual' && (
              <PhaseBurningManual
                scenario={scenario}
                studentAnswer={studentAnswer}
                setStudentAnswer={setStudentAnswer}
                material={material}
                ignitionCount={params['ignition.count']}
                onNext={goToSimulate}
              />
            )}

            {phase === 'simulate' && result && (
              <PhaseBurningSimulate
                result={result}
                materialLabel={material.label}
                ignitionLabel={ignitionLabel}
                totalLength={params['stick.length']}
                onNext={() => setPhase('compare')}
              />
            )}

            {phase === 'compare' && result && (
              <PhaseBurningCompare
                studentAnswer={studentAnswer}
                result={result}
                scenario={scenario}
                params={params}
                onNext={() => setPhase('explain')}
              />
            )}

            {phase === 'explain' && result && (
              <PhaseBurningExplain
                result={result}
                params={params}
                scenario={scenario}
                material={material}
                ignitionCount={params['ignition.count']}
                onRestart={restart}
              />
            )}
          </main>

          <aside className="phase-aside">
            <ParameterPanel
              config={scenario.parameters_ui}
              values={params}
              onChange={handleParamChange}
              locked={phase === 'manual' || phase === 'simulate'}
            />

            <section className="card">
              <div className="card-title">◉ Материал и режим</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.75 }}>
                <div>{material.label}</div>
                <div>ρ = <span className="value">{material.density}</span> кг/м³</div>
                <div>v_base = <span className="value">{material.base_linear_burn_rate.toFixed(4)}</span> м/с</div>
                <div>{ignitionLabel}</div>
              </div>
            </section>

            {phaseIdx >= 2 && result && (
              <section className="card">
                <div className="card-title">◉ Итог симуляции</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                  <div>Время: <span className="value">{result.summary.burnout_time.toFixed(1)} с</span></div>
                  <div>Масса на старте: <span className="value">{(result.summary.initial_mass * 1000).toFixed(1)} г</span></div>
                  <div>Пик T: <span className="value">{(result.summary.peak_front_temperature - 273.15).toFixed(0)} °C</span></div>
                </div>
              </section>
            )}

            <section className="card">
              <div className="card-title">◉ Источники</div>
              <ul style={{ fontSize: '0.78rem', paddingLeft: 16, lineHeight: 1.6, opacity: 0.75 }}>
                {scenario.references.map((reference, index) => (
                  <li key={index}>{reference}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
