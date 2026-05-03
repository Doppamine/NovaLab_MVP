import React from 'react';
import { useLocale } from '../../../i18n/LocalizationContext';

export default function SimulationCatalog({ simulations, onSelect }) {
  const { t } = useLocale();

  return (
    <div className="physics-lab lab-mode-blueprint">
      <div className="lab-container">
        <header className="lab-header">
          <div className="lab-title">
            <span className="eyebrow">{t('NovaLab - Physics Catalog')}</span>
            <h1 style={{ fontSize: '1.7rem' }}>{t('Simulation catalog')}</h1>
          </div>
        </header>

        <section className="catalog-hero card">
          <div className="eyebrow">{t('Teacher-ready demos')}</div>
          <h2 style={{ marginTop: 10, marginBottom: 14 }}>{t('Choose an experiment students can observe.')}</h2>
          <p style={{ maxWidth: 760, lineHeight: 1.65, fontSize: '1rem' }}>
            {t('PhysicsLab presents the existing simulation stands in a clear pilot format. Open a demo, adjust the setup, run the simulation, and use the result to connect observation with physics vocabulary.')}
          </p>
        </section>

        <div className="catalog-grid">
          {simulations.map((simulation) => (
            <article
              key={simulation.id}
              className={`catalog-card catalog-card-${simulation.theme}`}
            >
              <div className="catalog-card-head">
                <span className="catalog-pill">{simulation.kicker}</span>
                <span className="catalog-status">{simulation.status}</span>
              </div>

              <div className="catalog-card-body">
                <h2>{simulation.title}</h2>
                <p className="catalog-description">{simulation.description}</p>
                <div className="catalog-highlights">
                  {simulation.highlights.map((item) => (
                    <span key={item} className="catalog-highlight">{item}</span>
                  ))}
                </div>
              </div>

              <div className="catalog-card-footer">
                <button className="btn btn-primary-gold" onClick={() => onSelect(simulation.id)}>
                  {simulation.cta}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
