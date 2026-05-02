import React, { useEffect, useMemo } from 'react';
import { useThermoStore } from '../_core/useThermoStore';
import { useFrameLoop } from '../_core/useFrameLoop';
import HeatEngine from '../_core/HeatEngine';
import PhysicsXRay from '../_core/PhysicsXRay';
import PipelineScene from './PipelineScene';
import './Level3_Pipeline.css';

/**
 * Level 3 — "Текущий нагреватель"
 *
 * Continuous flow + steady-state energy balance. The student manipulates
 * the velocity slider to feel the inverse relationship: slower flow → hotter
 * water → eventually boiling → catastrophic visual.
 */
export default function Level3_Pipeline() {
    const level = useThermoStore(s => s.level);
    const loadLevel = useThermoStore(s => s.loadLevel);
    const reset = useThermoStore(s => s.reset);
    const mode = useThermoStore(s => s.mode);
    const flow = useThermoStore(s => s.flow);
    const setFlow = useThermoStore(s => s.setFlow);
    const studentAnswer = useThermoStore(s => s.studentAnswer);
    const setStudentAnswer = useThermoStore(s => s.setStudentAnswer);
    const submitAnswer = useThermoStore(s => s.submitAnswer);
    const lastValidation = useThermoStore(s => s.lastValidation);
    const correctAnswer = useThermoStore(s => s.correctAnswer);
    const prompt = useThermoStore(s => s.prompt);
    const tolerance = useThermoStore(s => s.tolerance);

    useEffect(() => {
        if (level !== 3) loadLevel(3);
    }, [level, loadLevel]);

    useFrameLoop();

    // Live solve — recomputes whenever the student moves the velocity slider.
    const solved = useMemo(() => {
        if (!flow) return null;
        return HeatEngine.solveFlow({
            P_total: flow.heaterPower,
            velocity: flow.velocity,
            diameter: flow.diameter,
            material: 'water',
            T_in: flow.T_in,
            T_out: flow.T_out,
        });
    }, [flow]);

    const nominalSolved = useMemo(() => {
        if (!flow) return null;
        return HeatEngine.solveFlow({
            P_total: flow.heaterPower,
            velocity: flow.nominalVelocity ?? 1,
            diameter: flow.diameter,
            material: 'water',
            T_in: flow.T_in,
            T_out: flow.nominalT_out ?? 35,
        });
    }, [flow]);

    if (level !== 3 || !flow || !solved || !nominalSolved) return <div className="thermo-loading">Загрузка…</div>;

    const showXray = mode === 'review';
    const success = lastValidation?.correct === true;
    const isBoiling = flow.T_out >= 100;

    return (
        <div className="thermo-level3">
            <div className="thermo-scene-wrap">
                <PipelineScene />

                {/* Live efficiency HUD */}
                <div className="thermo-flow-hud">
                    <div className="thermo-hud-row">
                        <span>ṁ (расход)</span>
                        <strong>{(solved.mdot * 1000).toFixed(1)} г/с</strong>
                    </div>
                    <div className="thermo-hud-row">
                        <span>P_полезн</span>
                        <strong>{(solved.P_useful / 1000).toFixed(1)} кВт</strong>
                    </div>
                    <div className="thermo-hud-row loss">
                        <span>P_потери</span>
                        <strong>{(solved.P_loss / 1000).toFixed(1)} кВт</strong>
                    </div>
                    <div className="thermo-hud-row eta">
                        <span>η</span>
                        <strong>{(solved.eta * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="thermo-hud-row outlet">
                        <span>T_выход</span>
                        <strong>{isBoiling ? '100°C+' : `${flow.T_out.toFixed(1)}°C`}</strong>
                    </div>
                </div>

                {isBoiling && (
                    <div className="thermo-boiling-warn">
                        ⚠️ ВОДА КИПИТ! Замедлил поток слишком сильно.
                    </div>
                )}
            </div>

            <aside className="thermo-sidebar">
                <div className="thermo-prompt-card">
                    <div className="thermo-prompt-badge">Уровень 3 · Динамика</div>
                    <h2>🌊 Текущий нагреватель</h2>
                    <p>{prompt}</p>
                    <div className="thermo-formula-display">
                        <span className="thermo-formula-text">
                            P<sub>полезн</sub> = ṁ·c·ΔT,&nbsp;η = P<sub>полезн</sub>/P<sub>общ</sub>
                        </span>
                    </div>
                </div>

                <div className="thermo-bodies-card">
                    <h3>🛠️ Параметры потока</h3>
                    <div className="thermo-slider-row">
                        <label>Скорость потока v</label>
                        <div className="thermo-slider-wrap">
                            <input
                                type="range"
                                min="0.05"
                                max="2.5"
                                step="0.01"
                                value={flow.velocity}
                                onChange={e => setFlow({ velocity: parseFloat(e.target.value) })}
                            />
                            <span>{flow.velocity.toFixed(2)} м/с</span>
                        </div>
                    </div>
                    <div className="thermo-readonly-row">
                        <span>Диаметр трубы d</span>
                        <strong>{(flow.diameter * 100).toFixed(1)} см</strong>
                    </div>
                    <div className="thermo-readonly-row">
                        <span>Мощность нагревателя</span>
                        <strong>{(flow.heaterPower / 1000).toFixed(0)} кВт</strong>
                    </div>
                    <div className="thermo-readonly-row">
                        <span>T_вход / T_выход</span>
                        <strong>{flow.T_in}°C → {isBoiling ? '100°C+' : `${flow.T_out.toFixed(1)}°C`}</strong>
                    </div>
                    <div className="thermo-readonly-row">
                        <span>Олимпиадные данные</span>
                        <strong>{flow.nominalVelocity?.toFixed(1) ?? '1.0'} м/с · {flow.nominalT_out ?? 35}°C</strong>
                    </div>
                </div>

                <div className="thermo-answer-card">
                    <label>
                        Доля потерь (от 0 до 1):
                        <div className="thermo-input-wrap">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="например, 0.47"
                                value={studentAnswer}
                                onChange={e => setStudentAnswer(e.target.value)}
                            />
                            <span className="thermo-unit">—</span>
                        </div>
                    </label>
                    <button
                        className="thermo-submit-btn"
                        onClick={submitAnswer}
                        disabled={!studentAnswer}
                    >
                        Проверить ответ
                    </button>
                    <button className="thermo-reset-btn" onClick={reset}>
                        🔄 Начать заново
                    </button>
                </div>

                {showXray && (
                    <PhysicsXRay
                        formula={{ lhs: 'P_полезн', rhs: ['ṁ', 'c', 'ΔT'], op: '·' }}
                        variables={[
                            {
                                symbol: 'ṁ',
                                unit: 'кг/с',
                                expected: nominalSolved.mdot,
                                given: null,
                                tooltip: 'Массовый расход = ρ·A·v = 1000·π(0.01)²·1 ≈ 0.314 кг/с.',
                            },
                            {
                                symbol: 'c',
                                unit: 'Дж/(кг·К)',
                                expected: 4200,
                                given: null,
                                tooltip: 'Удельная теплоёмкость воды.',
                            },
                            {
                                symbol: 'ΔT',
                                unit: 'К',
                                expected: (flow.nominalT_out ?? 35) - flow.T_in,
                                given: null,
                                tooltip: 'Прирост температуры воды между входом и выходом.',
                            },
                        ]}
                        result={{
                            symbol: '1−η',
                            unit: '',
                            expected: correctAnswer,
                            given: parseFloat(studentAnswer),
                            tolerance,
                            tooltip: 'Доля энергии, не попавшей в воду — то есть потерянной в окружающую среду.',
                        }}
                        loss={{
                            P_total: flow.heaterPower,
                            P_useful: nominalSolved.P_useful,
                            P_loss: nominalSolved.P_loss,
                            eta: nominalSolved.eta,
                        }}
                        success={success}
                        summary={
                            success
                                ? `🎉 Точно! ${(correctAnswer * 100).toFixed(1)}% энергии теряется. Это и есть КПД нагревателя.`
                                : `Правильно: ${(correctAnswer * 100).toFixed(1)}% потерь. Подсказка: посчитай ṁ·c·ΔT и сравни с 50 кВт.`
                        }
                    />
                )}
            </aside>
        </div>
    );
}
