import React, { useMemo, useState } from 'react';
import LessonOrchestrator from './LessonOrchestrator.jsx';
import BurningStickOrchestrator from './burning/BurningStickOrchestrator.jsx';
import SimulationCatalog from './catalog/SimulationCatalog.jsx';
import apolloScenario from '../../scenarios/apollo15_free_fall_v1.json';
import burningStickScenario from '../../scenarios/burning_stick_lab_v1.json';
import './PhysicsLab.css';

/**
 * PhysicsLab — корневой компонент модуля.
 *
 * Пока жёстко подхватывает сценарий apollo15. В M2 сюда прилетит
 * пропс `scenarioId` и список сценариев, чтобы учитель мог выбирать из каталога.
 *
 * Использование:
 *   import PhysicsLab from './components/PhysicsLab/PhysicsLab.jsx';
 *   <PhysicsLab />
 */
export default function PhysicsLab() {
  const [activeSimulation, setActiveSimulation] = useState(null);

  const simulations = useMemo(() => ([
    {
      id: 'apollo15',
      kicker: 'Механика · RK4',
      status: 'Готово',
      theme: 'apollo',
      title: apolloScenario.title,
      description: 'Исторический эксперимент Дэвида Скотта: молоток и перо, сопротивление воздуха, сравнение Земли и Луны.',
      highlights: ['молоток vs перо', 'вакуум и атмосфера', 'траектории и графики'],
      cta: 'Открыть Apollo 15',
    },
    {
      id: 'burning-stick',
      kicker: 'Горение · RK4',
      status: 'Новое',
      theme: 'burn',
      title: burningStickScenario.title,
      description: 'Новый стенд по горению: фронт пламени, влажность, кислород, обдув, толщина и поджиг с одного или двух концов.',
      highlights: ['фронт горения', 'кислород и влага', 'материалы и режимы'],
      cta: 'Зажечь стенд',
    },
  ]), []);

  if (activeSimulation === 'apollo15') {
    return (
      <LessonOrchestrator
        key="apollo15"
        scenario={apolloScenario}
        onBackToCatalog={() => setActiveSimulation(null)}
      />
    );
  }

  if (activeSimulation === 'burning-stick') {
    return (
      <BurningStickOrchestrator
        key="burning-stick"
        scenario={burningStickScenario}
        onBackToCatalog={() => setActiveSimulation(null)}
      />
    );
  }

  return (
    <SimulationCatalog
      simulations={simulations}
      onSelect={setActiveSimulation}
    />
  );
}
