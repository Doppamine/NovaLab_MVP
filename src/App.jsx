import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import Header from './components/Constructor/Header';
import ProductErrorBoundary from './components/common/ProductErrorBoundary';
import { getModules } from './services/moduleService';
import './App.css';

const PartsPanel = lazy(() => import('./components/PartsPanel/PartsPanel'));
const WorkArea = lazy(() => import('./components/WorkArea/WorkArea'));
const CarDemo3D = lazy(() => import('./components/CarDemo3D/CarDemo3D'));
const Car3DConstructor = lazy(() => import('./components/Car3DConstructor/Car3DConstructor'));
const RocketConstructor = lazy(() => import('./components/RocketConstructor/RocketConstructor'));
const CarVRConstructor = lazy(() => import('./features/car-vr-constructor/CarVRConstructor'));
const WaterModuleRouter = lazy(() => import('./components/WaterModule/WaterModuleRouter'));
const ThermoModuleRouter = lazy(() => import('./components/ThermoModule/ThermoModuleRouter'));
const PhysicsRouter = lazy(() => import('./components/PhysicsModule/PhysicsRouter'));
const PhysicsLab = lazy(() => import('./components/PhysicsLab/PhysicsLab'));
const AetherLabModule = lazy(() => import('./components/AetherLab/AetherLabModule'));
const WildfireVRModule = lazy(() => import('./features/wildfire-vr-superflight/WildfireVRModule'));

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'modules', label: 'Modules' },
  { id: 'demo', label: 'Demo' },
  { id: 'teachers', label: 'For Teachers' },
  { id: 'about', label: 'About' },
];

