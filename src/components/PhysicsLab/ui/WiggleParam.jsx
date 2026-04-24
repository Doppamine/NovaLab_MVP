import React, { useState } from 'react';

/**
 * Wiggle-контрол: рядом с числовым параметром показывает стрелочки ↑↓,
 * при клике изменяет значение на ±step%, пересчитывает симуляцию, показывает дельту результата.
 *
 * props:
 *   label       — подпись
 *   value       — текущее значение (в СИ)
 *   stepPercent — на сколько % изменять (по умолчанию 10)
 *   onChange    — (newValue) => void
 *   result      — текущий результат (число, время или скорость)
 *   baselineResult — эталонный результат для сравнения
 *   resultFormat — (n) => string
 */
export default function WiggleParam({
  label,
  value,
  unit,
  stepPercent = 10,
  onChange,
  result,
  baselineResult,
  resultFormat = (n) => n.toFixed(3),
}) {
  const [flash, setFlash] = useState(false);

  const bump = (sign) => {
    const factor = 1 + (sign * stepPercent) / 100;
    onChange(value * factor);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  };

  const delta = (result != null && baselineResult != null)
    ? ((result - baselineResult) / baselineResult) * 100
    : null;

  return (
    <div className={`param-row ${flash ? 'flash-gold' : ''}`}>
      <div className="label">
        <span>{label}</span>
        <span>
          <span className="value">{value.toFixed(3)}</span>
          <span className="unit"> {unit}</span>
          <span className="wiggle">
            <button onClick={() => bump(-1)} aria-label="Уменьшить">−</button>
            <button onClick={() => bump(+1)} aria-label="Увеличить">+</button>
          </span>
        </span>
      </div>
      {delta !== null && (
        <div className="hint-text">
          Результат: <span className="value">{resultFormat(result)}</span>
          <span className={`wiggle-delta ${delta < 0 ? 'neg' : ''}`}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(2)}% от исходного
          </span>
        </div>
      )}
    </div>
  );
}
