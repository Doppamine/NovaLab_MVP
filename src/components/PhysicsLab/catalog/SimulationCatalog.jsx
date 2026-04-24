import React from 'react';

export default function SimulationCatalog({ simulations, onSelect }) {
  return (
    <div className="physics-lab lab-mode-blueprint">
      <div className="lab-container">
        <header className="lab-header">
          <div className="lab-title">
            <span className="eyebrow">NovaLab · Physics Catalog</span>
            <h1 style={{ fontSize: '1.7rem' }}>Каталог симуляций</h1>
          </div>
        </header>

        <section className="catalog-hero card">
          <div className="eyebrow">Новая категория</div>
          <h2 style={{ marginTop: 10, marginBottom: 14 }}>Выбирай стенд, а не просто урок</h2>
          <p style={{ maxWidth: 760, lineHeight: 1.65, fontSize: '1rem' }}>
            Здесь PhysicsLab становится полноценной витриной инженерных симуляций.
            Apollo 15 остаётся как эксперимент по механике, а рядом появляется новая
            лаборатория по горению. Дальше в эту же категорию можно будет добавлять
            маятник, ракетный стенд, теплопередачу и другие модули без переписывания текущих.
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
