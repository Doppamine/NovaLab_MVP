import React, { useState, useMemo, useCallback } from 'react';
import ProgressBar, { PHASES } from './ui/ProgressBar.jsx';
import ParameterPanel from './ui/ParameterPanel.jsx';
import PhaseSetup from './phases/PhaseSetup.jsx';
import PhaseManual from './phases/PhaseManual.jsx';
import PhaseSimulate from './phases/PhaseSimulate.jsx';
import PhaseCompare from './phases/PhaseCompare.jsx';
import PhaseExplain from './phases/PhaseExplain.jsx';
import { runApollo15Scenario, CELESTIAL_GRAVITY } from '../../physics/index.js';

/**
 * Orchestrator — главный контроллер урока.
 *
 * Хранит:
 *  - current phase (setup → manual → simulate → compare → explain)
 *  - params (значения слайдеров, производные от scenario.parameters_ui.default)
 *  - studentAnswer
 *  - result (выход физ. ядра, кешируется между фазами Simulate→Compare→Explain)
 *
 * При переходе в фазу simulate запускает физ. ядро один раз и сохраняет результат.
 */
export default function LessonOrchestrator({ scenario, onBackToCatalog }) {
  const [phase, setPhase] = useState('setup');
  const [studentAnswer, setStudentAnswer] = useState(null);

  // Дефолтные значения параметров — из scenario
  const initialParams = useMemo(() => {
    const p = {};
    for (const cfg of scenario.parameters_ui) p[cfg.key] = cfg.default;
    // Заполняем производные поля (gravity_value)
    const gp = p['scene.gravity_preset'];
    p['scene.gravity_value'] = CELESTIAL_GRAVITY[gp]?.g ?? 9.80665;
    // Вакуум: автоматически обнуляем воздух
    if (gp === 'Moon' || gp === 'Pluto') {
      p['scene.air_density'] = 0;
    }
    return p;
  }, [scenario]);

  const [params, setParams] = useState(initialParams);

  const handleParamChange = useCallback((key, value) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      // Пересчёт производных
      if (key === 'scene.gravity_preset') {
        next['scene.gravity_value'] = CELESTIAL_GRAVITY[value]?.g ?? 9.80665;
        if (value === 'Moon' || value === 'Pluto' || value === 'Mars') {
          // Атмосфера других планет — для простоты: Луна=0, Марс=0.020, Плутон=0, Юпитер — очень плотная (не считаем)
          next['scene.air_density'] = value === 'Mars' ? 0.020 : 0;
        } else if (value === 'Earth') {
          next['scene.air_density'] = 1.225;
        }
      }
      return next;
    });
  }, []);

  const phaseIdx = PHASES.findIndex((p) => p.id === phase);

  // Запуск симуляции (при переходе в phase_3)
  const [result, setResult] = useState(null);
  const goToSimulate = useCallback(() => {
    const hammerObj = scenario.objects.find((o) => o.id === 'hammer');
    const featherObj = scenario.objects.find((o) => o.id === 'feather');
    const res = runApollo15Scenario({
      object1: {
        name: hammerObj.label,
        mass: params['objects.hammer.mass'] ?? hammerObj.mass,
        Cd: hammerObj.drag_coefficient,
        area: hammerObj.geometry.area_frontal,
      },
      object2: {
        name: featherObj.label,
        mass: params['objects.feather.mass'] ?? featherObj.mass,
        Cd: featherObj.drag_coefficient,
        area: featherObj.geometry.area_frontal,
      },
      environment: {
        g: params['scene.gravity_value'],
        rhoAir: params['scene.air_density'],
        h0: params['drop_height'],
      },
      tMax: scenario.solver.max_simulation_time,
      rtol: scenario.solver.relative_tolerance,
    });
    setResult(res);
    setPhase('simulate');
  }, [scenario, params]);

  // «Режим» для CSS: симуляция = mission control, остальные = blueprint
  const mode = phase === 'simulate' ? 'mission' : 'blueprint';

  const planetLabel = useMemo(() => {
    const gp = params['scene.gravity_preset'];
    return {
      Earth: 'Земля', Moon: 'Луна', Mars: 'Марс', Jupiter: 'Юпитер', Pluto: 'Плутон',
    }[gp] ?? gp;
  }, [params]);

  const restart = () => { setPhase('setup'); setStudentAnswer(null); setResult(null); };

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
              <span className="eyebrow">NovaLab · Physics</span>
              <h1 style={{ fontSize: '1.5rem' }}>{scenario.title}</h1>
            </div>
          </div>
          <ProgressBar current={phase} />
        </header>

        <div className="phase-panel">
          <main className="phase-primary">
            {phase === 'setup' && <PhaseSetup scenario={scenario} onNext={() => setPhase('manual')} />}
            {phase === 'manual' && (
              <PhaseManual
                scenario={scenario}
                studentAnswer={studentAnswer}
                setStudentAnswer={setStudentAnswer}
                onNext={goToSimulate}
              />
            )}
            {phase === 'simulate' && result && (
              <PhaseSimulate
                result={result}
                planetLabel={planetLabel}
                dropHeight={params['drop_height']}
                onNext={() => setPhase('compare')}
              />
            )}
            {phase === 'compare' && result && (
              <PhaseCompare
                studentAnswer={studentAnswer}
                result={result}
                scenario={scenario}
                params={params}
                onNext={() => setPhase('explain')}
              />
            )}
            {phase === 'explain' && result && (
              <PhaseExplain
                result={result}
                params={params}
                scenario={scenario}
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

            {phaseIdx >= 2 && result && (
              <section className="card">
                <div className="card-title">◉ Результаты</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                  <div>🔨 Молоток: <span style={{ color: 'var(--acc-gold)' }}>{result.object1.result.fall_time.toFixed(2)} с</span></div>
                  <div>🪶 Перо: <span style={{ color: 'var(--acc-gold)' }}>{result.object2.result.fall_time.toFixed(2)} с</span></div>
                  <div>Δt: <span style={{ color: Math.abs(result.object1.result.fall_time - result.object2.result.fall_time) > 0.1 ? 'var(--acc-red)' : 'var(--acc-teal)' }}>
                    {(result.object2.result.fall_time - result.object1.result.fall_time).toFixed(2)} с
                  </span></div>
                </div>
              </section>
            )}

            <section className="card">
              <div className="card-title">◉ Источники</div>
              <ul style={{ fontSize: '0.78rem', paddingLeft: 16, lineHeight: 1.6, opacity: 0.75 }}>
                {scenario.references.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
