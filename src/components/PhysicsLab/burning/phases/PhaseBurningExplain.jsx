import React, { useMemo, useState } from 'react';
import WiggleParam from '../../ui/WiggleParam.jsx';
import { simulateBurningStick } from '../../../../physics/index.js';

const LEVELS = [
  { id: 1, label: '01 · Словами' },
  { id: 2, label: '02 · Оценка' },
  { id: 3, label: '03 · Модель' },
  { id: 4, label: '04 · RK4' },
];

export default function PhaseBurningExplain({
  result,
  params,
  scenario,
  material,
  ignitionCount,
  onRestart,
}) {
  const [level, setLevel] = useState(scenario.lesson_flow.phase_5_explain.default_level || 2);
  const [wiggleParams, setWiggleParams] = useState({
    oxygen_fraction: params['environment.oxygen_fraction'],
    wind_speed: params['environment.wind_speed'],
    moisture_fraction: params['stick.moisture_fraction'],
    radius: params['stick.radius'],
  });

  const wiggled = useMemo(() => simulateBurningStick({
    length: params['stick.length'],
    radius: wiggleParams.radius,
    density: material.density,
    moistureFraction: wiggleParams.moisture_fraction,
    oxygenFraction: wiggleParams.oxygen_fraction,
    windSpeed: wiggleParams.wind_speed,
    ambientTemperature: params['environment.ambient_temperature_k'],
    ignitionCount,
    baseBurnRate: material.base_linear_burn_rate,
    referenceRadius: material.reference_radius,
    ignitionTemperature: material.ignition_temperature,
    flameTemperature: material.flame_temperature,
    heatOfCombustion: material.heat_of_combustion,
    tMax: scenario.solver.max_simulation_time,
    rtol: scenario.solver.relative_tolerance,
    maxDt: scenario.solver.max_dt,
  }), [wiggleParams, params, material, ignitionCount, scenario]);

  return (
    <div>
      <div className="eyebrow">Фаза 05 / Объяснение формулы</div>
      <h2 style={{ marginTop: 8, marginBottom: 20 }}>Как эта палка горит под капотом</h2>

      <div className="explain-tabs">
        {LEVELS.map((entry) => (
          <button
            key={entry.id}
            className={`tab ${level === entry.id ? 'active' : ''}`}
            onClick={() => setLevel(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {level === 1 && (
        <div style={{ fontSize: '1.04rem', lineHeight: 1.7, maxWidth: 760 }}>
          <p>Палка горит потому, что фронт пламени непрерывно прогревает следующий кусок материала до температуры воспламенения. Если тепла хватает, фронт двигается дальше. Если кислорода мало или материал мокрый, фронт замедляется.</p>
          <p>Поэтому время горения управляется не одной цифрой, а балансом факторов: чем палка толще, тем больше массы приходится прогревать; чем влажнее палка, тем больше энергии уходит на сушку; чем больше кислорода и обдува, тем устойчивее и горячее пламя.</p>
          <p>Поджиг с двух концов ускоряет процесс почти вдвое не потому, что палка “горит сильнее”, а потому что путь каждого фронта вдвое короче.</p>
        </div>
      )}

      {level === 2 && (
        <div>
          <h3>Грубая оценка</h3>
          <div className="formula-block">
            t ≈ L / (n · v<sub>base</sub>)
          </div>
          <p className="hint-text">
            Это полезная инженерная прикидка. Но она считает, что фронт сразу работает на полной
            скорости, а среда всегда одинаково хорошо питает горение.
          </p>

          <h3 style={{ marginTop: 24 }}>Почему симуляция уходит от оценки</h3>
          <div className="formula-block">
            v<sub>burn</sub> = v<sub>base</sub> · f(r) · f(w) · f(O₂) · f(T)
          </div>
          <p className="hint-text">
            Здесь и сидит вся физика: радиус меняет массу на метр длины, влажность съедает часть тепла,
            кислород влияет на устойчивость пламени, а температура определяет, разогнался ли фронт до
            рабочего режима.
          </p>
        </div>
      )}

      {level === 3 && (
        <div>
          <h3>Система уравнений</h3>
          <div className="formula-block">
            dx/dt = v<sub>burn</sub>(T, λ)<br />
            dT/dt = (T<sub>target</sub> − T) / τ<sub>T</sub><br />
            dλ/dt = (λ<sub>target</sub> − λ) / τ<sub>O₂</sub>
          </div>

          <p className="hint-text">
            Вместо одной “волшебной скорости” у нас есть фронт, который сначала разогревается,
            выходит на более устойчивое горение, а потом уже движется почти равномерно.
          </p>

          <h3 style={{ marginTop: 20 }}>Что именно подставлено в этот запуск</h3>
          <table className="compare-table">
            <tbody>
              {Object.entries(result.formula_trace.substitutions).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td className="value">{typeof value === 'number' ? value.toPrecision(6) : String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>Ограничения модели</h3>
          <ul style={{ lineHeight: 1.7 }}>
            {scenario.assumptions.map((item, index) => (
              <li key={index} className="hint-text">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {level === 4 && (
        <div>
          <h3>Численное решение</h3>
          <pre className="formula-block" style={{ fontSize: '0.85rem', lineHeight: 1.55, whiteSpace: 'pre' }}>{`state = [x_front, T_front, lambda_O2, Q]
while burned_length < L:
    k1 = derivs(t, state)
    k2 = derivs(t + dt/2, state + dt/2 * k1)
    k3 = derivs(t + dt/2, state + dt/2 * k2)
    k4 = derivs(t + dt,   state + dt   * k3)
    state += (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
    adapt_dt_by_error()
    if ignition_count * x_front >= L:
        stop`}</pre>
          <p className="hint-text">
            И здесь снова работает тот же принцип NovaLab: одинаковые входные параметры всегда
            дают одинаковую историю. Никакой случайности, только состояние и интегратор.
          </p>
          <p className="hint-text">
            В этом запуске интегратор прошёл <b>{result.formula_trace.integrator}</b>.
          </p>
        </div>
      )}

      <hr className="divider-dashed" style={{ marginTop: 36 }} />
      <h3 style={{ marginTop: 8 }}>🎛 What-if: крутим стенд</h3>
      <p className="hint-text">
        Здесь можно почувствовать, какой параметр реально “правит экспериментом”.
        Для сравнения берём время полного прогорания.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <WiggleParam
          label="Кислород"
          value={wiggleParams.oxygen_fraction}
          unit="доля"
          onChange={(value) => setWiggleParams((prev) => ({ ...prev, oxygen_fraction: value }))}
          result={wiggled.summary.burnout_time}
          baselineResult={result.summary.burnout_time}
          resultFormat={(value) => `${value.toFixed(1)} с`}
        />
        <WiggleParam
          label="Обдув"
          value={wiggleParams.wind_speed}
          unit="м/с"
          onChange={(value) => setWiggleParams((prev) => ({ ...prev, wind_speed: Math.max(0, value) }))}
          result={wiggled.summary.burnout_time}
          baselineResult={result.summary.burnout_time}
          resultFormat={(value) => `${value.toFixed(1)} с`}
        />
        <WiggleParam
          label="Влажность"
          value={wiggleParams.moisture_fraction}
          unit="доля"
          onChange={(value) => setWiggleParams((prev) => ({ ...prev, moisture_fraction: Math.max(0, value) }))}
          result={wiggled.summary.burnout_time}
          baselineResult={result.summary.burnout_time}
          resultFormat={(value) => `${value.toFixed(1)} с`}
        />
        <WiggleParam
          label="Радиус"
          value={wiggleParams.radius}
          unit="м"
          onChange={(value) => setWiggleParams((prev) => ({ ...prev, radius: Math.max(0.001, value) }))}
          result={wiggled.summary.burnout_time}
          baselineResult={result.summary.burnout_time}
          resultFormat={(value) => `${value.toFixed(1)} с`}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">◉ Новый результат</div>
        <div style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
          <div>Время прогорания: <span className="value">{wiggled.summary.burnout_time.toFixed(1)} с</span></div>
          <div>Пик T фронта: <span className="value">{(wiggled.summary.peak_front_temperature - 273.15).toFixed(0)} °C</span></div>
          <div>Пик мощности: <span className="value">{(wiggled.summary.peak_heat_release_rate / 1000).toFixed(1)} кВт</span></div>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <button className="btn" onClick={onRestart}>↻ Новый запуск</button>
      </div>
    </div>
  );
}
