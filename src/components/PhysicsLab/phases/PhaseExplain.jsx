import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { freeFallWithDrag } from '../../../physics/index.js';

const LEVELS = [
  { id: 1, label: '01 · Словами' },
  { id: 2, label: '02 · Школьная формула' },
  { id: 3, label: '03 · Полная формула' },
  { id: 4, label: '04 · Численный код' },
];

export default function PhaseExplain({ result, params, scenario, onRestart }) {
  const [level, setLevel] = useState(scenario.lesson_flow.phase_5_explain.default_level || 2);

  // Baseline (для Wiggle)
  const baseline = useMemo(() => result.object1.result.fall_time, [result]);
  const [wiggleParams, setWiggleParams] = useState({
    air_density: params['scene.air_density'],
    hammer_mass: params['objects.hammer.mass'],
    feather_mass: params['objects.feather.mass'],
  });

  // Пересчёт на лету под wiggle
  const wiggled = useMemo(() => {
    const hammer = freeFallWithDrag({
      h0: params['drop_height'],
      g: params['scene.gravity_value'],
      rhoAir: wiggleParams.air_density,
      mass: wiggleParams.hammer_mass,
      Cd: 1.10,
      area: 0.008,
    });
    const feather = freeFallWithDrag({
      h0: params['drop_height'],
      g: params['scene.gravity_value'],
      rhoAir: wiggleParams.air_density,
      mass: wiggleParams.feather_mass,
      Cd: 1.80,
      area: 0.010,
    });
    return { hammerT: hammer.result.fall_time, featherT: feather.result.fall_time };
  }, [wiggleParams, params]);

  const bumpParam = (key, sign) => {
    setWiggleParams((wp) => ({ ...wp, [key]: wp[key] * (1 + 0.1 * sign) }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="eyebrow">Фаза 05 / Объяснение формулы</div>
      <h2 style={{ marginTop: 8, marginBottom: 20 }}>Четыре уровня глубины</h2>

      <div className="explain-tabs">
        {LEVELS.map((L) => (
          <button
            key={L.id}
            className={`tab ${level === L.id ? 'active' : ''}`}
            onClick={() => setLevel(L.id)}
          >
            {L.label}
          </button>
        ))}
      </div>

      {/* LEVEL 1 — WORDS */}
      {level === 1 && (
        <div style={{ fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 700 }}>
          <p>На Землю тянет сила тяжести — все предметы падают вниз. В пустоте (в вакууме) молоток и перо летят бок о бок и касаются земли одновременно, какой бы массы они ни были.</p>
          <p>Но на Земле есть воздух. Воздух цепляется за всё, что через него летит. Причём «тормозная сила» зависит не от массы, а от <b>формы и площади</b>: у пера площадь большая, а масса крошечная — воздух быстро его останавливает. Молоток тяжёлый, воздух его почти не замечает.</p>
          <p>Поэтому на Земле — сначала падает молоток. А на Луне воздуха нет вообще. Астронавт Дэвид Скотт в 1971 году это показал <a href="https://moon.nasa.gov/resources/331/the-apollo-15-hammer-feather-drop/" target="_blank" rel="noreferrer" style={{ color: 'var(--acc-red)' }}>всему миру по телевизору</a> — они упали вместе.</p>
        </div>
      )}

      {/* LEVEL 2 — SCHOOL */}
      {level === 2 && (
        <div>
          <h3>Школьная формула (только гравитация)</h3>
          <div className="formula-block">
            h = g · t² / 2 &nbsp;&nbsp;→&nbsp;&nbsp; t = √(2h / g)
          </div>
          <p className="hint-text">Эта формула верна только в вакууме. В задаче с воздухом её надо дополнить.</p>

          <h3 style={{ marginTop: 24 }}>Полная формула (учитываем воздух)</h3>
          <div className="formula-block">
            m · <span className="hl-new">dv/dt</span> = −m·g <span className="hl-sub">− ½ · Cᴅ · ρ · A · v²</span>
          </div>
          <p className="hint-text">
            Красным — член, который «убивает» школьную формулу: сила сопротивления воздуха. Она зависит от:
            <b> Cᴅ</b> (форма объекта — у пера 1.8, у молотка 1.1),
            <b> ρ</b> (плотность воздуха — на Земле 1.225, в вакууме 0),
            <b> A</b> (площадь лобовая),
            <b> v²</b> (квадрат скорости — чем быстрее, тем сильнее тормозит).
          </p>

          <h3 style={{ marginTop: 24 }}>Терминальная скорость</h3>
          <div className="formula-block">
            v<sub>терм</sub> = √( 2·m·g / (Cᴅ · ρ · A) )
          </div>
          <p className="hint-text">
            Скорость, на которой сопротивление воздуха уравновешивает силу тяжести.
            Перо её достигает за доли секунды — отсюда и медленное падение.
          </p>
        </div>
      )}

      {/* LEVEL 3 — FULL */}
      {level === 3 && (
        <div>
          <h3>Система ОДУ (2-го порядка → 1-го порядка)</h3>
          <div className="formula-block">
            dy/dt = v<br />
            dv/dt = −g − (k / m) · v · |v|,&nbsp;&nbsp; где k = ½ · Cᴅ · ρ · A
          </div>
          <p className="hint-text">
            Модуль |v| нужен, чтобы сила сопротивления всегда была направлена против движения —
            хоть при падении (v&lt;0), хоть при подъёме (v&gt;0).
          </p>

          <h3 style={{ marginTop: 20 }}>Значения, подставленные в этот расчёт</h3>
          <table className="compare-table">
            <tbody>
              {Object.entries(result.object1.formula_trace.substitutions).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="value">{typeof v === 'number' ? v.toPrecision(6) : String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>Область применимости</h3>
          <ul style={{ lineHeight: 1.7 }}>
            {scenario.assumptions.map((a, i) => <li key={i} className="hint-text">{a}</li>)}
          </ul>
        </div>
      )}

      {/* LEVEL 4 — CODE */}
      {level === 4 && (
        <div>
          <h3>Псевдокод интегратора (RK4 с адаптивным шагом)</h3>
          <pre className="formula-block" style={{ fontSize: '0.85rem', lineHeight: 1.55, whiteSpace: 'pre' }}>{`state = [y, v] = [h0, 0]
t = 0
while y > 0:
    k1 = derivs(t,       state)
    k2 = derivs(t + dt/2, state + dt/2 · k1)
    k3 = derivs(t + dt/2, state + dt/2 · k2)
    k4 = derivs(t + dt,   state + dt · k3)
    state += (dt/6) · (k1 + 2·k2 + 2·k3 + k4)
    t += dt
    # адаптивный шаг: сравниваем 1 шаг dt с 2 шагами dt/2,
    # если ошибка > rtol — отклоняем шаг и dt /= 2
where derivs(t, [y, v]):
    return [v, −g − (k/m) · v · |v|]`}</pre>
          <p className="hint-text">
            Этот код — сердце симулятора. Детерминированный: одинаковые входы всегда дают одинаковый выход.
            Шаг по времени адаптируется автоматически — где скорость меняется быстро (удар о землю), dt уменьшается.
          </p>
          <p className="hint-text">
            В текущем расчёте интегратор сделал <b>{result.object1.formula_trace.integrator}</b> шагов.
          </p>
        </div>
      )}

      {/* ----------- WIGGLE SECTION ----------- */}
      <hr className="divider-dashed" style={{ marginTop: 36 }} />
      <h3 style={{ marginTop: 8 }}>🎛 Что-если: крути параметры</h3>
      <p className="hint-text">
        Кликай стрелочки — цифры слева меняются на ±10%. Смотри, как сильно это влияет на результат.
        Это формирует интуицию: что важнее — масса или форма? Сопротивление или гравитация?
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <WiggleRow
          label="Плотность воздуха"
          value={wiggleParams.air_density} unit="кг/м³"
          onBump={(s) => bumpParam('air_density', s)}
          baselineRes={baseline}
          currentRes={wiggled.hammerT}
        />
        <WiggleRow
          label="Масса молотка"
          value={wiggleParams.hammer_mass} unit="кг"
          onBump={(s) => bumpParam('hammer_mass', s)}
          baselineRes={baseline}
          currentRes={wiggled.hammerT}
        />
        <WiggleRow
          label="Масса пера"
          value={wiggleParams.feather_mass} unit="кг"
          onBump={(s) => bumpParam('feather_mass', s)}
          baselineRes={result.object2.result.fall_time}
          currentRes={wiggled.featherT}
        />
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <button className="btn" onClick={onRestart}>↻ Новый запуск</button>
      </div>
    </motion.div>
  );
}

function WiggleRow({ label, value, unit, onBump, baselineRes, currentRes }) {
  const delta = ((currentRes - baselineRes) / baselineRes) * 100;
  return (
    <div className="param-row">
      <div className="label">
        <span>{label}</span>
        <span>
          <span className="value">{value.toFixed(3)}</span>
          <span className="unit"> {unit}</span>
          <span className="wiggle">
            <button onClick={() => onBump(-1)}>−</button>
            <button onClick={() => onBump(+1)}>+</button>
          </span>
        </span>
      </div>
      <div className="hint-text">
        Время падения: <span className="value">{currentRes.toFixed(3)}</span> с&nbsp;
        <span className={`wiggle-delta ${delta < 0 ? 'neg' : ''}`}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(2)}% от исходного
        </span>
      </div>
    </div>
  );
}
