import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import '../WaterModule.css';
import {
    playAssembleClick, playRemoveClick, playWaterSplash,
    playError,
    startPumpLoop, stopPumpLoop,
    startBreathing, stopBreathing
} from './PumpSFX';

// Начальные параметры "Самопомощи"
const INITIAL_PARAMS = {
    pistonDiameter: 50,
    strokeLength: 0.5,
    waterDepth: 8,
    pumpDepth: 5,
    cycleSpeed: 1,
};

const AVAILABLE_PARTS = [
    { id: 'pipe', name: 'Труба ПВХ', icon: '🚰', desc: 'Основа насоса', baseCost: 3 },   // $3/м длины
    { id: 'piston', name: 'Поршень', icon: '💿', desc: 'Создает тягу', baseCost: 8 },
    { id: 'valveBottom', name: 'Кл. Дна', icon: '🕳️', desc: 'Держит воду', baseCost: 5 },
    { id: 'valvePiston', name: 'Кл. Поршня', icon: '🍩', desc: 'Пропускает вверх', baseCost: 5 },
    { id: 'handle', name: 'Ручка', icon: '🕹️', desc: 'Механизм', baseCost: 12 },
    { id: 'seal', name: 'Герметик', icon: '🩹', desc: 'От протечек', baseCost: 2 },
];

import PumpScene from './PumpScene';
import GroundEnvironment from './GroundEnvironment';
import { WaterParticles, AquiferBubbles } from './WaterEffects';
import AnimatedCounter from './AnimatedCounter';

