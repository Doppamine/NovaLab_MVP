import React, { useState } from 'react';
import CrashTestLab from './CrashTestLab/CrashTestLab';
import StuntJumpLab from './StuntJumpLab/StuntJumpLab';
import DragRaceLab from './DragRaceLab/DragRaceLab';
import LegacyCarPhysicsLab from './LegacyCarPhysicsLab';
import { useLocale } from '../../i18n/LocalizationContext';
import '../Car3DConstructor/CarPhysicsLab.css';

export default function CarPhysicsLab({ onExit }) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('crashTest');

  return (
    <div className="car-physics-hub" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="car-lab-topbar">
        <div>
          <p className="eyebrow">{t('NovaLab Hub')}</p>
          <h2>{t('Car Physics Testing')}</h2>
        </div>
      </header>

      <nav className="car-lab-tabs" aria-label={t('Car physics modules')}>
        <button
          type="button"
          className={`lab-tab ${activeTab === 'crashTest' ? 'active' : ''}`}
          onClick={() => setActiveTab('crashTest')}
        >
          <span>{t('Crash Test (Crumple Zone)')}</span>
        </button>
        <button
          type="button"
          className={`lab-tab ${activeTab === 'stuntJump' ? 'active' : ''}`}
          onClick={() => setActiveTab('stuntJump')}
        >
          <span>{t('Stunt Jump (Energy Conservation)')}</span>
        </button>
        <button
          type="button"
          className={`lab-tab ${activeTab === 'dragRace' ? 'active' : ''}`}
          onClick={() => setActiveTab('dragRace')}
        >
          <span>{t("Drag Race (Newton's 2nd Law)")}</span>
        </button>
      </nav>

      <div className="car-physics-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'crashTest' && <CrashTestLab onExit={onExit} />}
        {activeTab === 'stuntJump' && <StuntJumpLab onExit={onExit} />}
        {activeTab === 'dragRace' && <DragRaceLab onExit={onExit} />}
        {activeTab === 'legacy' && <LegacyCarPhysicsLab onExit={onExit} />}
      </div>
    </div>
  );
}
