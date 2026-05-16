const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace 1: Add imports
content = content.replace(
  "import { getModules } from './services/moduleService';",
  "import { getModules } from './services/moduleService';\nimport { initGA, trackPageView, trackEvent } from './services/analyticsService';"
);

// Replace 2: Add useEffect
content = content.replace(
  "  useEffect(() => {\n    let isMounted = true;",
  "  useEffect(() => {\n    initGA();\n  }, []);\n\n  useEffect(() => {\n    let path = `/${view}`;\n    if (view === 'module' && activeModuleId) {\n      path = `/module/${activeModuleId}`;\n    } else if (showPhysicsLab) {\n      path = '/module/apollo-15';\n    } else if (showAetherLab) {\n      path = '/module/aether-vr';\n    } else if (showCarDemo) {\n      path = '/demo/car-3d';\n    }\n    trackPageView(path);\n  }, [view, activeModuleId, showPhysicsLab, showAetherLab, showCarDemo]);\n\n  useEffect(() => {\n    let isMounted = true;"
);

// Write back
fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated successfully.');
