import React, { useState } from 'react';
import WaterPumpModule from './Pump/WaterPumpModule';
import WaterFilterModule from './Filter/WaterFilterModule';
import './WaterModule.css';

export default function WaterModuleRouter() {
    const [activeTab, setActiveTab] = useState('pump');

    return (
        <div className="water-router">
            <div className="water-sub-tabs">
                <button
                    className={`water-tab-btn ${activeTab === 'pump' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pump')}
                >
                    ⛽ Насос
                </button>
                <button
                    className={`water-tab-btn ${activeTab === 'filter' ? 'active' : ''}`}
                    onClick={() => setActiveTab('filter')}
                >
                    🧪 Фильтр
                </button>
            </div>
            {activeTab === 'pump' ? <WaterPumpModule /> : <WaterFilterModule />}
        </div>
    );
}