function App() {
  const [modules, setModules] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [modulesError, setModulesError] = useState('');
  const [view, setView] = useState('home');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [moduleSessionKey, setModuleSessionKey] = useState(0);
  const [showCarDemo, setShowCarDemo] = useState(false);
  const [carDemoAssembly, setCarDemoAssembly] = useState(null);
  const [showPhysicsLab, setShowPhysicsLab] = useState(false);
  const [showAetherLab, setShowAetherLab] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('novalab-theme') || 'dark');

  useEffect(() => {
    let isMounted = true;

    async function loadModules() {
      setIsLoadingModules(true);
      setModulesError('');

      try {
        const response = await getModules();

        if (!isMounted) return;

        if (!response.success) {
          setModulesError(response.message || 'Data is temporarily unavailable.');
          setModules([]);
          return;
        }

        setModules(response.data);
      } catch {
        if (isMounted) {
          setModulesError('Data is temporarily unavailable. Please refresh the page.');
          setModules([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingModules(false);
        }
      }
    }

    loadModules();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('novalab-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => setFeedback(''), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const activeModule = useMemo(
    () => modules.find((module) => module.id === activeModuleId) || null,
    [activeModuleId, modules],
  );

  const openModule = (moduleId) => {
    setFeedback('');

    if (moduleId === 'apollo-15') {
      setShowPhysicsLab(true);
      return;
    }

    if (moduleId === 'aether-vr') {
      setShowAetherLab(true);
      return;
    }

    setIsVRMode(false);
    setShowInstructions(true);
    setShowDetails(true);
    setActiveModuleId(moduleId);
    setModuleSessionKey((key) => key + 1);
    setView('module');
  };

  const openModules = () => {
    setActiveModuleId(null);
    setView('modules');
  };

  const openDemo = () => {
    openModule('circuits-2d');
  };

  const handleNavigation = (targetView) => {
    if (targetView === 'demo') {
      openDemo();
      return;
    }

    setFeedback('');
    setActiveModuleId(null);
    setView(targetView);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleCarLaunch = (assembly = null) => {
    const cleanAssembly = assembly?.source ? assembly : null;
    setCarDemoAssembly(cleanAssembly);
    setShowCarDemo(true);
  };

  const handleCarDemoComplete = () => {
    setShowCarDemo(false);
    setCarDemoAssembly(null);
  };

  const resetActiveModule = () => {
    setFeedback('Module reset. You can try the activity again from the beginning.');
    setModuleSessionKey((key) => key + 1);
  };

  const toggleInstructions = () => {
    setShowInstructions((current) => {
      const next = !current;
      setFeedback(next ? 'Instructions shown.' : 'Instructions hidden. You can open them again anytime.');
      return next;
    });
  };

  const toggleDetails = () => {
    setShowDetails((current) => {
      const next = !current;
      setFeedback(next ? 'Components panel shown.' : 'Components panel hidden. Workspace expanded.');
      return next;
    });
  };

  const renderActiveModule = () => {
    if (!activeModule) {
      return (
        <div className="product-empty-state">
          <span className="status-pill status-pill-warning">Module unavailable</span>
          <h2>The module could not be loaded.</h2>
          <p>Please return to the module list and choose another activity.</p>
          <button className="btn btn-primary" onClick={openModules}>Back to modules</button>
        </div>
      );
    }

    const activeModuleKey = String(activeModule.id || '').trim().toLowerCase();

    switch (activeModuleKey) {
      case 'circuits-2d':
        return (
          <div className={`main-layout module-main-layout ${showDetails ? '' : 'details-hidden'}`}>
            {showDetails ? <PartsPanel /> : null}
            <WorkArea onCarLaunch={handleCarLaunch} />
          </div>
        );
      case 'car-3d':
        return isVRMode ? (
          <CarVRConstructor onCarLaunch={handleCarLaunch} />
        ) : (
          <Car3DConstructor onCarLaunch={handleCarLaunch} showComponents={showDetails} />
        );
      case 'car-vr-constructor':
      case 'car-vr':
      case 'car-vr-lab':
      case 'vr-car-constructor':
      case 'vr-vehicle-constructor':
        return <CarVRConstructor onCarLaunch={handleCarLaunch} />;
      case 'rocket-assembly':
        return (
          <RocketConstructor
            onLaunch={() => setFeedback('Rocket launch is marked pilot mode. The assembly path is ready for a guided classroom demo.')}
          />
        );
      case 'water-systems':
        return <WaterModuleRouter showDetails={showDetails} />;
      case 'thermal-lab':
        return <ThermoModuleRouter />;
      case 'grade7-physics':
        return <PhysicsRouter />;
      case 'wildfire-vr':
        return <WildfireVRModule />;
      default:
        return (
          <div className="product-empty-state">
            <span className="status-pill status-pill-warning">In development</span>
            <h2>This module is not ready yet.</h2>
            <p>It is listed for the pilot roadmap and will open when the demo version is available.</p>
            <button className="btn btn-primary" onClick={openModules}>Back to modules</button>
          </div>
        );
    }
  };

  if (showPhysicsLab) {
    return (
      <FullScreenLab onClose={() => setShowPhysicsLab(false)} closeLabel="Exit Apollo lab">
        <Suspense fallback={<FullScreenModuleLoading label="Preparing Apollo 15 lab..." />}>
          <PhysicsLab />
        </Suspense>
      </FullScreenLab>
    );
  }

  if (showAetherLab) {
    return (
      <FullScreenLab onClose={() => setShowAetherLab(false)} closeLabel="Exit XR lab" flush>
        <Suspense fallback={<FullScreenModuleLoading label="Preparing Aether circuit lab..." />}>
          <AetherLabModule onClose={() => setShowAetherLab(false)} />
        </Suspense>
      </FullScreenLab>
    );
  }

  if (showCarDemo) {
    return (
      <Suspense fallback={<FullScreenModuleLoading label="Preparing drive physics..." />}>
        <CarDemo3D onComplete={handleCarDemoComplete} assembly={carDemoAssembly} />
      </Suspense>
    );
  }

  return (
    <div className="app">
      <Header>
        <ProductNav
          activeView={activeModule ? 'demo' : view}
          items={navItems}
          moduleCount={modules.length}
          onNavigate={handleNavigation}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      </Header>

      <main className={`main-content ${activeModule ? 'main-content-module' : ''}`}>
        {view === 'home' && (
          <HomePage
            modules={modules}
            isLoading={isLoadingModules}
            error={modulesError}
            onOpenModule={openModule}
            onOpenModules={openModules}
            onViewDemo={openDemo}
          />
        )}

        {view === 'modules' && (
          <ModulesPage
            modules={modules}
            isLoading={isLoadingModules}
            error={modulesError}
            onOpenModule={openModule}
            onRetry={() => window.location.reload()}
          />
        )}

        {view === 'teachers' && <TeachersPage onOpenModules={openModules} />}
        {view === 'about' && <AboutPage onOpenModules={openModules} />}

        {view === 'module' && (
          <ModuleWorkspace
            module={activeModule}
            feedback={feedback}
            isVRMode={isVRMode}
            showInstructions={showInstructions}
            showDetails={showDetails}
            onBack={openModules}
            onReset={resetActiveModule}
            onToggleCarVR={() => setIsVRMode((value) => !value)}
            onToggleInstructions={toggleInstructions}
            onToggleDetails={toggleDetails}
          >
            <ProductErrorBoundary
              key={`error-${activeModuleId}-${moduleSessionKey}`}
              onBack={openModules}
              onRetry={resetActiveModule}
            >
              <Suspense fallback={<ModuleLoading module={activeModule} />}>
                <div key={`${activeModuleId}-${moduleSessionKey}`} className="module-runtime">
                  {renderActiveModule()}
                </div>
              </Suspense>
            </ProductErrorBoundary>
          </ModuleWorkspace>
        )}
      </main>
    </div>
  );
}

function ProductNav({ activeView, items, moduleCount, onNavigate, onToggleTheme, theme }) {
  return (
    <nav className="product-nav" aria-label="Main navigation">
      <div className="product-nav-links">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {item.label}
            {item.id === 'modules' && moduleCount > 0 ? <span>{moduleCount}</span> : null}
          </button>
        ))}
      </div>
      <button
        className="nav-btn theme-toggle"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
        aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
        type="button"
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </nav>
  );
}

function HomePage({ modules, isLoading, error, onOpenModule, onOpenModules, onViewDemo }) {
  const featuredModules = modules.slice(0, 4);

  return (
    <div className="product-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="section-eyebrow">NovaLab MVP - School pilot</span>
          <h1>Physics becomes clear when students can see it.</h1>
          <p>
            NovaLab is an interactive platform that helps students understand physics through
            visualization, simulations, and practical tasks.
          </p>
          <p className="hero-support">
            Instead of only reading theory, students can build, test, observe, and understand how
            physics works in practice.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOpenModules}>Open modules</button>
            <button className="btn btn-secondary" onClick={onViewDemo}>View demo</button>
          </div>
        </div>

        <div className="lab-preview" aria-label="NovaLab simulation preview">
          <div className="preview-toolbar">
            <span>Live physics bench</span>
            <strong>Pilot mode</strong>
          </div>
          <div className="preview-canvas">
            <div className="preview-node preview-battery">Battery</div>
            <div className="preview-wire wire-one"></div>
            <div className="preview-node preview-lamp">Lamp</div>
            <div className="preview-wire wire-two"></div>
            <div className="preview-node preview-motor">Motor</div>
          </div>
          <div className="preview-result">
            <span className="status-dot"></span>
            Circuit feedback: closed systems create visible results.
          </div>
        </div>
      </section>

      <section className="product-section">
        <SectionHeader
          eyebrow="Available modules"
          title="Ready-to-show activities"
          copy="Existing NovaLab modules are organized as classroom-friendly pilot activities."
        />
        <ModuleGrid
          modules={featuredModules}
          isLoading={isLoading}
          error={error}
          onOpenModule={onOpenModule}
        />
      </section>

      <ValueSection />
      <PilotSection />
    </div>
  );
}

