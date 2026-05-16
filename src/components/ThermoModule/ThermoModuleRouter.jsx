import React, { useState, useEffect } from 'react';
import Level1_Equilibrium from './Level1_Equilibrium/Level1_Equilibrium';
import Level2_Kitchen from './Level2_Kitchen/Level2_Kitchen';
import Level3_Pipeline from './Level3_Pipeline/Level3_Pipeline';
import { useThermoStore } from './_core/useThermoStore';
import { thermoXRStore } from './_core/thermoXRStore';
import ThermoErrorBoundary from './_core/ThermoErrorBoundary';
import './ThermoModule.css';

/**
 * ThermoModuleRouter — three Olympiad-grade thermodynamics levels.
 * Switching levels resets the shared store; physics state is never stale.
 */
export default function ThermoModuleRouter() {
    const [activeLevel, setActiveLevel] = useState(1);
    const loadLevel = useThermoStore(s => s.loadLevel);
    const currentStoreLevel = useThermoStore(s => s.level);

    useEffect(() => {
        if (currentStoreLevel !== activeLevel) loadLevel(activeLevel);
    }, [activeLevel, currentStoreLevel, loadLevel]);

    const handleSwitch = (lvl) => {
        if (lvl === activeLevel) return;
        setActiveLevel(lvl);
        loadLevel(lvl);
    };

    return (
        <div className="thermo-router">
            <div className="thermo-sub-tabs">
                <button
                    className={`thermo-tab-btn ${activeLevel === 1 ? 'active' : ''}`}
                    onClick={() => handleSwitch(1)}
                >
                    🌡️ <span>Уровень 1</span>
                    <small>Равновесие</small>
                </button>
                <button
                    className={`thermo-tab-btn ${activeLevel === 2 ? 'active' : ''}`}
                    onClick={() => handleSwitch(2)}
                >
                    ♨️ <span>Уровень 2</span>
                    <small>Чайник</small>
                </button>
                <button
                    className={`thermo-tab-btn ${activeLevel === 3 ? 'active' : ''}`}
                    onClick={() => handleSwitch(3)}
                >
                    🌊 <span>Уровень 3</span>
                    <small>Поток</small>
                </button>

                <ThermoXRLauncher />
            </div>

            <div className="thermo-level-container">
                <ThermoErrorBoundary>
                    {activeLevel === 1 && <Level1_Equilibrium />}
                    {activeLevel === 2 && <Level2_Kitchen />}
                    {activeLevel === 3 && <Level3_Pipeline />}
                </ThermoErrorBoundary>
            </div>
        </div>
    );
}

function ThermoXRLauncher() {
    const [status, setStatus] = useState('');
    const [busyMode, setBusyMode] = useState(null);

    const enter = async (mode) => {
        setStatus('');
        setBusyMode(mode);
        try {
            if (mode === 'vr') await thermoXRStore.enterVR();
            else await thermoXRStore.enterAR();
        } catch {
            setStatus('WebXR недоступен в этом браузере или устройстве.');
        } finally {
            setBusyMode(null);
        }
    };

    return (
        <div className="thermo-xr-launcher">
            <button
                className="thermo-xr-btn"
                onClick={() => enter('vr')}
                disabled={busyMode !== null}
                title="Открыть сцену в VR-шлеме"
            >
                🥽 VR
            </button>
            <button
                className="thermo-xr-btn"
                onClick={() => enter('ar')}
                disabled={busyMode !== null}
                title="Открыть сцену в AR, если устройство поддерживает WebXR"
            >
                📱 AR
            </button>
            {status && <span className="thermo-xr-status">{status}</span>}
        </div>
    );
}
