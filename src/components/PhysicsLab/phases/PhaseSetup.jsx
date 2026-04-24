import React from 'react';
import { motion } from 'framer-motion';

export default function PhaseSetup({ scenario, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="eyebrow">Фаза 01 / Постановка задачи</div>
      <h1 style={{ marginTop: 8, marginBottom: 20 }}>{scenario.title}</h1>

      <p style={{ fontSize: '1.1rem', lineHeight: 1.55, maxWidth: 720 }}>
        {scenario.lesson_flow.phase_1_setup.display_text}
      </p>

      <hr className="divider-dashed" />

      <h3 style={{ marginBottom: 12 }}>Что мы проверим</h3>
      <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
        {scenario.pedagogical_goals.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn" onClick={onNext}>
          Готов → к расчёту
        </button>
        <span className="hint-text">
          Справа — параметры. Пока их менять нельзя: сначала попробуй посчитать задачу руками.
        </span>
      </div>
    </motion.div>
  );
}
