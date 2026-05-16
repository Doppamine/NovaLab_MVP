import React, { useMemo } from 'react';

/**
 * SVG-график в реальном времени. Две линии: молоток (золото) и перо (мята).
 * Построен без зависимостей (без Recharts/Chart.js) — чистый SVG.
 *
 * props:
 *   series      — [{ name, color, dashed, data: [{t, y}] }]
 *   xLabel, yLabel
 *   currentTime — если задан, рисует вертикальную линию «сейчас»
 *   width, height — размеры viewBox (по умолчанию 800x300)
 */
export default function LiveChart({
  series, xLabel, yLabel, currentTime,
  width = 800, height = 300, yMin, yMax, xMin, xMax,
}) {
  const padding = { l: 56, r: 24, t: 20, b: 42 };
  const w = width - padding.l - padding.r;
  const h = height - padding.t - padding.b;

  const bounds = useMemo(() => {
    const allT = series.flatMap((s) => s.data.map((d) => d.t));
    const allY = series.flatMap((s) => s.data.map((d) => d.y));
    if (allT.length === 0) return null;
    const t0 = xMin ?? Math.min(...allT);
    const t1 = xMax ?? Math.max(...allT);
    const y0 = yMin ?? Math.min(...allY);
    const y1 = yMax ?? Math.max(...allY);
    return {
      t0, t1: Math.max(t1, t0 + 0.01),
      y0, y1: Math.max(y1, y0 + 0.01),
    };
  }, [series, xMin, xMax, yMin, yMax]);

  if (!bounds) return <svg className="live-chart" viewBox={`0 0 ${width} ${height}`} />;

  const sx = (t) => padding.l + ((t - bounds.t0) / (bounds.t1 - bounds.t0)) * w;
  const sy = (y) => padding.t + h - ((y - bounds.y0) / (bounds.y1 - bounds.y0)) * h;

  const ticksX = 5, ticksY = 4;
  const tickValsX = Array.from({ length: ticksX + 1 }, (_, i) => bounds.t0 + (i / ticksX) * (bounds.t1 - bounds.t0));
  const tickValsY = Array.from({ length: ticksY + 1 }, (_, i) => bounds.y0 + (i / ticksY) * (bounds.y1 - bounds.y0));

  return (
    <svg className="live-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Axes */}
      <g stroke="currentColor" strokeWidth="0.5" opacity="0.4">
        {tickValsX.map((tv, i) => (
          <line key={`gx${i}`} x1={sx(tv)} y1={padding.t} x2={sx(tv)} y2={padding.t + h} opacity="0.25" />
        ))}
        {tickValsY.map((tv, i) => (
          <line key={`gy${i}`} x1={padding.l} y1={sy(tv)} x2={padding.l + w} y2={sy(tv)} opacity="0.25" />
        ))}
      </g>

      {/* Baseline axes */}
      <line x1={padding.l} y1={padding.t + h} x2={padding.l + w} y2={padding.t + h}
            stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <line x1={padding.l} y1={padding.t} x2={padding.l} y2={padding.t + h}
            stroke="currentColor" strokeWidth="1" opacity="0.8" />

      {/* Tick labels */}
      <g fontFamily="var(--font-mono)" fontSize="10" fill="currentColor" opacity="0.7">
        {tickValsX.map((tv, i) => (
          <text key={`lx${i}`} x={sx(tv)} y={padding.t + h + 16} textAnchor="middle">
            {tv.toFixed(tv < 10 ? 2 : 1)}
          </text>
        ))}
        {tickValsY.map((tv, i) => (
          <text key={`ly${i}`} x={padding.l - 8} y={sy(tv) + 4} textAnchor="end">
            {Math.abs(tv) >= 100 ? tv.toFixed(0) : tv.toFixed(2)}
          </text>
        ))}
      </g>

      {/* Axis labels */}
      <text x={padding.l + w / 2} y={height - 10} textAnchor="middle"
            fontFamily="var(--font-sans)" fontSize="11" fill="currentColor" opacity="0.7">
        {xLabel}
      </text>
      <text x={14} y={padding.t + h / 2} textAnchor="middle"
            fontFamily="var(--font-sans)" fontSize="11" fill="currentColor" opacity="0.7"
            transform={`rotate(-90 14 ${padding.t + h / 2})`}>
        {yLabel}
      </text>

      {/* Series */}
      {series.map((s) => {
        const pts = s.data.map((d) => `${sx(d.t)},${sy(d.y)}`).join(' ');
        return (
          <polyline
            key={s.name}
            points={pts}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
          />
        );
      })}

      {/* "Сейчас" вертикаль */}
      {currentTime != null && currentTime >= bounds.t0 && currentTime <= bounds.t1 && (
        <line x1={sx(currentTime)} y1={padding.t} x2={sx(currentTime)} y2={padding.t + h}
              stroke="var(--acc-red)" strokeWidth="1" strokeDasharray="3 3" />
      )}

      {/* Legend */}
      <g fontFamily="var(--font-mono)" fontSize="11" fill="currentColor">
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${padding.l + 14 + i * 140}, ${padding.t + 14})`}>
            <rect width="14" height="3" y="4" fill={s.color} />
            <text x="20" y="10" opacity="0.85">{s.name}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
