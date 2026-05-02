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

const AVAILABLE_PARTS = [
    { id: 'bucket', name: 'Filter body', icon: '🪣', desc: 'Main container', baseCost: 8, purification: 0 },
    { id: 'gravelCoarse', name: 'Coarse gravel', icon: '🪨', desc: 'Drainage layer', baseCost: 2, purification: 5 },
    { id: 'gravelFine', name: 'Fine gravel', icon: '🪨', desc: 'Pre-filter layer', baseCost: 2, purification: 10 },
    { id: 'sandCoarse', name: 'Coarse sand', icon: '🏖️', desc: 'Transition layer', baseCost: 2, purification: 15 },
    { id: 'sandFine', name: 'Fine sand', icon: '🏖️', desc: 'Main filter layer', baseCost: 3, purification: 40 },
    { id: 'diffuser', name: 'Diffuser', icon: '🔲', desc: 'Protects the bio-layer', baseCost: 3, purification: 0 },
    { id: 'outlet', name: 'Outlet tube', icon: '🚰', desc: 'Clean water exit', baseCost: 2, purification: 0 },
];

const FILTER_LAYERS = ['gravelCoarse', 'gravelFine', 'sandCoarse', 'sandFine'];

export default function WaterFilterModule({ showDetails = true }) {
    const [assembledParts, setAssembledParts] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);
    const [userMessage, setUserMessage] = useState('Select the filter body, outlet tube, and at least one filter layer. Then start filtering.');

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

    const handleAssemble = (partId) => {
        if (!assembledParts.includes(partId)) {
            setAssembledParts([...assembledParts, partId]);
            setUserMessage(`${getWaterPartName(AVAILABLE_PARTS, partId)} added to the filter.`);
            playAssembleClick();
        }
    };

    const handleRemove = (partId) => {
        setAssembledParts(assembledParts.filter(id => id !== partId));
        setIsFiltering(false);
        stopFilterDrip();
        setUserMessage(`${getWaterPartName(AVAILABLE_PARTS, partId)} removed. Rebuild the filter before testing.`);
        playRemoveClick();
    };

    const resetFilter = () => {
        setAssembledParts([]);
        setIsFiltering(false);
        stopFilterDrip();
        setMetrics({
            purification: 0,
            flowRate: 0,
            peopleServed: 0,
            error: null,
            removes: { bacteria: false, protozoa: false, turbidity: false, chemicals: false },
        });
        setUserMessage('Filter workspace reset. Build a new filter and test the result.');
    };

    const toggleFiltering = () => {
        const hasBucket = assembledParts.includes('bucket');
        const hasOutlet = assembledParts.includes('outlet');
        const hasLayers = FILTER_LAYERS.some(l => assembledParts.includes(l));

        if (!isFiltering && !(hasBucket && hasOutlet && hasLayers)) {
            const missing = [
                !hasBucket ? 'filter body' : '',
                !hasOutlet ? 'outlet tube' : '',
                !hasLayers ? 'at least one filter layer' : '',
            ].filter(Boolean).join(', ');
            const message = `Required components are missing: ${missing}.`;
            setMetrics(m => ({ ...m, error: message }));
            setUserMessage(message);
            playError();
            return;
        }

        if (!isFiltering) {
            setMetrics(m => ({ ...m, error: null }));
            setIsFiltering(true);
            setUserMessage('Filtering started. Watch purification, flow rate, and removed contaminants.');
            playWaterPour();
            startFilterDrip();
        } else {
            setIsFiltering(false);
            setUserMessage('Filtering paused. Add or remove layers, then test again.');
            stopFilterDrip();
        }
    };

    useEffect(() => {
        if (isFiltering) {
            let purification = 0;
            let layerCount = 0;
            FILTER_LAYERS.forEach(layerId => {
                if (assembledParts.includes(layerId)) {
                    const part = AVAILABLE_PARTS.find(p => p.id === layerId);
                    purification += part.purification;
                    layerCount++;
                }
            });

            if (assembledParts.includes('diffuser')) {
                purification += 3;
            }

            purification = Math.min(purification, 98);

            const flowRate = Math.max(2, 12 - layerCount * 2.5);

            const dailyLiters = flowRate * 8;
            const peopleServed = Math.floor(dailyLiters / 20);

            const hasSandFine = assembledParts.includes('sandFine');
            const hasSandCoarse = assembledParts.includes('sandCoarse');
            const hasGravelFine = assembledParts.includes('gravelFine');

            setMetrics({
                purification,
                flowRate: flowRate.toFixed(1),
                peopleServed,
                error: null,
                removes: {
                    bacteria: hasSandFine,
                    protozoa: hasSandFine || hasSandCoarse,
                    turbidity: hasGravelFine || hasSandCoarse,
                    chemicals: false,
                },
            });
            setUserMessage(purification >= 50
                ? 'The filter is working. Purification improves as more layers are added.'
                : 'The filter runs, but purification is limited. Add sand or gravel layers to improve the result.');
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
        <div className={`water-module-container ${showDetails ? '' : 'details-hidden'}`}>
            {showDetails ? (
            <div className="panel left-panel">
                <h2>Filter components</h2>
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
                                            Installed
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
            ) : null}

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
                    <div className="water-user-feedback" role="status">{userMessage}</div>
                    <button
                        className={`sim-btn ${isFiltering ? 'stop' : 'start'}`}
                        onClick={toggleFiltering}
                    >
                        {isFiltering ? 'Stop filtering' : 'Start filter test'}
                    </button>
                    <button className="sim-btn reset" onClick={resetFilter}>
                        Reset
                    </button>
                </div>
            </div>

            {showDetails ? (
            <div className="panel right-panel">
                <h2>Results</h2>
                <div className="metrics-dashboard">
                    <div className="metric-box highlight">
                        <span className="metric-label">Build cost</span>
                        <span className="metric-value green"><AnimatedCounter value={buildCost} prefix="$" /></span>
                    </div>
                    <div className="metric-box highlight">
                        <span className="metric-label">Purification</span>
                        <span className={`metric-value ${metrics.purification > 70 ? 'green' : metrics.purification > 30 ? 'orange' : 'red'}`}>
                            <AnimatedCounter value={metrics.purification} suffix="%" />
                        </span>
                    </div>
                    <div className="metric-box">
                        <span className="metric-label">Flow rate</span>
                        <span className="metric-value blue"><AnimatedCounter value={metrics.flowRate} suffix=" L/hour" /></span>
                    </div>
                    <div className="metric-box highlight">
                        <span className="metric-label">People served</span>
                        <span className="metric-value blue"><AnimatedCounter value={metrics.peopleServed} suffix=" people/day" /></span>
                        {metrics.peopleServed > 0 && (
                            <span className="metric-sub">${costPerPerson} / person / day</span>
                        )}
                    </div>

                    <div className="metric-box filter-checklist">
                        <span className="metric-label">Removes</span>
                        <div className="checklist-items">
                            <span className={metrics.removes.bacteria ? 'check-ok' : 'check-no'}>
                                {metrics.removes.bacteria ? 'Yes' : 'No'} bacteria
                            </span>
                            <span className={metrics.removes.protozoa ? 'check-ok' : 'check-no'}>
                                {metrics.removes.protozoa ? 'Yes' : 'No'} protozoa
                            </span>
                            <span className={metrics.removes.turbidity ? 'check-ok' : 'check-no'}>
                                {metrics.removes.turbidity ? 'Yes' : 'No'} turbidity
                            </span>
                            <span className="check-no">
                                No chemicals without carbon
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            ) : null}
        </div>
    );
}

function getWaterPartName(parts, partId) {
    return parts.find(part => part.id === partId)?.name || 'Component';
}
