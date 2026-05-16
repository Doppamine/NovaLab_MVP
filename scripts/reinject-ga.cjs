const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Find the line "  const navItems = useMemo(() => [" and insert GA initialization right before it.
if (!content.includes('initGA();')) {
  const target = '  const navItems = useMemo(() => [';
  const insertion = `  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    let path = \`/\${view}\`;
    if (view === 'module' && activeModuleId) {
      path = \`/module/\${activeModuleId}\`;
    } else if (showPhysicsLab) {
      path = '/module/apollo-15';
    } else if (showAetherLab) {
      path = '/module/aether-vr';
    } else if (showCarDemo) {
      path = '/demo/car-3d';
    }
    trackPageView(path);
  }, [view, activeModuleId, showPhysicsLab, showAetherLab, showCarDemo]);

`;
  
  if (content.includes(target)) {
    content = content.replace(target, insertion + target);
    fs.writeFileSync('src/App.jsx', content);
    console.log('Successfully injected GA tracking logic into App.jsx');
  } else {
    console.error('Could not find the target line to inject GA tracking logic.');
  }
} else {
  console.log('GA tracking logic already exists in App.jsx');
}
