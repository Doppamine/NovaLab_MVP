import React, { useEffect, useMemo } from 'react';
import { LEVEL_PRESETS, useThermoStore } from '../_core/useThermoStore';
import { useFrameLoop } from '../_core/useFrameLoop';
import HeatEngine from '../_core/HeatEngine';
import { getMaterial } from '../_core/materials';
import PhysicsXRay from '../_core/PhysicsXRay';
import BeakerScene from './BeakerScene';
import './Level1_Equilibrium.css';

/**
 * Level 1 — "Тепловое равновесие"
 *
 * Three bodies dropped into a beaker. Solve for T_eq using the weighted-
 * average closed-form. PhysicsXRay shows the breakdown + Heat Seesaw.
 */
export default function Level1_Equilibrium() {
    const level = useThermoStore(s => s.level);
    const loadLevel = useThermoStore(s => s.loadLevel);
    const reset = useThermoStore(s => s.reset);
    const bodies = useThermoStore(s => s.bodies);
    const mode = useThermoStore(s => s.mode);
    const studentAnswer = useThermoStore(s => s.studentAnswer);
    const setStudentAnswer = useThermoStore(s => s.setStudentAnswer);
    const submitAnswer = useThermoStore(s => s.submitAnswer);
    const lastValidation = useThermoStore(s => s.lastValidation);
    const correctAnswer = useThermoStore(s => s.correctAnswer);
    const prompt = useThermoStore(s => s.prompt);
    const tolerance = useThermoStore(s => s.tolerance);

    // Boot the level on mount
    useEffect(() => {
        if (level !== 1) loadLevel(1);
    }, [level, loadLevel]);

    // Drive the relaxation animation while running
    useFrameLoop();

    // Live equilibrium follows the animated bodies. The X-Ray uses the original
    // givens so the heat ledger does not collapse to ~0 after the animation ends.
    const liveBreakdown = useMemo(() => {
        const arr = Object.values(bodies);
        if (arr.length === 0) return null;
        return HeatEngine.solveEquilibrium(arr);
    }, [bodies]);

    const breakdown = useMemo(
        () => HeatEngine.solveEquilibrium(Object.values(LEVEL_PRESETS[1].bodies)),
        []
    );

    // Build seesaw weights: released vs absorbed (must be hooked unconditionally)
    const seesawData = useMemo(() => {
        if (!breakdown) return null;
        let released = 0, absorbed = 0;
        breakdown.contributions.forEach(c => {
            if (c.CdT < 0) released += -c.CdT;
            else absorbed += c.CdT;
        });
        return { left: released, right: absorbed };
    }, [breakdown]);

    if (level !== 1) return <div className="thermo-loading">Загрузка…</div>;

    const showXray = mode === 'review';
    const success = lastValidation?.correct === true;

    return (
        <div className="thermo-level1">
            <div className="thermo-scene-wrap">
                <BeakerScene />

                {/* Floating live-temperature panel */}
                <div className="thermo-temps-panel">
                    <h4>📊 Температуры</h4>
                    {Object.values(bodies).map(b => {
                        const m = getMaterial(b.material);
                        return (
                            <div key={b.id} className="thermo-temp-row">
                                <span
                                    className="thermo-temp-dot"
                                    style={{ background: m.color, boxShadow: `0 0 8px ${m.glow}` }}
                                />
                                <span className="thermo-temp-label">{m.label}</span>
                                <span className="thermo-temp-value">
                                    {b.temperature.toFixed(1)}°C
                                </span>
                            </div>
                        );
                    })}
                    {liveBreakdown && (
                        <div className="thermo-temp-row equilibrium">
                            <span className="thermo-temp-dot" style={{ background: '#00ff9f' }} />
                            <span className="thermo-temp-label">T_eq (расчёт)</span>
                            <span className="thermo-temp-value">
                                {liveBreakdown.T_eq.toFixed(2)}°C
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <aside className="thermo-sidebar">
                <div className="thermo-prompt-card">
                    <div className="thermo-prompt-badge">Уровень 1 · Олимпиадная</div>
                    <h2>🌡️ Тепловое равновесие</h2>
                    <p>{prompt}</p>
                    <div className="thermo-formula-display">
                        <span className="thermo-formula-text">
                            T<sub>eq</sub> = Σ(c·m·T) / Σ(c·m)
                        </span>
                    </div>
                </div>

                <div className="thermo-bodies-card">
                    <h3>🧪 Состав смеси</h3>
                    {(() => {
                        const maxCapacity = Math.max(
                            ...Object.values(bodies).map(b => HeatEngine.heatCapacity(b)),
                            1
                        );
                        return Object.values(bodies).map(b => {
                            const m = getMaterial(b.material);
                            const capacity = HeatEngine.heatCapacity(b);
                            return (
                                <div key={b.id} className="thermo-body-spec">
                                    <div className="thermo-body-spec-header">
                                        <strong style={{ color: m.color }}>{m.label}</strong>
                                        <span>{(b.mass * 1000).toFixed(0)} г · {b.temperature.toFixed(0)}°C</span>
                                    </div>
                                    <div className="thermo-thermal-weight">
                                        <span style={{
                                            width: `${Math.max(8, (capacity / maxCapacity) * 100)}%`,
                                            background: m.glow,
                                            color: m.glow,
                                        }} />
                                    </div>
                                    <div className="thermo-body-spec-c">
                                        c = {m.c} Дж/(кг·К) · c·m = {capacity.toFixed(0)} Дж/К
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>

                <div className="thermo-answer-card">
                    <label>
                        Твой ответ T<sub>eq</sub>:
                        <div className="thermo-input-wrap">
                            <input
                                type="number"
                                step="0.01"
                                placeholder="например, 19.5"
                                value={studentAnswer}
                                onChange={e => setStudentAnswer(e.target.value)}
                                disabled={mode === 'simulating'}
                            />
                            <span className="thermo-unit">°C</span>
                        </div>
                    </label>
                    <button
                        className="thermo-submit-btn"
                        onClick={submitAnswer}
                        disabled={mode === 'simulating' || !studentAnswer}
                    >
                        Проверить ответ
                    </button>
                    <button className="thermo-reset-btn" onClick={reset}>
                        🔄 Начать заново
                    </button>
                </div>

                {showXray && breakdown && (
                    <PhysicsXRay
                        formula={{ lhs: 'T_eq', rhs: ['Σ(c·m·T)', 'Σ(c·m)'], op: '/' }}
                        variables={[
                            {
                                symbol: 'Σc·m·T',
                                unit: 'Дж·°C/К',
                                expected: breakdown.contributions.reduce(
                                    (a, c) => a + c.C * (c.temperature ?? 0), 0
                                ),
                                given: null,
                                tooltip: 'Сумма «тепловой вес × начальная температура» каждого тела. Это числитель.',
                            },
                            {
                                symbol: 'Σc·m',
                                unit: 'Дж/К',
                                expected: breakdown.totalCapacity,
                                given: null,
                                tooltip: 'Полная теплоёмкость системы — насколько «упрямо» она держит температуру.',
                            },
                        ]}
                        result={{
                            symbol: 'T_eq',
                            unit: '°C',
                            expected: correctAnswer,
                            given: parseFloat(studentAnswer),
                            tolerance,
                            tooltip: 'Итоговая температура — взвешенное среднее, где «вес» каждого тела равен c·m.',
                        }}
                        seesaw={seesawData}
                        success={success}
                        summary={
                            success
                                ? `🎉 Точно! Ты понял главное: вода (c=4200) тащит равновесие к себе.`
                                : `Твой ответ: ${parseFloat(studentAnswer).toFixed(2)}°C. Правильно: ${correctAnswer.toFixed(2)}°C. Посмотри на весы — какая чаша слишком лёгкая?`
                        }
                    />
                )}
            </aside>
        </div>
    );
}