function ModulesPage({ modules, isLoading, error, onOpenModule, onRetry }) {
  return (
    <div className="product-page product-page-compact">
      <section className="product-section">
        <SectionHeader
          eyebrow="Modules"
          title="Choose a physics activity"
          copy="Each module shows the learning goal, readiness status, and how students should use it."
        />
        <ModuleGrid
          modules={modules}
          isLoading={isLoading}
          error={error}
          onOpenModule={onOpenModule}
          onRetry={onRetry}
        />
      </section>
    </div>
  );
}

function ModuleGrid({ modules, isLoading, error, onOpenModule, onRetry }) {
  if (isLoading) {
    return (
      <div className="modules-grid" aria-label="Loading modules">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="module-card skeleton-card">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line title"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-empty-state">
        <span className="status-pill status-pill-warning">Data unavailable</span>
        <h2>Modules could not be loaded.</h2>
        <p>{error}</p>
        {onRetry ? <button className="btn btn-primary" onClick={onRetry}>Try again</button> : null}
      </div>
    );
  }

  if (!modules.length) {
    return (
      <div className="product-empty-state">
        <span className="status-pill">Pilot catalog</span>
        <h2>No modules are available yet.</h2>
        <p>Please check back later. The pilot catalog will appear here when data is ready.</p>
      </div>
    );
  }

  return (
    <div className="modules-grid">
      {modules.map((module) => (
        <article key={module.id} className="module-card">
          <div className="card-topline">
            <span>{module.category}</span>
            <StatusPill status={module.status} />
          </div>
          <h3>{module.title}</h3>
          <p>{module.description}</p>
          <div className="module-meta">
            <span>{module.grade}</span>
            <span>{module.level}</span>
          </div>
          <div className="module-goal">
            <strong>Learning goal</strong>
            <span>{module.learningGoal}</span>
          </div>
          <button className="btn btn-primary module-card-action" onClick={() => onOpenModule(module.id)}>
            {module.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}

function ModuleWorkspace({
  module,
  children,
  feedback,
  isVRMode,
  showInstructions,
  showDetails,
  onBack,
  onReset,
  onToggleCarVR,
  onToggleInstructions,
  onToggleDetails,
}) {
  if (!module) {
    return (
      <div className="module-workspace">
        <div className="product-empty-state">
          <h2>The module could not be loaded.</h2>
          <p>Please return to the module list and choose another activity.</p>
          <button className="btn btn-primary" onClick={onBack}>Back to modules</button>
        </div>
      </div>
    );
  }

  const hasDetailsPanel = ['circuits-2d', 'car-3d', 'water-systems'].includes(module.id);

  return (
    <div className={`module-workspace ${showInstructions ? '' : 'instructions-hidden'} ${showDetails ? '' : 'details-hidden'}`}>
      {showInstructions ? (
        <aside className="module-context-panel">
          <div className="context-panel-top">
            <button className="back-link" onClick={onBack}>Back to modules</button>
            <button className="panel-hide-btn" onClick={onToggleInstructions}>Hide instructions</button>
          </div>

          <div>
            <span className="section-eyebrow">{module.category}</span>
            <h1>{module.title}</h1>
            <StatusPill status={module.status} />
          </div>
          <p>{module.description}</p>

          <div className="context-block">
            <strong>Goal</strong>
            <span>{module.learningGoal}</span>
          </div>

          <div className="context-block">
            <strong>Teacher use</strong>
            <span>{module.teacherUse}</span>
          </div>

          <div className="context-block">
            <strong>What to do</strong>
            <ol>
              {module.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
          </div>

          {feedback ? <div className="module-feedback">{feedback}</div> : null}

          <div className="module-actions">
            {module.id === 'car-3d' ? (
              <button className="btn btn-secondary" onClick={onToggleCarVR}>
                {isVRMode ? 'Use desktop 3D' : 'Try VR mode'}
              </button>
            ) : null}
            <button className="btn btn-secondary" onClick={onReset}>Reset module</button>
          </div>
        </aside>
      ) : null}

      <section className="module-stage" aria-label={`${module.title} activity`}>
        <div className="module-utility-bar">
          {!showInstructions ? (
            <button className="btn btn-secondary" onClick={onToggleInstructions}>Show instructions</button>
          ) : null}
          {hasDetailsPanel ? (
            <button className="btn btn-secondary" onClick={onToggleDetails}>
              {showDetails ? 'Hide components' : 'Show components'}
            </button>
          ) : null}
          {module.id === 'car-3d' ? (
            <button className="btn btn-secondary" onClick={onToggleCarVR}>
              {isVRMode ? 'Use desktop 3D' : 'Try VR mode'}
            </button>
          ) : null}
          {!showInstructions && feedback ? <div className="module-feedback compact">{feedback}</div> : null}
        </div>
        {children}
      </section>
    </div>
  );
}

function ValueSection() {
  const items = [
    {
      title: 'For students',
      copy: 'Understand physics through action, not only through text.',
    },
    {
      title: 'For teachers',
      copy: 'Explain difficult topics faster with visual and interactive tools.',
    },
    {
      title: 'For schools',
      copy: 'Test a modern STEM learning tool through a structured pilot launch.',
    },
  ];

  return (
    <section className="product-section">
      <SectionHeader
        eyebrow="Why it matters"
        title="Built for classroom explanation"
        copy="NovaLab turns abstract physics into something students can test, observe, and discuss."
      />
      <div className="value-grid">
        {items.map((item) => (
          <article key={item.title} className="value-card">
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PilotSection() {
  return (
    <section className="pilot-section">
      <div>
        <span className="section-eyebrow">Pilot readiness</span>
        <h2>Prepared for a serious school demo</h2>
      </div>
      <p>
        NovaLab is currently in MVP mode and is being prepared for pilot testing in schools.
        The goal of the pilot is to evaluate teacher usability, student engagement, and the
        impact of visualization on physics understanding.
      </p>
    </section>
  );
}

function TeachersPage({ onOpenModules }) {
  return (
    <div className="product-page product-page-compact">
      <section className="product-section teacher-section">
        <SectionHeader
          eyebrow="For Teachers"
          title="Use NovaLab as a visual lesson companion"
          copy="The pilot version is designed for short classroom demonstrations, guided student practice, and discussion after each experiment."
        />
        <div className="teacher-flow">
          <div>
            <strong>1. Introduce the concept</strong>
            <span>Start with the learning goal and a simple question students can test.</span>
          </div>
          <div>
            <strong>2. Run the activity</strong>
            <span>Students build, connect, adjust, or observe the simulation step by step.</span>
          </div>
          <div>
            <strong>3. Discuss the result</strong>
            <span>Use the visual feedback to connect actions with physics vocabulary.</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onOpenModules}>Open pilot modules</button>
      </section>
    </div>
  );
}

function AboutPage({ onOpenModules }) {
  return (
    <div className="product-page product-page-compact">
      <section className="product-section about-section">
        <SectionHeader
          eyebrow="About NovaLab"
          title="A physics platform for seeing, testing, and understanding"
          copy="NovaLab focuses on visualization, simulations, practical interaction, and teacher support. The current MVP is frontend-first with stable demo data and existing interactive modules prepared for pilot conversations."
        />
        <div className="readiness-list">
          <span>Clear school-pilot positioning</span>
          <span>Existing modules organized by learning goal</span>
          <span>Professional demo and pilot-mode labels</span>
          <span>Friendly loading, empty, and recovery states</span>
        </div>
        <button className="btn btn-primary" onClick={onOpenModules}>Review modules</button>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div className="section-header">
      <span className="section-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = status.toLowerCase().replaceAll(' ', '-');
  return <span className={`status-pill status-${normalized}`}>{status}</span>;
}

function ModuleLoading({ module }) {
  return (
    <div className="module-loading-state">
      <div className="loading-spinner"></div>
      <p>{module ? `Preparing ${module.title}...` : 'Preparing module...'}</p>
    </div>
  );
}

function FullScreenModuleLoading({ label }) {
  return (
    <div className="fullscreen-loading">
      <div className="loading-spinner"></div>
      <p>{label}</p>
    </div>
  );
}

function FullScreenLab({ children, closeLabel, onClose, flush = false }) {
  return (
    <div className={`fullscreen-lab ${flush ? 'fullscreen-lab-flush' : ''}`}>
      <button className="fullscreen-close" onClick={onClose}>{closeLabel}</button>
      {children}
    </div>
  );
}

export default App;
