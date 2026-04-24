import React, { useEffect, useRef, useState } from 'react';
import FallingObjectsScene from '../scene/FallingObjectsScene.jsx';
import LiveChart from '../ui/LiveChart.jsx';

export default function PhaseSimulate({ result, planetLabel, dropHeight, onNext }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 0.25× .. 2×
  const lastTickRef = useRef(performance.now());

  const tMax = Math.max(
    result.object1.events[0]?.t ?? result.object1.times[result.object1.times.length - 1],
    result.object2.events[0]?.t ?? result.object2.times[result.object2.times.length - 1]
  );

  useEffect(() => {
    if (!playing) return;
    let raf;
    const loop = (now) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setCurrentTime((t) => {
        const next = t + dt * speed;
        if (next >= tMax) { setPlaying(false); return tMax; }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    lastTickRef.current = performance.now();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, tMax]);

  const reset = () => { setCurrentTime(0); setPlaying(true); };

  // Данные для графиков
  const heightSeries = [
    {
      name: '🔨 Молоток',
      color: '#e8b54a',
      data: result.object1.times.map((t, i) => ({ t, y: result.object1.states[i][0] })),
    },
    {
      name: '🪶 Перо',
      color: '#2d8b7a',
      data: result.object2.times.map((t, i) => ({ t, y: result.object2.states[i][0] })),
    },
  ];
  const velocitySeries = [
    {
      name: '🔨 Молоток',
      color: '#e8b54a',
      data: result.object1.times.map((t, i) => ({ t, y: Math.abs(result.object1.states[i][1]) })),
    },
    {
      name: '🪶 Перо',
      color: '#2d8b7a',
      data: result.object2.times.map((t, i) => ({ t, y: Math.abs(result.object2.states[i][1]) })),
    },
  ];

  return (
    <div>
      <div className="eyebrow">Фаза 03 / Симуляция — живой расчёт</div>
      <h2 style={{ marginTop: 8, marginBottom: 20 }}>Наблюдаем</h2>

      <FallingObjectsScene
        result={result}
        currentTime={currentTime}
        planetLabel={planetLabel}
        dropHeight={dropHeight}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸ Пауза' : '▶ Играть'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>↻ Сброс</button>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          Скорость:
          <select value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  style={{ padding: '4px 10px', borderRadius: 4 }}>
            <option value={0.25}>0.25×</option>
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
        <input
          type="range"
          min="0" max={tMax} step="0.01"
          value={currentTime}
          onChange={(e) => { setCurrentTime(parseFloat(e.target.value)); setPlaying(false); }}
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
        <div className="card">
          <div className="card-title">◉ Высота h(t)</div>
          <LiveChart
            series={heightSeries}
            xLabel="время t, секунды"
            yLabel="высота, м"
            currentTime={currentTime}
            yMin={0}
            yMax={dropHeight * 1.05}
            xMin={0} xMax={tMax}
          />
        </div>

        <div className="card">
          <div className="card-title">◉ Скорость |v(t)|</div>
          <LiveChart
            series={velocitySeries}
            xLabel="время t, секунды"
            yLabel="модуль скорости, м/с"
            currentTime={currentTime}
            yMin={0}
            xMin={0} xMax={tMax}
          />
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-primary-gold" onClick={onNext}>
          → Сравнить с моим ответом
        </button>
      </div>
    </div>
  );
}
