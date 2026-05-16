import React, { useMemo, useState } from 'react';
import LessonOrchestrator from './LessonOrchestrator.jsx';
import BurningStickOrchestrator from './burning/BurningStickOrchestrator.jsx';
import SimulationCatalog from './catalog/SimulationCatalog.jsx';
import apolloScenario from '../../scenarios/apollo15_free_fall_v1.json';
import burningStickScenario from '../../scenarios/burning_stick_lab_v1.json';
import { useLocale } from '../../i18n/LocalizationContext';
import './PhysicsLab.css';

/**
 * PhysicsLab - root component for the simulation catalog.
 *
 * Usage:
 *   import PhysicsLab from './components/PhysicsLab/PhysicsLab.jsx';
 *   <PhysicsLab />
 */
export default function PhysicsLab() {
  const { localizeTree } = useLocale();
  const [activeSimulation, setActiveSimulation] = useState(null);

  const simulations = useMemo(() => ([
    {
      id: 'apollo15',
      kicker: 'Mechanics - RK4',
      status: 'Demo ready',
      theme: 'apollo',
      title: 'Apollo 15: Hammer and Feather',
      description: 'Compare the historic hammer and feather experiment with clear visual feedback for gravity and air resistance.',
      highlights: ['hammer vs feather', 'vacuum and atmosphere', 'trajectories and charts'],
      cta: 'Open Apollo 15',
    },
    {
      id: 'burning-stick',
      kicker: 'Combustion - RK4',
      status: 'Pilot demo',
      theme: 'burn',
      title: 'Burn Lab: Burning Stick',
      description: 'Observe how oxygen, moisture, airflow, material thickness, and ignition points affect a burning stick.',
      highlights: ['flame front', 'oxygen and moisture', 'material conditions'],
      cta: 'Open burn lab',
    },
  ]), []);

  const localizedSimulations = useMemo(() => localizeTree(simulations), [localizeTree, simulations]);
  const localizedApolloScenario = useMemo(() => localizeTree(apolloScenario), [localizeTree]);
  const localizedBurningScenario = useMemo(() => localizeTree(burningStickScenario), [localizeTree]);

  if (activeSimulation === 'apollo15') {
    return (
      <LessonOrchestrator
        key="apollo15"
        scenario={localizedApolloScenario}
        onBackToCatalog={() => setActiveSimulation(null)}
      />
    );
  }

  if (activeSimulation === 'burning-stick') {
    return (
      <BurningStickOrchestrator
        key="burning-stick"
        scenario={localizedBurningScenario}
        onBackToCatalog={() => setActiveSimulation(null)}
      />
    );
  }

  return (
    <SimulationCatalog
      simulations={localizedSimulations}
      onSelect={setActiveSimulation}
    />
  );
}
