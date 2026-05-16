import React from 'react';

const PHASES = [
  { id: 'setup',    label: '01 · Постановка' },
  { id: 'manual',   label: '02 · Твой расчёт' },
  { id: 'simulate', label: '03 · Симуляция' },
  { id: 'compare',  label: '04 · Сравнение' },
  { id: 'explain',  label: '05 · Формула' },
];

export default function ProgressBar({ current }) {
  const idx = PHASES.findIndex((p) => p.id === current);
  return (
    <nav className="progress-bar" aria-label="Прогресс урока">
      {PHASES.map((p, i) => (
        <span
          key={p.id}
          className={`step ${i === idx ? 'active' : i < idx ? 'done' : ''}`}
        >
          <span className="dot" />
          {p.label}
        </span>
      ))}
    </nav>
  );
}

export { PHASES };