export default function WaterPumpModule() {
    const [params, setParams] = useState(INITIAL_PARAMS);
    const [assembledParts, setAssembledParts] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);

    const [metrics, setMetrics] = useState({
        volume: 0,
        force: 0,
        efficiency: 0,
        peopleServed: 0,
        fatigueRatio: 0,
        error: null
    });

    // Стоимость сборки (пересчитывается при изменении деталей/параметров)
    const buildCost = useMemo(() => {
        let cost = 0;
        assembledParts.forEach(partId => {
            const part = AVAILABLE_PARTS.find(p => p.id === partId);
            if (!part) return;
            if (partId === 'pipe') {
                // Труба: $3/м × глубина насоса × коэф. диаметра
                const diameterFactor = params.pistonDiameter / 50; // 50мм = 1x, 100мм = 2x
                cost += part.baseCost * params.pumpDepth * diameterFactor;
            } else if (partId === 'piston') {
                // Поршень дороже при большом диаметре
                cost += part.baseCost * (params.pistonDiameter / 50);
            } else {
                cost += part.baseCost;
            }
        });
        return cost.toFixed(0);
    }, [assembledParts, params.pumpDepth, params.pistonDiameter]);

    const handleAssemble = (partId) => {
        if (!assembledParts.includes(partId)) {
            setAssembledParts([...assembledParts, partId]);
            playAssembleClick();
        }
    };

    const handleRemove = (partId) => {
        setAssembledParts(assembledParts.filter(id => id !== partId));
        setIsSimulating(false);
        stopPumpLoop();
        stopBreathing();
        playRemoveClick();
    };

    const toggleSimulation = () => {
        const required = ['pipe', 'piston', 'valveBottom', 'valvePiston', 'handle', 'seal'];
        const hasAll = required.every(p => assembledParts.includes(p));

        if (!isSimulating && !hasAll) {
            setMetrics(m => ({ ...m, error: "Насос собран не полностью или не герметично!" }));
            playError();
            return;
        }

        if (!isSimulating) {
            // Запуск
            setMetrics(m => ({ ...m, error: null }));
            setIsSimulating(true);
            playWaterSplash();
            startPumpLoop(params.cycleSpeed);
        } else {
            // Остановка
            setIsSimulating(false);
            stopPumpLoop();
            stopBreathing();
        }
    };

    // Пересчет метрик
    useEffect(() => {
        if (isSimulating) {
            const pumpReachesWater = params.pumpDepth >= params.waterDepth;
            const forceRequired = params.pumpDepth * (params.pistonDiameter / 10);
            const maxForce = 150;
            const fatigue = Math.min(forceRequired / maxForce, 1.5);

            let newFlow = 0;
            let newEff = 0;
            let newError = null;
            let newPeople = 0;

            if (!pumpReachesWater) {
                newError = `Насос не достигает воды! Глубина насоса: ${params.pumpDepth}м, уровень воды: ${params.waterDepth}м`;
                playError();
            } else if (fatigue >= 1.0) {
                newError = "💀 Человек не может качать! Уменьшите диаметр или глубину.";
                playError();
            } else {
                const radiusM = (params.pistonDiameter / 2) / 1000;
                const volM3 = Math.PI * (radiusM * radiusM) * params.strokeLength;
                newFlow = (volM3 * 1000) * (params.cycleSpeed * 60);
                newEff = Math.max(10, 100 - fatigue * 50);
                const dailyLiters = newFlow * 60 * 8;
                newPeople = Math.floor(dailyLiters / 20);
            }

            // Дыхание при усталости
            if (pumpReachesWater && fatigue > 0.5 && fatigue < 1.0) {
                startBreathing(fatigue);
            } else {
                stopBreathing();
            }

            setMetrics({
                volume: newFlow.toFixed(1),
                force: pumpReachesWater ? forceRequired.toFixed(0) : 0,
                efficiency: newEff.toFixed(0),
                peopleServed: newPeople,
                fatigueRatio: pumpReachesWater ? fatigue : 0,
                error: newError
            });
        } else {
            setMetrics({ volume: 0, force: 0, efficiency: 0, peopleServed: 0, fatigueRatio: 0, error: null });
            stopBreathing();
        }
    }, [params, isSimulating]);

    // Стоимость за человека
    const costPerPerson = useMemo(() => {
        if (metrics.peopleServed > 0) {
            return (parseFloat(buildCost) / metrics.peopleServed).toFixed(2);
        }
        return '—';
    }, [buildCost, metrics.peopleServed]);

    return (
        <div className="water-module-container">
            {/* ЛЕВАЯ ПАНЕЛЬ: Инвентарь */}
            <div className="panel left-panel">
                <h2>Инвентарь (Самопомощь)</h2>
                <div className="parts-grid">
                    {AVAILABLE_PARTS.map(part => {
                        const isAssembled = assembledParts.includes(part.id);
                        return (
                            <motion.div
                                key={part.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`part-card ${isAssembled ? 'assembled' : ''}`}
                                onClick={() => isAssembled ? handleRemove(part.id) : handleAssemble(part.id)}
                            >
                                <div className="part-icon">{part.icon}</div>
                                <div className="part-info">
                                    <span className="part-name">{part.name}</span>
                                    <span className="part-desc">{part.desc}</span>
                                </div>
                                <AnimatePresence>
                                    {isAssembled && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="status-badge"
                                        >
                                            Установлено ✓
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* ЦЕНТР: 3D Сцена */}
            <div className="center-workspace">
                {/* Виньетка усталости */}
                {isSimulating && metrics.fatigueRatio > 0.5 && (
                    <div
                        className="fatigue-vignette"
                        style={{
                            opacity: Math.min((metrics.fatigueRatio - 0.5) * 2, 1),
                        }}
                    />
                )}

                <AnimatePresence>
                    {metrics.error && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="error-banner"
                        >
                            {metrics.error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <Canvas camera={{ position: [0, -params.waterDepth / 2, 16], fov: 50 }}>
                    <color attach="background" args={['#87CEEB']} />
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 10, 10]} intensity={1.0} castShadow />

                    <GroundEnvironment
                        waterDepth={params.waterDepth}
                        isSimulating={isSimulating && !metrics.error}
                    />

                    <PumpScene
                        assembledParts={assembledParts}
                        isSimulating={isSimulating && !metrics.error}
                        params={params}
                    />

                    {/* Частицы воды из трубы */}
                    <WaterParticles isSimulating={isSimulating && !metrics.error} />

                    {/* Пузырьки в аквифере */}
                    <AquiferBubbles waterDepth={params.waterDepth} />

                    <OrbitControls
                        makeDefault
                        target={[0, -params.waterDepth / 2, 0]}
                        minDistance={5}
                        maxDistance={30}
                    />
                </Canvas>

                <div className="simulation-controls">
                    <button
                        className={`sim-btn ${isSimulating ? 'stop' : 'start'}`}
                        onClick={toggleSimulation}
                    >
                        {isSimulating ? '⏹ ОСТАНОВИТЬ' : '▶ КАЧАТЬ ВОДУ'}
                    </button>
                </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ: Настройки и Метрики */}
            <div className="panel right-panel">
                <h2>Параметры</h2>
                <div className="sliders-container">
                    <div className="slider-group">
                        <label>Диаметр поршня: {params.pistonDiameter} мм</label>
                        <input
                            type="range" min="30" max="100"
                            value={params.pistonDiameter}
                            onChange={(e) => setParams({ ...params, pistonDiameter: Number(e.target.value) })}
                        />
                    </div>
                    <div className="slider-group">
                        <label>Длина хода: {params.strokeLength} м</label>
                        <input
                            type="range" min="0.2" max="1.5" step="0.1"
                            value={params.strokeLength}
                            onChange={(e) => setParams({ ...params, strokeLength: Number(e.target.value) })}
                        />
                    </div>
                    <div className="slider-group">
                        <label>🌊 Уровень воды: {params.waterDepth} м</label>
                        <input
                            type="range" min="5" max="15" step="1"
                            value={params.waterDepth}
                            onChange={(e) => setParams({ ...params, waterDepth: Number(e.target.value) })}
                        />
                    </div>
                    <div className="slider-group">
                        <label>🔧 Глубина насоса: {params.pumpDepth} м{params.pumpDepth < params.waterDepth ? ' ⚠️' : ' ✅'}</label>
                        <input
                            type="range" min="5" max="15" step="1"
                            value={params.pumpDepth}
                            onChange={(e) => setParams({ ...params, pumpDepth: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <h2>Бизнес-метрики</h2>
                <div className="metrics-dashboard">
                    <div className="metric-box highlight">
                        <span className="metric-label">💰 Стоимость сборки</span>
                        <span className="metric-value green"><AnimatedCounter value={buildCost} prefix="$" /></span>
                    </div>
                    <div className="metric-box highlight">
                        <span className="metric-label">👥 Обеспечивает водой</span>
                        <span className="metric-value blue"><AnimatedCounter value={metrics.peopleServed} suffix=" чел/день" /></span>
                        {metrics.peopleServed > 0 && (
                            <span className="metric-sub">${costPerPerson} / чел / день</span>
                        )}
                    </div>
                    <div className="metric-box">
                        <span className="metric-label">💧 Поток</span>
                        <span className="metric-value blue"><AnimatedCounter value={metrics.volume} suffix=" л/мин" /></span>
                    </div>
                    <div className={`metric-box ${metrics.fatigueRatio > 0.7 ? 'danger' : ''}`}>
                        <span className="metric-label">💪 Усилие / Усталость</span>
                        <span className="metric-value orange">
                            <AnimatedCounter value={metrics.force} suffix=" N" />
                            {metrics.fatigueRatio > 0 && (
                                <span style={{ fontSize: '0.8rem', marginLeft: 6 }}>
                                    (<AnimatedCounter value={(metrics.fatigueRatio * 100).toFixed(0)} suffix="%" />)
                                </span>
                            )}
                        </span>
                        {metrics.fatigueRatio > 0.7 && (
                            <div className="fatigue-bar">
                                <div
                                    className="fatigue-fill"
                                    style={{ width: `${Math.min(metrics.fatigueRatio * 100, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="metric-box">
                        <span className="metric-label">⚡ КПД</span>
                        <span className="metric-value green"><AnimatedCounter value={metrics.efficiency} suffix="%" /></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
