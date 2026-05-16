import React, { useEffect, useMemo, useRef, useState } from 'react';
import LiveChart from '../../ui/LiveChart.jsx';
import BurningStickScene from '../scene/BurningStickScene.jsx';

export default function PhaseBurningSimulate({
  result,
  materialLabel,
  ignitionLabel,
  totalLength,
  onNext,
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const lastTickRef = useRef(0);

  const tMax = result.summary.burnout_time ?? result.history[result.history.length - 1]?.t ?? 0;

  useEffect(() => {
    if (!playing) return undefined;

    let rafId;
    const tick = (now) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setCurrentTime((time) => {
        const next = time + dt * speed;
        if (next >= tMax) {
          setPlaying(false);
          return tMax;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    lastTickRef.current = performance.now();
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, speed, tMax]);

  const reset = () => {
    setCurrentTime(0);
    setPlaying(true);
  };

  const remainingLengthSeries = useMemo(() => ([{
    name: 'Осталось длины',
    color: '#e8b54a',
    data: result.history.map((row) => ({ t: row.t, y: row.remainingLength })),
  }]), [result]);

  const massSeries = useMemo(() => ([{
    name: 'Осталось массы',
    color: '#2d8b7a',
    data: result.history.map((row) => ({ t: row.t, y: row.massRemaining * 1000 })),
  }]), [result]);

  const temperatureSeries = useMemo(() => ([{
    name: 'T фронта',
    color: '#c85c3c',
    data: result.history.map((row) => ({ t: row.t, y: row.frontTemperature - 273.15 })),
  }]), [result]);

  return (
    <div>
      <div className="eyebrow">Фаза 03 / Симуляция — фронт горения</div>
      <h2 style={{ marginTop: 8, marginBottom: 20 }}>Смотрим, как палка прогорает во времени</h2>

      <BurningStickScene
        result={result}
        currentTime={currentTime}
        materialLabel={materialLabel}
        ignitionLabel={ignitionLabel}
        totalLength={totalLength}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => setPlaying((value) => !value)}>
          {playing ? '⏸ Пауза' : '▶ Играть'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>↻ Сброс</button>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          Скорость:
          <select
            value={speed}
            onChange={(event) => setSpeed(parseFloat(event.target.value))}
            style={{ padding: '4px 10px', borderRadius: 4 }}
          >
            <option value={0.25}>0.25×</option>
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>
        <input
          type="range"
          min="0"
          max={tMax}
          step="0.05"
          value={currentTime}
          onChange={(event) => {
            setCurrentTime(parseFloat(event.target.value));
            setPlaying(false);
          }}
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
        <div className="card">
          <div className="card-title">◉ Остаток длины</div>
          <LiveChart
            series={remainingLengthSeries}
            xLabel="время t, секунды"
            yLabel="длина, м"
            currentTime={currentTime}
            yMin={0}
            yMax={totalLength * 1.05}
            xMin={0}
            xMax={tMax}
          />
        </div>

        <div className="burn-chart-grid">
          <div className="card">
            <div className="card-title">◉ Остаток массы</div>
            <LiveChart
              series={massSeries}
              xLabel="время t, секунды"
              yLabel="масса, г"
              currentTime={currentTime}
              yMin={0}
              xMin={0}
              xMax={tMax}
            />
          </div>

          <div className="card">
            <div className="card-title">◉ Температура фронта</div>
            <LiveChart
              series={temperatureSeries}
              xLabel="время t, секунды"
              yLabel="температура, °C"
              currentTime={currentTime}
              xMin={0}
              xMax={tMax}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-primary-gold" onClick={onNext}>
          → Сравнить с моей оценкой
        </button>
      </div>
    </div>
  );
}
