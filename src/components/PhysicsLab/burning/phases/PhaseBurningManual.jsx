import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

export default function PhaseBurningManual({
  scenario,
  studentAnswer,
  setStudentAnswer,
  material,
  ignitionCount,
  onNext,
}) {
  const [shownHints, setShownHints] = useState(0);
  const hints = scenario.lesson_flow.phase_2_manual.hints || [];

  return (
    <div>
      <div className="eyebrow">Фаза 02 / Твоя оценка</div>
      <h2 style={{ marginTop: 8, marginBottom: 20 }}>Оцени время прогорания до симуляции</h2>

      <p style={{ fontSize: '1.03rem', lineHeight: 1.58, maxWidth: 760 }}>
        {scenario.lesson_flow.phase_2_manual.prompt}
      </p>

      <div className="formula-block" style={{ marginTop: 20 }}>
        t ≈ L / (n · v<sub>base</sub>)<br />
        где <b>n = {ignitionCount}</b>, а для материала <b>{material.label}</b> базовая скорость
        фронта порядка <b>{material.base_linear_burn_rate.toFixed(4)} м/с</b>.
      </div>

      <div style={{ marginTop: 24 }}>
        <label className="eyebrow">Твоя оценка времени полного прогорания</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <input
            className="answer-input"
            type="number"
            step="0.1"
            placeholder="?"
            value={studentAnswer ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setStudentAnswer(value === '' ? null : parseFloat(value));
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', opacity: 0.6 }}>с</span>
        </div>
      </div>

      <hr className="divider-dashed" />

      <div style={{ marginTop: 14 }}>
        <AnimatePresence>
          {hints.slice(0, shownHints).map((hint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="hint-text"
              style={{
                padding: '10px 14px',
                background: 'rgba(232, 181, 74, 0.1)',
                borderLeft: '3px solid var(--acc-gold)',
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              {hint}
            </motion.div>
          ))}
        </AnimatePresence>

        {shownHints < hints.length && (
          <button
            className="btn btn-ghost"
            onClick={() => setShownHints((count) => count + 1)}
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            💡 Подсказка {shownHints + 1} / {hints.length}
          </button>
        )}
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          className="btn btn-launch"
          onClick={onNext}
          disabled={studentAnswer == null || Number.isNaN(studentAnswer)}
        >
          ▶ Запустить стенд
        </button>
        <span className="hint-text">
          Сравним грубую оценку с нелинейной моделью фронта горения.
        </span>
      </div>
    </div>
  );
}
