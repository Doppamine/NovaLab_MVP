import React from 'react';

/**
 * Tiny SVG line chart for two cars. Shows traces up to `currentT` so it draws
 * progressively as the race runs. Used both in the live HUD and the results modal.
 */
export default function RaceGraph({
  samples,
  currentT,
  yKeyA,
  yKeyB,
  yMax,
  xMax,
  width = 240,
  height = 110,
  yLabel = '',
  xLabel = 't',
  unit = '',
}) {
  const padL = 28;
  const padR = 6;
  const padT = 6;
  const padB = 18;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const tMax = Math.max(0.001, xMax);
  const vMax = Math.max(0.001, yMax);

  const toX = (t) => padL + (Math.min(t, tMax) / tMax) * innerW;
  const toY = (v) => padT + innerH - (Math.min(v, vMax) / vMax) * innerH;

  const buildPath = (key) => {
    const visible = samples.filter((s) => s.t <= currentT);
    if (visible.length === 0) return '';
    return visible
      .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(s.t).toFixed(2)} ${toY(s[key]).toFixed(2)}`)
      .join(' ');
  };

  const pathA = buildPath(yKeyA);
  const pathB = buildPath(yKeyB);

  let liveA = null;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].t <= currentT) {
      liveA = samples[i];
      break;
    }
  }

  // Y-axis tick labels (0, mid, max)
  const ticks = [0, vMax / 2, vMax];

  return (
    <svg width={width} height={height} className="dr-graph" aria-label={`${yLabel} over time`}>
      {/* Plot area background */}
      <rect
        x={padL}
        y={padT}
        width={innerW}
        height={innerH}
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.08)"
      />
      {/* Y axis ticks */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={toY(v)}
            x2={padL + innerW}
            y2={toY(v)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 3"
          />
          <text
            x={padL - 4}
            y={toY(v) + 3}
            textAnchor="end"
            fontSize="9"
            fill="rgba(255,255,255,0.55)"
          >
            {Math.round(v)}
          </text>
        </g>
      ))}

      {/* Traces */}
      <path d={pathA} fill="none" stroke="#ff5a5a" strokeWidth="2" strokeLinejoin="round" />
      <path d={pathB} fill="none" stroke="#5ab4ff" strokeWidth="2" strokeLinejoin="round" />

      {/* Live dots */}
      {liveA && (
        <>
          <circle cx={toX(liveA.t)} cy={toY(liveA[yKeyA])} r="2.6" fill="#ff5a5a" />
          <circle cx={toX(liveA.t)} cy={toY(liveA[yKeyB])} r="2.6" fill="#5ab4ff" />
        </>
      )}

      {/* Axis labels */}
      <text x={padL + innerW / 2} y={height - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.55)">
        {xLabel} (s) {unit ? `· ${yLabel} (${unit})` : ''}
      </text>
    </svg>
  );
}
