import React from 'react';

export default function PhaseBurningSetup({ scenario, onNext }) {
  return (
    <div>
      <div className="eyebrow">Фаза 01 / Постановка задачи</div>
      <h1 style={{ marginTop: 8, marginBottom: 20 }}>{scenario.title}</h1>

      <p style={{ fontSize: '1.08rem', lineHeight: 1.6, maxWidth: 760 }}>
        {scenario.lesson_flow.phase_1_setup.display_text}
      </p>

      <hr className="divider-dashed" />

      <h3 style={{ marginBottom: 12 }}>Что здесь интересно менять</h3>
      <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
        {scenario.pedagogical_goals.map((goal, index) => (
          <li key={index}>{goal}</li>
        ))}
      </ul>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn" onClick={onNext}>
          Готов → к оценке
        </button>
        <span className="hint-text">
          Сначала попробуй грубую инженерную оценку, а потом посмотрим, где её сломает реальное горение.
        </span>
      </div>
    </div>
  );
}
