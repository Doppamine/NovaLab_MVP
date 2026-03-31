import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import '../WaterModule.css';
import {
    playAssembleClick, playRemoveClick, playWaterPour,
    playError, startFilterDrip, stopFilterDrip
} from './FilterSFX';

import FilterScene from './FilterScene';
import AnimatedCounter from '../Pump/AnimatedCounter';

// Детали биопесчаного фильтра
const AVAILABLE_PARTS = [
    { id: 'bucket', name: 'Корпус (ведро)', icon: '🪣', desc: 'Контейнер фильтра', baseCost: 8, purification: 0 },
    { id: 'gravelCoarse', name: 'Гравий крупный', icon: '🪨', desc: 'Дренажный слой', baseCost: 2, purification: 5 },
    { id: 'gravelFine', name: 'Гравий мелкий', icon: '🪨', desc: 'Предфильтрация', baseCost: 2, purification: 10 },
    { id: 'sandCoarse', name: 'Песок крупный', icon: '🏖️', desc: 'Переходный слой', baseCost: 2, purification: 15 },
    { id: 'sandFine', name: 'Песок мелкий', icon: '🏖️', desc: 'Основной фильтр', baseCost: 3, purification: 40 },
    { id: 'diffuser', name: 'Диффузор', icon: '🔲', desc: 'Защита биослоя', baseCost: 3, purification: 0 },
    { id: 'outlet', name: 'Трубка выхода', icon: '🚰', desc: 'Вывод чистой воды', baseCost: 2, purification: 0 },
];

const FILTER_LAYERS = ['gravelCoarse', 'gravelFine', 'sandCoarse', 'sandFine'];

