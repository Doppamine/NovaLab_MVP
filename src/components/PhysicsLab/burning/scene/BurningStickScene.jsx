import React, { useMemo } from 'react';

function interpolateHistory(history, t) {
  if (!history.length) return null;
  if (t <= history[0].t) return history[0];
  if (t >= history[history.length - 1].t) return history[history.length - 1];

  let lo = 0;
  let hi = history.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (history[mid].t <= t) lo = mid;
    else hi = mid;
  }

  const a = (t - history[lo].t) / (history[hi].t - history[lo].t);
  const lerp = (x, y) => x * (1 - a) + y * a;
  const lerpArray = (x = [], y = []) => x.map((value, index) => lerp(value, y[index] ?? value));

  return {
    ...history[lo],
    t,
    frontDistance: lerp(history[lo].frontDistance, history[hi].frontDistance),
    frontTemperature: lerp(history[lo].frontTemperature, history[hi].frontTemperature),
    oxygenFactor: lerp(history[lo].oxygenFactor, history[hi].oxygenFactor),
    cumulativeHeat: lerp(history[lo].cumulativeHeat, history[hi].cumulativeHeat),
    burnRate: lerp(history[lo].burnRate, history[hi].burnRate),
    heatReleaseRate: lerp(history[lo].heatReleaseRate, history[hi].heatReleaseRate),
    remainingLength: lerp(history[lo].remainingLength, history[hi].remainingLength),
    burnedLength: lerp(history[lo].burnedLength, history[hi].burnedLength),
    burnedLeft: lerp(history[lo].burnedLeft, history[hi].burnedLeft),
    burnedRight: lerp(history[lo].burnedRight, history[hi].burnedRight),
    massRemaining: lerp(history[lo].massRemaining, history[hi].massRemaining),
    frontPositions: lerpArray(history[lo].frontPositions, history[hi].frontPositions),
  };
}

export default function BurningStickScene({
  result,
  currentTime,
  materialLabel,
  ignitionLabel,
  totalLength,
}) {
  const snapshot = useMemo(
    () => interpolateHistory(result.history, currentTime),
    [result, currentTime]
  );

  if (!snapshot) return null;

  const leftPct = (snapshot.burnedLeft / totalLength) * 100;
  const rightPct = (snapshot.burnedRight / totalLength) * 100;
  const livePct = Math.max(0, 100 - leftPct - rightPct);
  const burnout = snapshot.remainingLength <= 1e-5;

  return (
    <section className="burn-scene">
      <div className="burn-telemetry-grid">
        <StatCard label="Осталось длины" value={`${snapshot.remainingLength.toFixed(3)} м`} />
        <StatCard label="Осталось массы" value={`${(snapshot.massRemaining * 1000).toFixed(1)} г`} />
        <StatCard label="T фронта" value={`${(snapshot.frontTemperature - 273.15).toFixed(0)} °C`} />
        <StatCard label="Тепловыделение" value={`${(snapshot.heatReleaseRate / 1000).toFixed(1)} кВт`} />
      </div>

      <div className="burn-chamber">
        <div className="burn-chamber-head">
          <div className="burn-chamber-title">
            <span className="eyebrow">Стенд горения</span>
            <h3 style={{ marginTop: 6 }}>{materialLabel}</h3>
          </div>
          <div className="burn-scene-tags">
            <span>{ignitionLabel}</span>
            <span>T+ {currentTime.toFixed(1)} c</span>
            <span>λO₂ {snapshot.oxygenFactor.toFixed(2)}</span>
          </div>
        </div>

        <div className="burn-stick-ruler">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        <div className="burn-stick-stage">
          <div className="burn-stick-track">
            <div className="burn-stick-core" />
            <div className="burn-stick-burnt burn-stick-burnt-left" style={{ width: `${leftPct}%` }} />
            <div className="burn-stick-live" style={{ left: `${leftPct}%`, width: `${livePct}%` }} />
            <div className="burn-stick-burnt burn-stick-burnt-right" style={{ width: `${rightPct}%` }} />

            {!burnout && snapshot.frontPositions.map((position, index) => (
              <div
                key={`${index}-${position}`}
                className={`burn-front burn-front-${index}`}
                style={{ left: `calc(${(position / totalLength) * 100}% - 15px)` }}
              >
                <div className="burn-front-glow" />
                <div className="burn-front-core" />
              </div>
            ))}

            {burnout && <div className="burnout-badge">Палка догорела</div>}
          </div>
        </div>

        <div className="burn-scene-footer">
          <span>Скорость фронта: {snapshot.burnRate.toFixed(4)} м/с</span>
          <span>Сгорело: {(snapshot.burnedLength / totalLength * 100).toFixed(1)}%</span>
          <span>Накопленное тепло: {(snapshot.cumulativeHeat / 1000).toFixed(1)} кДж</span>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="burn-stat">
      <span className="burn-stat-label">{label}</span>
      <span className="burn-stat-value">{value}</span>
    </div>
  );
}
