import React, { useState } from 'react';
import SectionManager from './Grade7/Section1/SectionManager';
import { useLocale } from '../../i18n/LocalizationContext';
import './PhysicsRouter.css';

export default function PhysicsRouter() {
  const { t } = useLocale();
  const [grade, setGrade] = useState(null);
  const [section, setSection] = useState(null);

  if (grade === 7 && section === 1) {
    return <SectionManager onBack={() => setSection(null)} />;
  }

  return (
    <div className="physics-router">
      <div className="physics-router-header">
        <span className="physics-eyebrow">{t('Physics curriculum')}</span>
        <h1>NovaLab Academy</h1>
      </div>
      {!grade ? (
        <div className="physics-grade-grid">
          <button className="physics-grade-card" onClick={() => setGrade(7)}>
            <span className="grade-index">{t('Grade')}</span>
            <h2>{t('7 КЛАСС')}</h2>
            <p>{t('Введение, Движение, Давление')}</p>
          </button>
        </div>
      ) : (
        <div className="physics-section-picker">
           <button className="physics-back-btn" onClick={() => setGrade(null)}>← {t('К выбору класса')}</button>
           <h2>{t('7 КЛАСС: РАЗДЕЛ 1')}</h2>
           <button
             className="physics-section-card"
             onClick={() => setSection(1)}
           >
             {t('Введение в физику (9 уроков)')}
           </button>
        </div>
      )}
    </div>
  );
}
