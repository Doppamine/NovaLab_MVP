import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function PhaseCompare({ studentAnswer, result, scenario, params, onNext }) {
  const hammerT = result.object1.result.fall_time;
  const featherT = result.object2.result.fall_time;

  // Ожидаемый ответ — по молотку (основной объект), см. scenario.lesson_flow.phase_4_compare
  const expected = hammerT;
  const delta = studentAnswer != null ? (studentAnswer - expected) : null;
  const relError = delta != null ? Math.abs(delta) / expected : null;
  const tolerance = (scenario.lesson_flow.phase_4_compare.expected_answer.tolerance_percent || 15) / 100;
  const ok = relError != null && relError <= tolerance;

  // Простая эвристическая диагностика (без LLM — правила прошиты)
  const diagnostics = useMemo(() => {
    const out = [];
    const airDensity = params['scene.air_density'];
    const gravity = params['scene.gravity_value'];
    const h = params['drop_height'];

    // Если ученик использовал школьную формулу (его ответ ≈ √(2h/g))
    const schoolT = Math.sqrt((2 * h) / gravity);
    const usedSchool = studentAnswer != null && Math.abs(studentAnswer - schoolT) / schoolT < 0.03;

    if (usedSchool && airDensity > 0 && Math.abs(featherT - hammerT) > 0.1) {
      out.push({
        type: 'warn',
        text: `Ты использовал школьную формулу h = g·t²/2. Она точна в вакууме, но сейчас в сцене воздух (ρ = ${airDensity.toFixed(2)} кг/м³). Перо тормозится о воздух сильнее молотка — у него маленькая масса, но почти такая же площадь.`,
      });
    }
    if (Math.abs(featherT - hammerT) < 0.01 && airDensity === 0) {
      out.push({
        type: 'info',
        text: 'В вакууме сопротивления нет — оба объекта падают одинаково, как у Галилея и Скотта. Увеличь плотность воздуха, чтобы увидеть разницу.',
      });
    }
    if (relError != null && relError > tolerance) {
      out.push({
        type: 'warn',
        text: `Твой ответ отличается от симуляции на ${(relError * 100).toFixed(1)}%. Загляни в фазу «Объяснение формулы», уровень 2 — там видно, где прячется сопротивление воздуха.`,
      });
    }
    if (ok) {
      out.push({
        type: 'ok',
        text: `Отлично! Ты попал в диапазон ±${(tolerance * 100).toFixed(0)}%. Попробуй теперь поменять планету или массу пера и посмотри, как изменится картина.`,
      });
    }
    return out;
  }, [studentAnswer, hammerT, featherT, params, relError, ok, tolerance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="eyebrow">Фаза 04 / Сравнение</div>
      <h2 style={{ marginTop: 8, marginBottom: 24 }}>Твой расчёт против реальности</h2>

      <table className="compare-table">
        <thead>
          <tr>
            <th>Величина</th>
            <th>Твой ответ</th>
            <th>Симуляция</th>
            <th>Расхождение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🔨 Время падения молотка</td>
            <td>{studentAnswer != null ? `${studentAnswer.toFixed(2)} с` : '—'}</td>
            <td>{hammerT.toFixed(2)} с</td>
            <td className={ok ? 'delta-ok' : 'delta-warn'}>
              {delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} с (${(relError * 100).toFixed(1)}%)` : '—'}
            </td>
          </tr>
          <tr>
            <td>🪶 Время падения пера</td>
            <td className="dimmed">—</td>
            <td>{featherT.toFixed(2)} с</td>
            <td className={Math.abs(featherT - hammerT) > 0.1 ? 'delta-warn' : 'delta-ok'}>
              Δ с молотком: {(featherT - hammerT).toFixed(2)} с
            </td>
          </tr>
          <tr>
            <td>🔨 Скорость удара молотка</td>
            <td className="dimmed">—</td>
            <td>{result.object1.result.impact_speed.toFixed(1)} м/с</td>
            <td className="dimmed">
              {result.object1.result.terminal_velocity
                ? `v_term = ${result.object1.result.terminal_velocity.toFixed(1)} м/с`
                : '(вакуум, v_term не определено)'}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 14 }}>Анализ</h3>
        {diagnostics.map((d, i) => (
          <div
            key={i}
            className="hint-text"
            style={{
              padding: '14px 18px',
              borderRadius: 8,
              borderLeft: `3px solid ${d.type === 'ok' ? 'var(--acc-teal)' : d.type === 'warn' ? 'var(--acc-red)' : 'var(--acc-gold)'}`,
              background: d.type === 'ok' ? 'rgba(45, 139, 122, 0.08)' : d.type === 'warn' ? 'rgba(200, 92, 60, 0.08)' : 'rgba(232, 181, 74, 0.08)',
              marginBottom: 10,
              fontSize: '0.95rem',
            }}
          >
            {d.text}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <button className="btn btn-primary-gold" onClick={onNext}>
          → Заглянуть под капот: формула
        </button>
      </div>
    </motion.div>
  );
}
