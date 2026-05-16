import React, { useMemo } from 'react';

export default function PhaseBurningCompare({
  studentAnswer,
  result,
  scenario,
  params,
  onNext,
}) {
  const burnoutTime = result.summary.burnout_time;
  const naiveTime = result.summary.uniform_estimate_time;
  const delta = studentAnswer != null ? studentAnswer - burnoutTime : null;
  const relError = delta != null ? Math.abs(delta) / burnoutTime : null;
  const tolerance = (scenario.lesson_flow.phase_4_compare.expected_answer.tolerance_percent || 18) / 100;
  const ok = relError != null && relError <= tolerance;

  const diagnostics = useMemo(() => {
    const notes = [];
    const moisture = params['stick.moisture_fraction'];
    const oxygen = params['environment.oxygen_fraction'];
    const wind = params['environment.wind_speed'];
    const ignitionMode = params['ignition.mode'];

    if (studentAnswer != null && Math.abs(studentAnswer - naiveTime) / naiveTime < 0.04) {
      notes.push({
        type: 'warn',
        text: 'Твой ответ почти совпал с грубой формулой t = L / (n·v_base). Это нормальный первый шаг, но он не учитывает разгон температуры фронта и реальное кислородное питание.',
      });
    }
    if (ignitionMode === 'two_ends' && studentAnswer != null && studentAnswer > burnoutTime * 1.4) {
      notes.push({
        type: 'warn',
        text: 'Ты, похоже, недооценил эффект поджига с двух концов: каждому фронту нужно пройти только половину палки.',
      });
    }
    if (moisture >= 0.18) {
      notes.push({
        type: 'info',
        text: `Влажность сейчас ${Math.round(moisture * 100)}%. Существенная часть энергии уходит не на продвижение фронта, а на нагрев и испарение влаги.`,
      });
    }
    if (oxygen < 0.19) {
      notes.push({
        type: 'warn',
        text: `Кислорода в среде только ${(oxygen * 100).toFixed(1)}%. При таком режиме фронт горения беднее и заметно медленнее, чем в обычном воздухе.`,
      });
    }
    if (wind > 4) {
      notes.push({
        type: 'info',
        text: 'Сильный обдув одновременно подпитывает пламя кислородом и быстрее прогревает фронт, поэтому палка разгорается заметно активнее.',
      });
    }
    if (ok) {
      notes.push({
        type: 'ok',
        text: `Отлично: ты попал в диапазон ±${(tolerance * 100).toFixed(0)}%. Теперь можно поиграть с влажностью и толщиной в фазе объяснения.`,
      });
    }
    return notes;
  }, [studentAnswer, naiveTime, burnoutTime, params, ok, tolerance]);

  return (
    <div>
      <div className="eyebrow">Фаза 04 / Сравнение</div>
      <h2 style={{ marginTop: 8, marginBottom: 24 }}>Твоя оценка против модели</h2>

      <table className="compare-table">
        <thead>
          <tr>
            <th>Величина</th>
            <th>Твоя оценка</th>
            <th>Симуляция</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Время полного прогорания</td>
            <td>{studentAnswer != null ? `${studentAnswer.toFixed(1)} с` : '—'}</td>
            <td>{burnoutTime.toFixed(1)} с</td>
            <td className={ok ? 'delta-ok' : 'delta-warn'}>
              {delta != null
                ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} с (${(relError * 100).toFixed(1)}%)`
                : '—'}
            </td>
          </tr>
          <tr>
            <td>Грубая формула t ≈ L / (n·v)</td>
            <td className="dimmed">—</td>
            <td>{naiveTime.toFixed(1)} с</td>
            <td className={Math.abs(naiveTime - burnoutTime) / burnoutTime < 0.1 ? 'delta-ok' : 'delta-warn'}>
              {naiveTime > burnoutTime ? 'переоценивает' : 'недооценивает'} на {Math.abs(naiveTime - burnoutTime).toFixed(1)} с
            </td>
          </tr>
          <tr>
            <td>Пиковая температура фронта</td>
            <td className="dimmed">—</td>
            <td>{(result.summary.peak_front_temperature - 273.15).toFixed(0)} °C</td>
            <td className="dimmed">
              пик тепловыделения {(result.summary.peak_heat_release_rate / 1000).toFixed(1)} кВт
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 14 }}>Диагностика</h3>
        {diagnostics.map((diagnostic, index) => (
          <div
            key={index}
            className="hint-text"
            style={{
              padding: '14px 18px',
              borderRadius: 8,
              borderLeft: `3px solid ${diagnostic.type === 'ok' ? 'var(--acc-teal)' : diagnostic.type === 'warn' ? 'var(--acc-red)' : 'var(--acc-gold)'}`,
              background: diagnostic.type === 'ok'
                ? 'rgba(45, 139, 122, 0.08)'
                : diagnostic.type === 'warn'
                  ? 'rgba(200, 92, 60, 0.08)'
                  : 'rgba(232, 181, 74, 0.08)',
              marginBottom: 10,
              fontSize: '0.95rem',
            }}
          >
            {diagnostic.text}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <button className="btn btn-primary-gold" onClick={onNext}>
          → Почему так получилось
        </button>
      </div>
    </div>
  );
}
