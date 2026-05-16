import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhaseManual({ scenario, studentAnswer, setStudentAnswer, onNext }) {
  const [shownHints, setShownHints] = useState(0);
  const hints = scenario.lesson_flow.phase_2_manual.hints || [];
  const prompt = scenario.lesson_flow.phase_2_manual.prompt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="eyebrow">Фаза 02 / Твой расчёт</div>
      <h2 style={{ marginTop: 8, marginBottom: 20 }}>Сначала подумай сам</h2>

      <p style={{ fontSize: '1.05rem', lineHeight: 1.55, maxWidth: 720 }}>
        {prompt}
      </p>

      <div className="formula-block" style={{ marginTop: 20 }}>
        Школьная формула свободного падения:<br />
        &nbsp;&nbsp;&nbsp;<b>h = g · t² / 2</b> &nbsp;→&nbsp; <b>t = √(2h / g)</b>
      </div>

      <div style={{ marginTop: 24 }}>
        <label className="eyebrow">Твой ответ (время падения, секунды)</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <input
            className="answer-input"
            type="number"
            step="0.01"
            placeholder="?"
            value={studentAnswer ?? ''}
            onChange={(e) => setStudentAnswer(e.target.value === '' ? null : parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', opacity: 0.5 }}>с</span>
        </div>
      </div>

      <hr className="divider-dashed" />

      {/* Подсказки раскрываются по одной */}
      <div style={{ marginTop: 14 }}>
        <AnimatePresence>
          {hints.slice(0, shownHints).map((hint, i) => (
            <motion.div
              key={i}
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
            onClick={() => setShownHints((n) => n + 1)}
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
          disabled={studentAnswer == null || isNaN(studentAnswer)}
        >
          ▶ Запустить симуляцию
        </button>
        <span className="hint-text">
          Готов поспорить с реальностью?
        </span>
      </div>
    </motion.div>
  );
}
