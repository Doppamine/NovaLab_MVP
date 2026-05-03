import React, { useState } from 'react';
import CrashTestLab from './CrashTestLab/CrashTestLab';
import StuntJumpLab from './StuntJumpLab/StuntJumpLab';
import LegacyCarPhysicsLab from './LegacyCarPhysicsLab';
import '../Car3DConstructor/CarPhysicsLab.css';

export default function CarPhysicsLab({ onCarLaunch }) {
  const [activeTab, setActiveTab] = useState('crashTest');

  return (
    <div className="car-physics-hub" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="car-lab-topbar">
        <div>
          <p className="eyebrow">NovaLab Hub</p>
          <h2>Car Physics Testing</h2>
        </div>
      </header>

      <nav className="car-lab-tabs" aria-label="Car physics modules">
        <button
          type="button"
          className={`lab-tab ${activeTab === 'crashTest' ? 'active' : ''}`}
          onClick={() => setActiveTab('crashTest')}
        >
          <span>Crash Test (Crumple Zone)</span>
        </button>
        <button
          type="button"
          className={`lab-tab ${activeTab === 'stuntJump' ? 'active' : ''}`}
          onClick={() => setActiveTab('stuntJump')}
        >
          <span>Stunt Jump (Energy Conservation)</span>
        </button>
        <button
          type="button"
          className={`lab-tab ${activeTab === 'legacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('legacy')}
        >
          <span>Legacy Modules</span>
        </button>
      </nav>

      <div className="car-physics-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'crashTest' && <CrashTestLab onCarLaunch={onCarLaunch} />}
        {activeTab === 'stuntJump' && <StuntJumpLab onCarLaunch={onCarLaunch} />}
        {activeTab === 'legacy' && <LegacyCarPhysicsLab onCarLaunch={onCarLaunch} />}
      </div>
    </div>
  );
}
