import React from 'react';

/**
 * Универсальная панель параметров сцены.
 * Читает конфиг из JSON-сценария (parameters_ui) и рендерит слайдеры/селекты.
 *
 * props:
 *   config      — массив объектов из scenario.parameters_ui
 *   values      — текущие значения { [key]: value }
 *   onChange    — (key, value) => void
 *   locked      — bool: если true, параметры только для чтения (фаза Setup, Manual)
 */
export default function ParameterPanel({ config, values, onChange, locked = false }) {
  return (
    <section className="card">
      <div className="card-title">◉ Параметры сцены</div>
      {config.map((p) => {
        const v = values[p.key];
        if (p.type === 'select') {
          return (
            <div className="param-row" key={p.key}>
              <div className="label">
                <span>{p.label}</span>
              </div>
              <select
                value={v}
                disabled={locked}
                onChange={(e) => onChange(p.key, e.target.value)}
              >
                {p.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        }

        const displayScale = p.display_scale ?? 1;
        const displayValue = (v * displayScale).toFixed(
          p.step && p.step < 0.01 ? 3 : p.step < 1 ? 2 : 1
        );

        return (
          <div className="param-row" key={p.key}>
            <div className="label">
              <span>{p.label}</span>
              <span>
                <span className="value">{displayValue}</span>
                {p.unit_display && <span className="unit"> {p.unit_display}</span>}
              </span>
            </div>
            <input
              type="range"
              min={p.min} max={p.max} step={p.step}
              value={v}
              disabled={locked}
              onChange={(e) => onChange(p.key, parseFloat(e.target.value))}
            />
            {p.hint_zero && v === 0 && (
              <div className="hint-text" style={{ fontSize: '0.78rem', color: 'var(--acc-gold)' }}>
                {p.hint_zero}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
