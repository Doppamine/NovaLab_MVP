import React, { useEffect } from 'react';
import { useThermoStore } from '../_core/useThermoStore';
import { useFrameLoop } from '../_core/useFrameLoop';
import HeatEngine from '../_core/HeatEngine';
import { getMaterial } from '../_core/materials';
import PhysicsXRay from '../_core/PhysicsXRay';
import KitchenScene from './KitchenScene';
import './Level2_Kitchen.css';

/**
 * Level 2 — "Катастрофический чайник"
 *
 * Kettle dumps Q_released into kitchen air. Idealized adiabatic walls.
 * The spectacle: room glows, thermometer rockets, the question lands —
 * "Why didn't you die in your kitchen this morning?"
 */
export default function Level2_Kitchen() {
    const level = useThermoStore(s => s.level);
    const loadLevel = useThermoStore(s => s.loadLevel);
    const reset = useThermoStore(s => s.reset);
    const mode = useThermoStore(s => s.mode);
    const room = useThermoStore(s => s.room);
    const bodies = useThermoStore(s => s.bodies);
    const sourceTargetTemp = useThermoStore(s => s.sourceTargetTemp);
    const studentAnswer = useThermoStore(s => s.studentAnswer);
    const setStudentAnswer = useThermoStore(s => s.setStudentAnswer);
    const submitAnswer = useThermoStore(s => s.submitAnswer);
    const lastValidation = useThermoStore(s => s.lastValidation);
    const correctAnswer = useThermoStore(s => s.correctAnswer);
    const startSimulation = useThermoStore(s => s.startSimulation);
    const prompt = useThermoStore(s => s.prompt);
    const tolerance = useThermoStore(s => s.tolerance);

    useEffect(() => {
        if (level !== 2) loadLevel(2);
    }, [level, loadLevel]);

    useFrameLoop();

    if (level !== 2 || !room) return <div className="thermo-loading">Загрузка…</div>;

    const kettle = bodies.kettle_water;
    const water = getMaterial('water');
    const air = getMaterial('air');

    // Solve once for X-Ray
    const solution = HeatEngine.absorbIntoEnclosure({
        sourceBody: kettle,
        T_final_source: sourceTargetTemp,
        enclosure: room,
    });

    const showXray = mode === 'review';
    const success = lastValidation?.correct === true;

    return (
        <div className="thermo-level2">
            <div className="thermo-scene-wrap">
                <KitchenScene />
                {mode === 'setup' && (
                    <div className="thermo-overlay-hint">
                        <button className="thermo-cta" onClick={startSimulation}>
                            🔥 Запустить симуляцию
                        </button>
                        <p>Чайник отдаст 3 л кипятка свою тепловую энергию воздуху…</p>
                    </div>
                )}
            </div>

            <aside className="thermo-sidebar">
                <div className="thermo-prompt-card">
                    <div className="thermo-prompt-badge">Уровень 2 · Катастрофа</div>
                    <h2>♨️ Катастрофический чайник</h2>
                    <p>{prompt}</p>
                    <div className="thermo-formula-display">
                        <span className="thermo-formula-text">
                            ΔT_возд = (c<sub>в</sub>·m<sub>в</sub>·ΔT<sub>в</sub>) / (c<sub>возд</sub>·ρ<sub>возд</sub>·V)
                        </span>
                    </div>
                </div>

                <div className="thermo-bodies-card">
                    <h3>📐 Параметры</h3>
                    <div className="thermo-body-spec">
                        <div className="thermo-body-spec-header">
                            <strong style={{ color: water.color }}>Вода в чайнике</strong>
                            <span>{(kettle.mass).toFixed(1)} кг · {kettle.temperature.toFixed(0)}°C → {sourceTargetTemp}°C</span>
                        </div>
                        <div className="thermo-body-spec-c">c = {water.c} Дж/(кг·К)</div>
                    </div>
                    <div className="thermo-body-spec">
                        <div className="thermo-body-spec-header">
                            <strong style={{ color: air.color }}>Воздух кухни</strong>
                            <span>S={room.floorArea} м² · h={room.height} м</span>
                        </div>
                        <div className="thermo-body-spec-c">
                            ρ = {room.airDensity} кг/м³ · c = {air.c} Дж/(кг·К)
                        </div>
                    </div>
                </div>

                <div className="thermo-answer-card">
                    <label>
                        Твой ответ ΔT<sub>воздуха</sub>:
                        <div className="thermo-input-wrap">
                            <input
                                type="number"
                                step="0.1"
                                placeholder="например, 43"
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

                {showXray && (
                    <>
                        <PhysicsXRay
                            formula={{ lhs: 'ΔT_возд', rhs: ['Q', 'c·m_возд'], op: '/' }}
                            variables={[
                                {
                                    symbol: 'Q',
                                    unit: 'Дж',
                                    expected: solution.Q,
                                    given: null,
                                    tooltip: 'Тепло, отданное водой = c·m·(100 − 20) = 4200·3·80 ≈ 1 МДж.',
                                },
                                {
                                    symbol: 'c·m_возд',
                                    unit: 'Дж/К',
                                    expected: air.c * solution.mAir,
                                    given: null,
                                    tooltip: `Сначала V = S·h = ${room.floorArea}·${room.height} = ${(room.floorArea * room.height).toFixed(0)} м³, потом m = ρ·V ≈ ${solution.mAir.toFixed(1)} кг.`,
                                },
                            ]}
                            result={{
                                symbol: 'ΔT',
                                unit: '°C',
                                expected: correctAnswer,
                                given: parseFloat(studentAnswer),
                                tolerance,
                                tooltip: 'Прирост температуры воздуха — это твой ответ. Финальная температура была бы 20°C + ΔT.',
                            }}
                            success={success}
                            summary={
                                success
                                    ? `🎉 Точно. Воздух набрал бы +${correctAnswer.toFixed(1)}°C — это ${(20 + correctAnswer).toFixed(0)}°C итого.`
                                    : `Правильно: +${correctAnswer.toFixed(1)}°C (твой ответ: +${parseFloat(studentAnswer).toFixed(1)}°C).`
                            }
                        />

                        {/* The "Aha!" moment */}
                        <div className="thermo-aha-card">
                            <h3>🤔 Почему ты не умер на кухне сегодня утром?</h3>
                            <p>
                                В реальности воздух нагрелся бы только на пару градусов, потому что:
                            </p>
                            <ul>
                                <li><strong>Стены и мебель</strong> впитывают огромную часть тепла (у бетона тоже есть c·m).</li>
                                <li><strong>Кухня не герметична</strong> — горячий воздух уходит через щели и вентиляцию.</li>
                                <li><strong>Чайник остывает медленно</strong> — тепло «растягивается» во времени.</li>
                            </ul>
                            <p>Идеальная физика — это первый шаг. Реальная физика учитывает все «утечки».</p>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}