export default function WaterFilterModule() {
    const [assembledParts, setAssembledParts] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);

    const [metrics, setMetrics] = useState({
        purification: 0,
        flowRate: 0,
        peopleServed: 0,
        error: null,
        removes: { bacteria: false, protozoa: false, turbidity: false, chemicals: false },
    });

    // Стоимость
    const buildCost = useMemo(() => {
        return assembledParts.reduce((sum, partId) => {
            const part = AVAILABLE_PARTS.find(p => p.id === partId);
            return sum + (part ? part.baseCost : 0);
        }, 0);
    }, [assembledParts]);

    // Стоимость за человека
    const costPerPerson = useMemo(() => {
        if (metrics.peopleServed > 0) {
            return (buildCost / metrics.peopleServed).toFixed(2);
        }
        return '—';
    }, [buildCost, metrics.peopleServed]);

    // Собрать
    const handleAssemble = (partId) => {
        if (!assembledParts.includes(partId)) {
            setAssembledParts([...assembledParts, partId]);
            playAssembleClick();
        }
    };

    // Убрать
    const handleRemove = (partId) => {
        setAssembledParts(assembledParts.filter(id => id !== partId));
        setIsFiltering(false);
        stopFilterDrip();
        playRemoveClick();
    };

    // Запуск/стоп
    const toggleFiltering = () => {
        const hasBucket = assembledParts.includes('bucket');
        const hasOutlet = assembledParts.includes('outlet');
        const hasLayers = FILTER_LAYERS.some(l => assembledParts.includes(l));

        if (!isFiltering && !(hasBucket && hasOutlet && hasLayers)) {
            setMetrics(m => ({ ...m, error: 'Нужен корпус, хотя бы один фильтрующий слой и трубка выхода!' }));
            playError();
            return;
        }

        if (!isFiltering) {
            setMetrics(m => ({ ...m, error: null }));
            setIsFiltering(true);
            playWaterPour();
            startFilterDrip();
        } else {
            setIsFiltering(false);
            stopFilterDrip();
        }
    };

    // Пересчёт метрик
    useEffect(() => {
        if (isFiltering) {
            // Очистка = сумма слоёв + бонус за диффузор
            let purification = 0;
            let layerCount = 0;
            FILTER_LAYERS.forEach(layerId => {
                if (assembledParts.includes(layerId)) {
                    const part = AVAILABLE_PARTS.find(p => p.id === layerId);
                    purification += part.purification;
                    layerCount++;
                }
            });

            // Диффузор добавляет +3% (защищает биослой)
            if (assembledParts.includes('diffuser')) {
                purification += 3;
            }

            purification = Math.min(purification, 98); // Макс 98%

            // Скорость: базовая 12 л/час, уменьшается с каждым слоем
            const flowRate = Math.max(2, 12 - layerCount * 2.5);

            // Люди: л/час × 8 часов / 20 л/чел/день
            const dailyLiters = flowRate * 8;
            const peopleServed = Math.floor(dailyLiters / 20);

            // Что удаляет
            const hasSandFine = assembledParts.includes('sandFine');
            const hasSandCoarse = assembledParts.includes('sandCoarse');
            const hasGravelFine = assembledParts.includes('gravelFine');

            setMetrics({
                purification,
                flowRate: flowRate.toFixed(1),
                peopleServed,
                error: null,
                removes: {
                    bacteria: hasSandFine,              // Мелкий песок ловит бактерии
                    protozoa: hasSandFine || hasSandCoarse, // Песок ловит простейших
                    turbidity: hasGravelFine || hasSandCoarse, // Гравий + песок — мутность
                    chemicals: false,                    // BSF не убирает химию (нужен уголь)
                },
            });
        } else {
            setMetrics({
                purification: 0,
                flowRate: 0,
                peopleServed: 0,
                error: null,
                removes: { bacteria: false, protozoa: false, turbidity: false, chemicals: false },
            });
        }
    }, [assembledParts, isFiltering]);

    return (
        <div className="water-module-container">
            {/* ЛЕВАЯ ПАНЕЛЬ: Инвентарь */}
            <div className="panel left-panel">
                <h2>Инвентарь (Биофильтр)</h2>
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

                <Canvas camera={{ position: [5, 1, 8], fov: 45 }}>
                    <color attach="background" args={['#1a2332']} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
                    <pointLight position={[0, -2, 0]} intensity={0.3} color="#4FC3F7" />

                    <FilterScene
                        assembledParts={assembledParts}
                        isFiltering={isFiltering && !metrics.error}
                    />

                    <OrbitControls
                        makeDefault
                        target={[0, 0, 0]}
                        minDistance={5}
                        maxDistance={20}
                    />
                </Canvas>

                <div className="simulation-controls">
                    <button
                        className={`sim-btn ${isFiltering ? 'stop' : 'start'}`}
                        onClick={toggleFiltering}
                    >
                        {isFiltering ? '⏹ ОСТАНОВИТЬ' : '▶ ФИЛЬТРОВАТЬ'}
                    </button>
                </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ: Настройки и Метрики */}
            <div className="panel right-panel">
                <h2>Бизнес-метрики</h2>
                <div className="metrics-dashboard">
                    <div className="metric-box highlight">
                        <span className="metric-label">💰 Стоимость сборки</span>
                        <span className="metric-value green"><AnimatedCounter value={buildCost} prefix="$" /></span>
                    </div>
                    <div className="metric-box highlight">
                        <span className="metric-label">🧪 Степень очистки</span>
                        <span className={`metric-value ${metrics.purification > 70 ? 'green' : metrics.purification > 30 ? 'orange' : 'red'}`}>
                            <AnimatedCounter value={metrics.purification} suffix="%" />
                        </span>
                    </div>
                    <div className="metric-box">
                        <span className="metric-label">⏱️ Скорость</span>
                        <span className="metric-value blue"><AnimatedCounter value={metrics.flowRate} suffix=" л/час" /></span>
                    </div>
                    <div className="metric-box highlight">
                        <span className="metric-label">👥 Обеспечивает водой</span>
                        <span className="metric-value blue"><AnimatedCounter value={metrics.peopleServed} suffix=" чел/день" /></span>
                        {metrics.peopleServed > 0 && (
                            <span className="metric-sub">${costPerPerson} / чел / день</span>
                        )}
                    </div>

                    {/* Чеклист: что удаляет */}
                    <div className="metric-box filter-checklist">
                        <span className="metric-label">🦠 Удаляет</span>
                        <div className="checklist-items">
                            <span className={metrics.removes.bacteria ? 'check-ok' : 'check-no'}>
                                {metrics.removes.bacteria ? '✅' : '❌'} Бактерии
                            </span>
                            <span className={metrics.removes.protozoa ? 'check-ok' : 'check-no'}>
                                {metrics.removes.protozoa ? '✅' : '❌'} Простейшие
                            </span>
                            <span className={metrics.removes.turbidity ? 'check-ok' : 'check-no'}>
                                {metrics.removes.turbidity ? '✅' : '❌'} Мутность
                            </span>
                            <span className="check-no">
                                ❌ Химия (нужен уголь)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
