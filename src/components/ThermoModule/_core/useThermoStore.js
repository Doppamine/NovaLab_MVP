/**
 * Thermodynamics store (Zustand).
 *
 * Design notes:
 *   • `subscribeWithSelector` middleware lets R3F meshes subscribe to scalar
 *     fields (e.g. `bodies.water_beaker.temperature`) inside useFrame via
 *     `useThermoStore.getState()` without triggering React re-renders on
 *     every 60 Hz tick.
 *   • Every level shares the same `bodies` map + action vocabulary. The level
 *     identifier switches which actions do what inside HeatEngine.step().
 *   • Level scenarios live in `LEVEL_PRESETS` — loading one resets the store.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import HeatEngine from './HeatEngine.js';

// ──────────────────────────────────────────────────────────────
// LEVEL PRESETS — the three canonical Olympiad scenarios.
// ──────────────────────────────────────────────────────────────

export const LEVEL_PRESETS = {
    1: {
        level: 1,
        title: 'Тепловое равновесие',
        prompt:
            'В стакане 200 г воды при 20°C. Ты бросаешь в него стальную деталь (300 г, 10°C) и медную пластину (400 г, 25°C). Какая установится температура?',
        bodies: {
            water_beaker: {
                id: 'water_beaker',
                material: 'water',
                mass: 0.2,
                temperature: 20,
                position: [0, 0, 0],
                label: 'Вода',
            },
            steel_part: {
                id: 'steel_part',
                material: 'steel',
                mass: 0.3,
                temperature: 10,
                position: [-1.4, 1.8, 0],
                label: 'Сталь',
                inserted: false,
            },
            copper_plate: {
                id: 'copper_plate',
                material: 'copper',
                mass: 0.4,
                temperature: 25,
                position: [1.4, 1.8, 0],
                label: 'Медь',
                inserted: false,
            },
        },
        answerUnit: '°C',
        answerLabel: 'Итоговая температура T_eq',
        tolerance: 0.5,
    },
    2: {
        level: 2,
        title: 'Катастрофический чайник',
        prompt:
            'Чайник с 3 литрами кипятка остывает до 20°C. Если всё это тепло уйдёт в воздух кухни (площадь 6 м², высота 3 м) — на сколько градусов нагреется воздух?',
        bodies: {
            kettle_water: {
                id: 'kettle_water',
                material: 'water',
                mass: 3.0,
                temperature: 100,
                position: [0, 0.5, 0],
                label: 'Вода в чайнике',
            },
        },
        room: {
            floorArea: 6,    // m²
            height: 3,       // m
            width: 3,         // m (visual only)
            depth: 2,        // m (visual only)
            initialAirTemp: 20,
            airDensity: 1.29,
            useCv: false,
        },
        sourceTargetTemp: 20,
        answerUnit: '°C',
        answerLabel: 'Прирост температуры воздуха ΔT',
        tolerance: 2.0,
    },
    3: {
        level: 3,
        title: 'Текущий нагреватель',
        prompt:
            'Нагреватель 50 кВт нагревает воду, текущую со скоростью 1 м/с по трубе диаметром 2 см. Вода входит при 15°C и выходит при 35°C. Какая доля тепла теряется в окружающую среду?',
        bodies: {
            flowing_water: {
                id: 'flowing_water',
                material: 'water',
                mass: 0,          // derived dynamically from ṁ × t (display only)
                temperature: 25,  // avg; just a placeholder
                position: [0, 0, 0],
                label: 'Поток воды',
            },
        },
        flow: {
            velocity: 1.0,      // m/s
            diameter: 0.02,     // m
            heaterPower: 50_000, // W
            T_in: 15,
            T_out: 35,
        },
        answerUnit: '',
        answerLabel: 'Доля потерь (0–1)',
        tolerance: 0.03,
    },
};

// ──────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────

const initialState = {
    // Current scenario
    level: null,
    title: '',
    prompt: '',

    // Physics primitives
    bodies: {},

    // Level-2 extras
    room: null,
    sourceTargetTemp: null,
    airTemp: 20,              // animated during simulation
    level2Duration: 6,        // seconds for the room-fill animation
    level2Target: null,       // computed T_air_final
    level2InitialAirTemp: 20,

    // Level-3 extras
    flow: null,

    // Run state
    mode: 'idle',             // 'idle' | 'setup' | 'simulating' | 'answering' | 'review'
    simTime: 0,
    dt: 1 / 60,
    running: false,

    // Answer / feedback
    studentAnswer: '',
    correctAnswer: null,
    lastValidation: null,
    answerUnit: '',
    answerLabel: '',
    tolerance: 0,
};

export const useThermoStore = create(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        // ── Scenario loading ────────────────────────────────────
        loadLevel(levelId) {
            const preset = LEVEL_PRESETS[levelId];
            if (!preset) throw new Error(`Unknown level: ${levelId}`);

            // Precompute correct answers so the UI can grade instantly.
            let correctAnswer = null;
            let level2Target = null;
            let flow = preset.flow ? { ...preset.flow } : null;

            if (levelId === 1) {
                const { T_eq } = HeatEngine.solveEquilibrium(
                    Object.values(preset.bodies)
                );
                correctAnswer = T_eq;
            } else if (levelId === 2) {
                const result = HeatEngine.absorbIntoEnclosure({
                    sourceBody: preset.bodies.kettle_water,
                    T_final_source: preset.sourceTargetTemp,
                    enclosure: preset.room,
                });
                correctAnswer = result.deltaTair;
                level2Target = result.T_air_final;
            } else if (levelId === 3) {
                const flowResult = HeatEngine.solveFlow({
                    P_total: preset.flow.heaterPower,
                    velocity: preset.flow.velocity,
                    diameter: preset.flow.diameter,
                    material: 'water',
                    T_in: preset.flow.T_in,
                    T_out: preset.flow.T_out,
                });
                correctAnswer = flowResult.lossFraction;
                flow = {
                    ...preset.flow,
                    nominalVelocity: preset.flow.velocity,
                    nominalT_out: preset.flow.T_out,
                    nominalEta: flowResult.eta,
                    nominalLossFraction: flowResult.lossFraction,
                };
            }

            set({
                ...initialState,
                level: preset.level,
                title: preset.title,
                prompt: preset.prompt,
                bodies: structuredClone(preset.bodies),
                room: preset.room ? { ...preset.room } : null,
                sourceTargetTemp: preset.sourceTargetTemp ?? null,
                flow,
                answerUnit: preset.answerUnit,
                answerLabel: preset.answerLabel,
                tolerance: preset.tolerance,
                correctAnswer,
                level2Target,
                level2InitialAirTemp: preset.room?.initialAirTemp ?? 20,
                airTemp: preset.room?.initialAirTemp ?? 20,
                mode: 'setup',
            });
        },

        reset() {
            const lvl = get().level;
            if (lvl) get().loadLevel(lvl);
            else set(initialState);
        },

        // ── Body mutations (student-driven edits) ────────────────
        setBodyTemp(id, temperature) {
            set(s => ({
                bodies: { ...s.bodies, [id]: { ...s.bodies[id], temperature } },
            }));
        },

        setBodyMass(id, mass) {
            set(s => ({
                bodies: { ...s.bodies, [id]: { ...s.bodies[id], mass } },
            }));
        },

        setBodyInserted(id, inserted) {
            set(s => ({
                bodies: { ...s.bodies, [id]: { ...s.bodies[id], inserted } },
            }));
        },

        // ── Level-3 flow mutations ──────────────────────────────
        setFlow(patch) {
            set(s => {
                const flow = { ...s.flow, ...patch };

                // Sandbox projection: preserve the measured heater efficiency from
                // the Olympiad givens, then let velocity/diameter change the water
                // temperature. Slower flow means the same useful watts hit fewer
                // kilograms each second, so the outlet can race toward boiling.
                if (s.level === 3 && flow.velocity > 0 && flow.diameter > 0) {
                    const eta = flow.nominalEta ?? Math.max(0, 1 - (s.correctAnswer ?? 0));
                    flow.T_out = HeatEngine.outletTempFromFlow({
                        P_total: flow.heaterPower,
                        eta,
                        velocity: flow.velocity,
                        diameter: flow.diameter,
                        material: 'water',
                        T_in: flow.T_in,
                    });
                }

                return { flow };
            });
        },

        // ── Simulation control ──────────────────────────────────
        startSimulation() {
            set({ mode: 'simulating', running: true, simTime: 0 });
        },

        stopSimulation() {
            set({ running: false, mode: 'answering' });
        },

        tick(dtOverride) {
            const s = get();
            if (!s.running) return;
            const dt = dtOverride ?? s.dt;
            const patch = HeatEngine.step(s, dt);
            // Auto-stop conditions.
            if (s.level === 1) {
                const bodies = Object.values(patch.bodies ?? s.bodies);
                const temps = bodies.map(b => b.temperature);
                const spread = Math.max(...temps) - Math.min(...temps);
                if (spread < 0.05) {
                    set({ ...patch, running: false, mode: 'answering' });
                    return;
                }
            }
            if (s.level === 2) {
                if ((patch.simTime ?? 0) >= (s.level2Duration ?? 6)) {
                    set({ ...patch, running: false, mode: 'answering' });
                    return;
                }
            }
            set(patch);
        },

        // ── Answer flow ─────────────────────────────────────────
        setStudentAnswer(value) {
            set({ studentAnswer: value });
        },

        submitAnswer() {
            const s = get();
            const given = parseFloat(s.studentAnswer);
            if (Number.isNaN(given)) {
                set({ lastValidation: { error: 'parse', given: s.studentAnswer } });
                return;
            }
            const validation = HeatEngine.validateAnswer({
                level: s.level,
                given,
                expected: s.correctAnswer,
                tolerance: s.tolerance,
            });
            set({ lastValidation: validation, mode: 'review' });
        },

        clearValidation() {
            set({ lastValidation: null, mode: 'answering' });
        },
    }))
);

// Convenience selector helpers for hot paths (useFrame consumers should call
// useThermoStore.getState() inside the frame loop — do not use these hooks there).
export const selectBodies = s => s.bodies;
export const selectLevel = s => s.level;
export const selectMode = s => s.mode;
export const selectFlow = s => s.flow;
