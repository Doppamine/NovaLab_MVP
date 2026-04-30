import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import './CarPhysicsLab.css';
import {
  ALL_TASKS,
  BATTERY_TYPES,
  BODY_TYPES,
  DEFAULT_SELECTION,
  ENGINE_TYPES,
  G,
  LABS,
  LAB_TASKS,
  LIGHT_TYPES,
  ROAD_BIOMES,
  TIRE_TYPES
} from './data/carPhysicsData';
import {
  byId,
  calculateBatteryLoad,
  calculateBrakingDistance,
  calculateCarStats,
  calculateElectricalState,
  calculateLightState,
  calculateRelativeMotion,
  calculateSpeedParams,
  formatNumber,
  round,
  safeNumber,
  validateAnswer
} from './utils/carPhysicsCalculations';

const LAB_COPY = {
  constructor: {
    principle: 'Every selected part changes mass, force, grip, energy use, or electrical load.',
    conclusion: 'The car is a single system: changing one part changes the physics of the whole object.'
  },
  speed: {
    principle: 'Speed shows how much distance the car covers in one unit of time.',
    conclusion: 'For the same distance, more time means lower speed; for the same time, more speed means more distance.'
  },
  acceleration: {
    principle: 'Newton second law connects force, mass, and acceleration.',
    conclusion: 'With the same engine force, a heavier car accelerates more slowly.'
  },
  twoCar: {
    principle: 'Relative speed tells how quickly the distance between cars changes.',
    conclusion: 'Speeds add when cars move toward each other and subtract when they move in the same direction.'
  },
  friction: {
    principle: 'Friction force depends on the coefficient of friction and normal force.',
    conclusion: 'Tire choice and road surface decide whether engine force becomes motion or slipping.'
  },
  braking: {
    principle: 'Braking distance grows with speed squared and shrinks when friction is higher.',
    conclusion: 'High speed and low grip are a dangerous combination because stopping distance rises quickly.'
  },
  electricity: {
    principle: 'Current flows only through a closed circuit, and Ohm law links voltage, resistance, and current.',
    conclusion: 'Opening a switch or breaking a wire stops current, so the component turns off.'
  },
  battery: {
    principle: 'Battery working time depends on stored energy divided by total power consumption.',
    conclusion: 'More active consumers drain the battery faster.'
  },
  lights: {
    principle: 'Car lights convert electrical power into brightness and a visible beam.',
    conclusion: 'High beam shines farther but uses more power, and low battery makes light dimmer.'
  },
  challenges: {
    principle: 'Mixed tasks connect motion, force, friction, circuits, power, and energy.',
    conclusion: 'The proof run connects the answer to a visible car behavior.'
  }
};

const DASHBOARD_POWER_W = 18;
const SCREEN_POWER_W = 22;
const MOTOR_CONTROLLER_POWER_W = 36;

function CarPhysicsLab({ onCarLaunch }) {
  const [selectedLab, setSelectedLab] = useState('constructor');
  const [selection, setSelection] = useState(DEFAULT_SELECTION);
  const [speedParams, setSpeedParams] = useState({
    target: 'speed',
    distance: 120,
    time: 12,
    speed: 10
  });
  const [twoCarParams, setTwoCarParams] = useState({
    scenario: 'toward',
    speedA: 10,
    speedB: 20,
    initialDistance: 300,
    delayA: 0,
    delayB: 0,
    simTime: 10
  });
  const [frictionParams, setFrictionParams] = useState({ speed: 12 });
  const [brakingParams, setBrakingParams] = useState({ initialSpeed: 20 });
  const [electricityState, setElectricityState] = useState({
    voltage: 12,
    resistance: 6,
    circuitClosed: true,
    wireConnected: true,
    headlightsOn: true,
    dashboardOn: true
  });
  const [batteryState, setBatteryState] = useState({
    charge: 100,
    headlightsOn: true,
    dashboardOn: true,
    screenOn: false,
    motorControllerOn: false
  });
  const [lightsState, setLightsState] = useState({
    lowBeam: true,
    highBeam: false,
    brake: false,
    turnSignal: false,
    circuitClosed: true,
    batteryCharge: 100
  });
  const [simulation, setSimulation] = useState({ isRunning: false, key: 0 });
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskAnswer, setTaskAnswer] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [taskFeedback, setTaskFeedback] = useState('');
  const [lastSolvedTask, setLastSolvedTask] = useState(null);
  const [proofValues, setProofValues] = useState({});

  const stats = useMemo(
    () => calculateCarStats(selection, safeNumber(brakingParams.initialSpeed, 20)),
    [selection, brakingParams.initialSpeed]
  );
  const speedCalc = useMemo(() => calculateSpeedParams(speedParams), [speedParams]);
  const relativeMotion = useMemo(() => calculateRelativeMotion(twoCarParams), [twoCarParams]);
  const electrical = useMemo(
    () => calculateElectricalState(electricityState, stats.battery, stats.light),
    [electricityState, stats.battery, stats.light]
  );
  const batteryLoad = useMemo(
    () => calculateBatteryLoad(batteryState, stats.light, stats.battery),
    [batteryState, stats.light, stats.battery]
  );
  const lightState = useMemo(
    () => calculateLightState(lightsState, stats.battery, stats.light),
    [lightsState, stats.battery, stats.light]
  );
  const taskList = selectedLab === 'challenges' ? ALL_TASKS : LAB_TASKS[selectedLab] || [];
  const currentTask = taskList[taskIndex] || taskList[0];
  const formula = useMemo(
    () =>
      buildFormula({
        selectedLab,
        stats,
        speedCalc,
        twoCarParams,
        relativeMotion,
        brakingParams,
        electrical,
        batteryLoad,
        lightState,
        proofValues,
        currentTask
      }),
    [
      selectedLab,
      stats,
      speedCalc,
      twoCarParams,
      relativeMotion,
      brakingParams,
      electrical,
      batteryLoad,
      lightState,
      proofValues,
      currentTask
    ]
  );
  const validationMessage = useMemo(
    () =>
      getValidationMessage({
        selectedLab,
        speedCalc,
        speedParams,
        twoCarParams,
        brakingParams,
        electrical,
        batteryState,
        lightsState
      }),
    [selectedLab, speedCalc, speedParams, twoCarParams, brakingParams, electrical, batteryState, lightsState]
  );

  useEffect(() => {
    setTaskIndex(0);
    setTaskAnswer('');
    setHintsShown(0);
    setTaskFeedback('');
  }, [selectedLab]);

  useEffect(() => {
    if (!simulation.isRunning || selectedLab !== 'battery' || batteryLoad.totalPower <= 0) return;

    const interval = window.setInterval(() => {
      setBatteryState((prev) => {
        const nextCharge = Math.max(0, safeNumber(prev.charge, 0) - batteryLoad.totalPower / stats.battery.capacityWh);
        return { ...prev, charge: round(nextCharge, 2) };
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, [simulation.isRunning, simulation.key, selectedLab, batteryLoad.totalPower, stats.battery.capacityWh]);

  const updateSelection = (field, value) => {
    setSelection((prev) => ({ ...prev, [field]: value }));
  };

  const runSimulation = () => {
    if (validationMessage) return;
    setProofValues({});
    setSimulation({ isRunning: true, key: Date.now() });
  };

  const pauseSimulation = () => {
    setSimulation((prev) => ({ ...prev, isRunning: false }));
  };

  const resetSimulation = () => {
    setSimulation({ isRunning: false, key: 0 });
    setProofValues({});
    setBatteryState((prev) => ({ ...prev, charge: stats.battery.chargePercent }));
    setLightsState((prev) => ({ ...prev, batteryCharge: stats.battery.chargePercent }));
  };

  const applyTaskVisualization = (task) => {
    if (!task?.visualizationParams) return;

    const params = task.visualizationParams;
    setProofValues(params);
    setSelection((prev) => ({
      ...prev,
      bodyType: params.bodyType || prev.bodyType,
      engineType: params.engineType || prev.engineType,
      tireType: params.tireType || prev.tireType,
      roadBiome: params.roadBiome || prev.roadBiome,
      batteryType: params.batteryType || prev.batteryType,
      lightType: params.lightType || prev.lightType
    }));

    if (params.lab === 'speed') {
      setSpeedParams((prev) => ({
        ...prev,
        target: params.target || prev.target,
        distance: params.distance ?? prev.distance,
        time: params.time ?? prev.time,
        speed: params.speed ?? prev.speed
      }));
    }

    if (params.lab === 'twoCar') {
      setTwoCarParams((prev) => ({
        ...prev,
        scenario: params.scenario || prev.scenario,
        speedA: params.speedA ?? prev.speedA,
        speedB: params.speedB ?? prev.speedB,
        initialDistance: params.initialDistance ?? prev.initialDistance,
        simTime: params.simTime ?? prev.simTime,
        delayA: params.delayA ?? prev.delayA,
        delayB: params.delayB ?? prev.delayB
      }));
    }

    if (params.lab === 'braking') {
      setBrakingParams((prev) => ({
        ...prev,
        initialSpeed: params.initialSpeed ?? prev.initialSpeed
      }));
    }

    if (params.lab === 'electricity') {
      setElectricityState((prev) => ({
        ...prev,
        voltage: params.voltage ?? prev.voltage,
        resistance: params.resistance ?? prev.resistance,
        circuitClosed: params.circuitClosed ?? prev.circuitClosed,
        wireConnected: params.wireConnected ?? prev.wireConnected,
        dashboardOn: params.dashboardOn ?? prev.dashboardOn
      }));
    }

    if (params.lab === 'battery') {
      setBatteryState((prev) => ({
        ...prev,
        headlightsOn: params.headlightsOn ?? prev.headlightsOn,
        dashboardOn: params.dashboardOn ?? prev.dashboardOn,
        screenOn: params.screenOn ?? prev.screenOn,
        motorControllerOn: params.motorControllerOn ?? prev.motorControllerOn,
        charge: params.charge ?? prev.charge
      }));
    }

    if (params.lab === 'lights') {
      setLightsState((prev) => ({
        ...prev,
        lowBeam: params.lowBeam ?? prev.lowBeam,
        highBeam: params.highBeam ?? prev.highBeam,
        brake: params.brake ?? prev.brake,
        turnSignal: params.turnSignal ?? prev.turnSignal,
        circuitClosed: params.circuitClosed ?? prev.circuitClosed,
        batteryCharge: params.batteryCharge ?? prev.batteryCharge
      }));
    }

    if (params.lab && params.lab !== selectedLab && selectedLab === 'challenges') {
      setSelectedLab(params.lab);
    }

    setSimulation({ isRunning: true, key: Date.now() });
  };

  const checkTaskAnswer = () => {
    if (!currentTask) return;
    const result = validateAnswer(currentTask, taskAnswer);
    setTaskFeedback(result.message);
    if (result.ok) {
      setLastSolvedTask(currentTask.id);
      applyTaskVisualization(currentTask);
    }
  };

  const showNextHint = () => {
    if (!currentTask) return;
    setHintsShown((prev) => Math.min(prev + 1, currentTask.hints.length));
  };

  const activeSceneLab = selectedLab === 'challenges' ? currentTask?.lab || 'speed' : selectedLab;

  return (
    <div className="car-physics-lab">
      <header className="car-lab-topbar">
        <div>
          <p className="eyebrow">NovaLab car physics module</p>
          <h2>Interactive car physics lab</h2>
        </div>
        <div className="car-lab-actions">
          <button type="button" className="control-button primary" onClick={runSimulation} disabled={Boolean(validationMessage)}>
            Run simulation
          </button>
          <button type="button" className="control-button" onClick={pauseSimulation}>
            Pause
          </button>
          <button type="button" className="control-button" onClick={resetSimulation}>
            Reset
          </button>
          {onCarLaunch && (
            <button type="button" className="control-button subtle" onClick={onCarLaunch}>
              Classic drive
            </button>
          )}
        </div>
      </header>

      <nav className="car-lab-tabs" aria-label="Car physics labs">
        {LABS.map((lab) => (
          <button
            type="button"
            key={lab.id}
            className={`lab-tab ${selectedLab === lab.id ? 'active' : ''}`}
            onClick={() => setSelectedLab(lab.id)}
          >
            <span>{lab.label}</span>
          </button>
        ))}
      </nav>

      <main className="car-lab-grid">
        <section className="car-lab-panel controls-panel">
          <PanelHeader title={LABS.find((lab) => lab.id === selectedLab)?.label || 'Lab'} subtitle={LAB_COPY[selectedLab].principle} />
          <LabControls
            selectedLab={selectedLab}
            selection={selection}
            updateSelection={updateSelection}
            speedParams={speedParams}
            setSpeedParams={setSpeedParams}
            twoCarParams={twoCarParams}
            setTwoCarParams={setTwoCarParams}
            frictionParams={frictionParams}
            setFrictionParams={setFrictionParams}
            brakingParams={brakingParams}
            setBrakingParams={setBrakingParams}
            electricityState={electricityState}
            setElectricityState={setElectricityState}
            batteryState={batteryState}
            setBatteryState={setBatteryState}
            lightsState={lightsState}
            setLightsState={setLightsState}
            stats={stats}
          />
          {validationMessage && <div className="validation-message">{validationMessage}</div>}
        </section>

        <section className="car-lab-stage">
          <CarScene
            lab={activeSceneLab}
            stats={stats}
            speedCalc={speedCalc}
            relativeMotion={relativeMotion}
            twoCarParams={twoCarParams}
            frictionParams={frictionParams}
            brakingParams={brakingParams}
            electrical={electrical}
            batteryLoad={batteryLoad}
            batteryState={batteryState}
            lightState={lightState}
            lightsState={lightsState}
            proofValues={proofValues}
            isRunning={simulation.isRunning}
            simKey={simulation.key}
            lastSolvedTask={lastSolvedTask}
          />
          <div className="explanation-strip">
            <strong>Conclusion:</strong> {LAB_COPY[activeSceneLab]?.conclusion || LAB_COPY[selectedLab].conclusion}
          </div>
        </section>

        <aside className="car-lab-side">
          <StatsPanel stats={stats} batteryState={batteryState} batteryLoad={batteryLoad} lightState={lightState} />
          <FormulaPanel formula={formula} />
          <TaskPanel
            tasks={taskList}
            currentTask={currentTask}
            taskIndex={taskIndex}
            setTaskIndex={setTaskIndex}
            taskAnswer={taskAnswer}
            setTaskAnswer={setTaskAnswer}
            checkTaskAnswer={checkTaskAnswer}
            showNextHint={showNextHint}
            hintsShown={hintsShown}
            taskFeedback={taskFeedback}
            runVisualization={() => applyTaskVisualization(currentTask)}
          />
        </aside>
      </main>
    </div>
  );
}

function LabControls({
  selectedLab,
  selection,
  updateSelection,
  speedParams,
  setSpeedParams,
  twoCarParams,
  setTwoCarParams,
  frictionParams,
  setFrictionParams,
  brakingParams,
  setBrakingParams,
  electricityState,
  setElectricityState,
  batteryState,
  setBatteryState,
  lightsState,
  setLightsState,
  stats
}) {
  if (selectedLab === 'constructor') {
    return (
      <div className="control-stack">
        <OptionSelect label="Body type" value={selection.bodyType} options={BODY_TYPES} onChange={(value) => updateSelection('bodyType', value)} />
        <OptionSelect label="Motor type" value={selection.engineType} options={ENGINE_TYPES} onChange={(value) => updateSelection('engineType', value)} />
        <OptionSelect label="Tires" value={selection.tireType} options={TIRE_TYPES} onChange={(value) => updateSelection('tireType', value)} />
        <OptionSelect label="Road biome" value={selection.roadBiome} options={ROAD_BIOMES} onChange={(value) => updateSelection('roadBiome', value)} />
        <OptionSelect label="Battery" value={selection.batteryType} options={BATTERY_TYPES} onChange={(value) => updateSelection('batteryType', value)} />
        <OptionSelect label="Headlights" value={selection.lightType} options={LIGHT_TYPES} onChange={(value) => updateSelection('lightType', value)} />
        <div className="part-explanation">
          <strong>{stats.body.name}:</strong> {stats.body.note}
          <br />
          <strong>{stats.engine.name}:</strong> {stats.engine.note}
          <br />
          <strong>{stats.tire.name}:</strong> {stats.tire.note}
        </div>
      </div>
    );
  }

  if (selectedLab === 'speed') {
    return (
      <div className="control-stack">
        <SegmentedControl
          label="Find"
          value={speedParams.target}
          options={[
            { id: 'speed', name: 'Speed' },
            { id: 'distance', name: 'Distance' },
            { id: 'time', name: 'Time' }
          ]}
          onChange={(value) => setSpeedParams((prev) => ({ ...prev, target: value }))}
        />
        <NumberField label="Distance" suffix="m" value={speedParams.distance} onChange={(value) => setSpeedParams((prev) => ({ ...prev, distance: value }))} min="0" />
        <NumberField label="Time" suffix="s" value={speedParams.time} onChange={(value) => setSpeedParams((prev) => ({ ...prev, time: value }))} min="0" />
        <NumberField label="Speed" suffix="m/s" value={speedParams.speed} onChange={(value) => setSpeedParams((prev) => ({ ...prev, speed: value }))} min="0" />
      </div>
    );
  }

  if (selectedLab === 'acceleration') {
    return (
      <div className="control-stack">
        <OptionSelect label="Body type" value={selection.bodyType} options={BODY_TYPES} onChange={(value) => updateSelection('bodyType', value)} />
        <OptionSelect label="Motor type" value={selection.engineType} options={ENGINE_TYPES} onChange={(value) => updateSelection('engineType', value)} />
        <OptionSelect label="Tires" value={selection.tireType} options={TIRE_TYPES} onChange={(value) => updateSelection('tireType', value)} />
        <OptionSelect label="Road surface" value={selection.roadBiome} options={ROAD_BIOMES} onChange={(value) => updateSelection('roadBiome', value)} />
        <div className="part-explanation">
          Effective driving force is limited by both motor force and tire grip. If grip is lower than motor force, the scene shows wheel slip.
        </div>
      </div>
    );
  }

  if (selectedLab === 'twoCar') {
    return (
      <div className="control-stack">
        <SegmentedControl
          label="Scenario"
          value={twoCarParams.scenario}
          options={[
            { id: 'toward', name: 'Toward' },
            { id: 'same', name: 'Same direction' },
            { id: 'away', name: 'Away' }
          ]}
          onChange={(value) => setTwoCarParams((prev) => ({ ...prev, scenario: value }))}
        />
        <NumberField label="Car A speed" suffix="m/s" value={twoCarParams.speedA} onChange={(value) => setTwoCarParams((prev) => ({ ...prev, speedA: value }))} min="0" />
        <NumberField label="Car B speed" suffix="m/s" value={twoCarParams.speedB} onChange={(value) => setTwoCarParams((prev) => ({ ...prev, speedB: value }))} min="0" />
        <NumberField label="Initial distance" suffix="m" value={twoCarParams.initialDistance} onChange={(value) => setTwoCarParams((prev) => ({ ...prev, initialDistance: value }))} min="0" />
        <NumberField label="Car A start delay" suffix="s" value={twoCarParams.delayA} onChange={(value) => setTwoCarParams((prev) => ({ ...prev, delayA: value }))} min="0" />
        <NumberField label="Car B start delay" suffix="s" value={twoCarParams.delayB} onChange={(value) => setTwoCarParams((prev) => ({ ...prev, delayB: value }))} min="0" />
        <NumberField label="Simulation time" suffix="s" value={twoCarParams.simTime} onChange={(value) => setTwoCarParams((prev) => ({ ...prev, simTime: value }))} min="0" />
      </div>
    );
  }

  if (selectedLab === 'friction') {
    return (
      <div className="control-stack">
        <OptionSelect label="Tires" value={selection.tireType} options={TIRE_TYPES} onChange={(value) => updateSelection('tireType', value)} />
        <OptionSelect label="Road surface" value={selection.roadBiome} options={ROAD_BIOMES} onChange={(value) => updateSelection('roadBiome', value)} />
        <OptionSelect label="Body type" value={selection.bodyType} options={BODY_TYPES} onChange={(value) => updateSelection('bodyType', value)} />
        <OptionSelect label="Motor force" value={selection.engineType} options={ENGINE_TYPES} onChange={(value) => updateSelection('engineType', value)} />
        <NumberField label="Test speed" suffix="m/s" value={frictionParams.speed} onChange={(value) => setFrictionParams((prev) => ({ ...prev, speed: value }))} min="0" />
      </div>
    );
  }

  if (selectedLab === 'braking') {
    return (
      <div className="control-stack">
        <NumberField label="Initial speed" suffix="m/s" value={brakingParams.initialSpeed} onChange={(value) => setBrakingParams((prev) => ({ ...prev, initialSpeed: value }))} min="0" />
        <OptionSelect label="Tires" value={selection.tireType} options={TIRE_TYPES} onChange={(value) => updateSelection('tireType', value)} />
        <OptionSelect label="Road surface" value={selection.roadBiome} options={ROAD_BIOMES} onChange={(value) => updateSelection('roadBiome', value)} />
        <OptionSelect label="Body type" value={selection.bodyType} options={BODY_TYPES} onChange={(value) => updateSelection('bodyType', value)} />
      </div>
    );
  }

  if (selectedLab === 'electricity') {
    return (
      <div className="control-stack">
        <NumberField label="Voltage" suffix="V" value={electricityState.voltage} onChange={(value) => setElectricityState((prev) => ({ ...prev, voltage: value }))} min="0" />
        <NumberField label="Resistance" suffix="Ohm" value={electricityState.resistance} onChange={(value) => setElectricityState((prev) => ({ ...prev, resistance: value }))} min="0" step="0.5" />
        <ToggleRow label="Battery switch" checked={electricityState.circuitClosed} onChange={(value) => setElectricityState((prev) => ({ ...prev, circuitClosed: value }))} />
        <ToggleRow label="Wire connected" checked={electricityState.wireConnected} onChange={(value) => setElectricityState((prev) => ({ ...prev, wireConnected: value }))} />
        <ToggleRow label="Headlights" checked={electricityState.headlightsOn} onChange={(value) => setElectricityState((prev) => ({ ...prev, headlightsOn: value }))} />
        <ToggleRow label="Dashboard" checked={electricityState.dashboardOn} onChange={(value) => setElectricityState((prev) => ({ ...prev, dashboardOn: value }))} />
      </div>
    );
  }

  if (selectedLab === 'battery') {
    return (
      <div className="control-stack">
        <OptionSelect label="Battery type" value={selection.batteryType} options={BATTERY_TYPES} onChange={(value) => updateSelection('batteryType', value)} />
        <OptionSelect label="Lights" value={selection.lightType} options={LIGHT_TYPES} onChange={(value) => updateSelection('lightType', value)} />
        <NumberField label="Battery charge" suffix="%" value={batteryState.charge} onChange={(value) => setBatteryState((prev) => ({ ...prev, charge: value }))} min="0" max="100" />
        <ToggleRow label="Headlights" checked={batteryState.headlightsOn} onChange={(value) => setBatteryState((prev) => ({ ...prev, headlightsOn: value }))} />
        <ToggleRow label="Dashboard" checked={batteryState.dashboardOn} onChange={(value) => setBatteryState((prev) => ({ ...prev, dashboardOn: value }))} />
        <ToggleRow label="Digital screen" checked={batteryState.screenOn} onChange={(value) => setBatteryState((prev) => ({ ...prev, screenOn: value }))} />
        <ToggleRow label="Motor controller" checked={batteryState.motorControllerOn} onChange={(value) => setBatteryState((prev) => ({ ...prev, motorControllerOn: value }))} />
      </div>
    );
  }

  if (selectedLab === 'lights') {
    return (
      <div className="control-stack">
        <OptionSelect label="Headlight type" value={selection.lightType} options={LIGHT_TYPES} onChange={(value) => updateSelection('lightType', value)} />
        <NumberField label="Battery charge" suffix="%" value={lightsState.batteryCharge} onChange={(value) => setLightsState((prev) => ({ ...prev, batteryCharge: value }))} min="0" max="100" />
        <ToggleRow label="Closed circuit" checked={lightsState.circuitClosed} onChange={(value) => setLightsState((prev) => ({ ...prev, circuitClosed: value }))} />
        <ToggleRow label="Low beam" checked={lightsState.lowBeam} onChange={(value) => setLightsState((prev) => ({ ...prev, lowBeam: value, highBeam: value ? false : prev.highBeam }))} />
        <ToggleRow label="High beam" checked={lightsState.highBeam} onChange={(value) => setLightsState((prev) => ({ ...prev, highBeam: value, lowBeam: value ? false : prev.lowBeam }))} />
        <ToggleRow label="Brake lights" checked={lightsState.brake} onChange={(value) => setLightsState((prev) => ({ ...prev, brake: value }))} />
        <ToggleRow label="Turn signal" checked={lightsState.turnSignal} onChange={(value) => setLightsState((prev) => ({ ...prev, turnSignal: value }))} />
      </div>
    );
  }

  return (
    <div className="part-explanation">
      Pick a task on the right. After a correct answer, the module applies the task values and runs the visual proof.
    </div>
  );
}

function CarScene({
  lab,
  stats,
  speedCalc,
  relativeMotion,
  twoCarParams,
  frictionParams,
  brakingParams,
  electrical,
  batteryLoad,
  batteryState,
  lightState,
  lightsState,
  proofValues,
  isRunning,
  simKey,
  lastSolvedTask
}) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [simKey, lab]);

  useEffect(() => {
    if (!isRunning) return undefined;

    let frame = 0;
    let last = performance.now();
    const duration = getSceneDuration(lab, speedCalc, twoCarParams);

    const tick = (now) => {
      const delta = now - last;
      last = now;
      progressRef.current = Math.min(1, progressRef.current + delta / duration);
      setProgress(progressRef.current);
      if (progressRef.current < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isRunning, simKey, lab, speedCalc, twoCarParams]);

  const roadStyle = {
    '--road-color': stats.road.color,
    '--road-accent': stats.road.accent,
    '--sky-color': stats.road.sky,
    '--car-color': stats.body.color,
    '--light-color': stats.light.color
  };

  return (
    <div className={`visual-stage visual-stage-3d road-${stats.road.texture}`} style={roadStyle}>
      <div className="stage-sky">
        <div>
          <span className="stage-label">{byId(LABS, lab).topic}</span>
          <h3>{byId(LABS, lab).label}</h3>
        </div>
        <div className="stage-chip">Proof run {lastSolvedTask ? 'after task' : 'ready'}</div>
      </div>

      <Canvas
        className="physics-3d-canvas"
        shadows
        camera={{ position: [11, 7, 12], fov: 42 }}
        dpr={[1, 1.6]}
      >
        <color attach="background" args={[stats.road.sky]} />
        <fog attach="fog" args={[stats.road.sky, 18, 44]} />
        <ambientLight intensity={0.78} />
        <directionalLight
          position={[6, 12, 8]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-8, 5, -6]} intensity={0.8} color={stats.road.accent} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={8}
          maxDistance={24}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0.5, 0]}
        />
        <Physics3DWorld
          lab={lab}
          stats={stats}
          speedCalc={speedCalc}
          relativeMotion={relativeMotion}
          twoCarParams={twoCarParams}
          brakingParams={brakingParams}
          electrical={electrical}
          batteryLoad={batteryLoad}
          batteryState={batteryState}
          lightState={lightState}
          lightsState={lightsState}
          proofValues={proofValues}
          progress={progress}
        />
      </Canvas>

      <SceneReadout
        lab={lab}
        stats={stats}
        speedCalc={speedCalc}
        relativeMotion={relativeMotion}
        twoCarParams={twoCarParams}
        frictionParams={frictionParams}
        brakingParams={brakingParams}
        electrical={electrical}
        batteryLoad={batteryLoad}
        batteryState={batteryState}
        lightState={lightState}
        lightsState={lightsState}
        proofValues={proofValues}
        progress={progress}
      />
    </div>
  );
}

function Physics3DWorld({
  lab,
  stats,
  speedCalc,
  relativeMotion,
  twoCarParams,
  brakingParams,
  electrical,
  batteryLoad,
  batteryState,
  lightState,
  lightsState,
  proofValues,
  progress
}) {
  const isNight = lab === 'lights';
  const roadColor = isNight ? '#111827' : stats.road.color;

  return (
    <group>
      <Track3D stats={stats} roadColor={roadColor} />
      <Lab3DObjects
        lab={lab}
        stats={stats}
        speedCalc={speedCalc}
        relativeMotion={relativeMotion}
        twoCarParams={twoCarParams}
        brakingParams={brakingParams}
        electrical={electrical}
        batteryLoad={batteryLoad}
        batteryState={batteryState}
        lightState={lightState}
        lightsState={lightsState}
        proofValues={proofValues}
        progress={progress}
      />
    </group>
  );
}

function Track3D({ stats, roadColor }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[42, 26]} />
        <meshStandardMaterial color={stats.road.sky} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 8]} />
        <meshStandardMaterial color={roadColor} roughness={stats.road.texture === 'ice' ? 0.18 : 0.72} metalness={stats.road.texture === 'ice' ? 0.18 : 0.02} />
      </mesh>
      {Array.from({ length: 11 }).map((_, index) => (
        <mesh key={index} position={[-15 + index * 3, 0.03, 0]} receiveShadow>
          <boxGeometry args={[1.25, 0.025, 0.08]} />
          <meshStandardMaterial color={stats.road.accent} emissive={stats.road.accent} emissiveIntensity={0.12} />
        </mesh>
      ))}
      {[-4.15, 4.15].map((z) => (
        <mesh key={z} position={[0, 0.04, z]} receiveShadow>
          <boxGeometry args={[32, 0.03, 0.08]} />
          <meshStandardMaterial color={stats.road.accent} />
        </mesh>
      ))}
      <GridMarks />
    </group>
  );
}

function GridMarks() {
  return (
    <group>
      {Array.from({ length: 9 }).map((_, index) => {
        const x = -14 + index * 3.5;
        return (
          <group key={x} position={[x, 0.05, -4.9]}>
            <mesh>
              <boxGeometry args={[0.035, 0.05, 0.55]} />
              <meshBasicMaterial color="#dbeafe" transparent opacity={0.7} />
            </mesh>
            <Text position={[0, 0.15, -0.48]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.28} color="#dbeafe" anchorX="center">
              {index * 25}m
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function Lab3DObjects({
  lab,
  stats,
  speedCalc,
  relativeMotion,
  twoCarParams,
  brakingParams,
  electrical,
  batteryLoad,
  batteryState,
  lightState,
  lightsState,
  proofValues,
  progress
}) {
  if (lab === 'constructor') return <Constructor3D stats={stats} />;
  if (lab === 'speed') return <Speed3D stats={stats} speedCalc={speedCalc} progress={progress} />;
  if (lab === 'acceleration') return <Acceleration3D stats={stats} proofValues={proofValues} progress={progress} />;
  if (lab === 'twoCar') return <TwoCar3D stats={stats} params={twoCarParams} motion={relativeMotion} progress={progress} />;
  if (lab === 'friction') return <Friction3D stats={stats} proofValues={proofValues} progress={progress} />;
  if (lab === 'braking') return <Braking3D stats={stats} brakingParams={brakingParams} proofValues={proofValues} progress={progress} />;
  if (lab === 'electricity') return <Electricity3D stats={stats} electrical={electrical} />;
  if (lab === 'battery') return <Battery3D stats={stats} batteryLoad={batteryLoad} batteryState={batteryState} proofValues={proofValues} progress={progress} />;
  if (lab === 'lights') return <Lights3D stats={stats} lightState={lightState} lightsState={lightsState} proofValues={proofValues} progress={progress} />;
  return <Constructor3D stats={stats} />;
}

function Constructor3D({ stats }) {
  return (
    <group>
      <CarModel3D stats={stats} position={[0, 0.45, 0]} scale={1.16} lightsOn />
      <PartPedestal position={[-8, 0.12, 3.4]} label={stats.body.shortName} value={`${formatNumber(stats.body.mass, 0)} kg`} color={stats.body.color} />
      <PartPedestal position={[-4, 0.12, 3.4]} label={stats.engine.shortName} value={`${stats.engine.powerKw} kW`} color={stats.engine.color} />
      <PartPedestal position={[0, 0.12, 3.4]} label={stats.tire.shortName} value={`mu ${formatNumber(stats.mu, 2)}`} color={stats.road.accent} />
      <PartPedestal position={[4, 0.12, 3.4]} label={stats.battery.shortName} value={`${stats.battery.capacityWh} Wh`} color={stats.battery.color} />
      <PartPedestal position={[8, 0.12, 3.4]} label={stats.light.shortName} value={`${stats.light.powerW} W`} color={stats.light.color} />
    </group>
  );
}

function Speed3D({ stats, speedCalc, progress }) {
  const carX = THREE.MathUtils.lerp(-12, 12, progress);
  return (
    <group>
      <CarModel3D stats={stats} position={[carX, 0.45, 0]} speed={speedCalc.speed} lightsOn />
      <FinishGate position={[12, 0, 0]} label={`${formatNumber(speedCalc.distance, 0)} m`} />
    </group>
  );
}

function Acceleration3D({ stats, proofValues, progress }) {
  const mass = Math.max(1, safeNumber(proofValues.mass, stats.totalMass));
  const force = Math.max(0, safeNumber(proofValues.force, stats.driveForce));
  const acceleration = force / mass;
  const distance = 0.5 * acceleration * (progress * 6) ** 2;
  const carX = Math.min(12, -12 + distance * 0.8);

  return (
    <group>
      <CarModel3D stats={stats} position={[carX, 0.45, 0]} speed={acceleration * progress * 6} slipping={stats.isSlipping} lightsOn />
      <BarGraph3D acceleration={acceleration} />
    </group>
  );
}

function TwoCar3D({ stats, params, motion, progress }) {
  const scenario = params.scenario;
  const meetX = 0;
  const carAX = scenario === 'away' ? THREE.MathUtils.lerp(-1.2, -12, progress) : scenario === 'same' ? THREE.MathUtils.lerp(-12, 8, progress) : THREE.MathUtils.lerp(-12, meetX, progress);
  const carBX = scenario === 'away' ? THREE.MathUtils.lerp(1.2, 12, progress) : scenario === 'same' ? THREE.MathUtils.lerp(-5, 6, progress) : THREE.MathUtils.lerp(12, meetX, progress);
  const secondStats = { ...stats, body: { ...stats.body, color: '#22c55e' } };

  return (
    <group>
      <CarModel3D stats={stats} position={[carAX, 0.45, -1.75]} speed={params.speedA} label="A" lightsOn />
      <CarModel3D stats={secondStats} position={[carBX, 0.45, 1.75]} speed={params.speedB} rotationY={scenario === 'toward' ? Math.PI : 0} label="B" />
      <DistanceBeam startX={carAX} endX={carBX} z={0} />
      <FinishGate position={[meetX, 0, 0]} label={`${formatNumber(motion.relativeSpeed, 1)} m/s rel.`} color="#f4d35e" />
    </group>
  );
}

function Friction3D({ stats, proofValues, progress }) {
  const mass = Math.max(1, safeNumber(proofValues.mass, stats.totalMass));
  const mu = Math.max(0, safeNumber(proofValues.mu, stats.mu));
  const force = Math.max(0, safeNumber(proofValues.force, stats.engine.forceN));
  const frictionForce = mu * mass * G;
  const slipping = force > frictionForce * 0.9;
  const carX = THREE.MathUtils.lerp(-11, slipping ? 0 : 11, progress);

  return (
    <group>
      <CarModel3D stats={stats} position={[carX, 0.45, 0]} speed={12} slipping={slipping} lightsOn />
      {slipping && <SlipParticles progress={progress} position={[carX - 1.2, 0.25, 0]} color={stats.road.accent} />}
      <GripMeter3D value={(frictionForce / Math.max(force, 1)) * 100} />
    </group>
  );
}

function Braking3D({ stats, brakingParams, proofValues, progress }) {
  const initialSpeed = Math.max(0, safeNumber(proofValues.initialSpeed, brakingParams.initialSpeed));
  const mu = Math.max(0.01, safeNumber(proofValues.mu, stats.mu));
  const bodyFactor = proofValues.mu ? 1 : stats.body.brakingFactor;
  const distance = calculateBrakingDistance(initialSpeed, mu, bodyFactor);
  const stopX = Math.min(12, -10 + distance / 6);
  const carX = THREE.MathUtils.lerp(-10, stopX, progress);

  return (
    <group>
      <CarModel3D stats={stats} position={[carX, 0.45, 0]} speed={initialSpeed * (1 - progress)} braking={progress > 0.05} lightsOn />
      <SkidLine startX={-10} endX={stopX} label={`${formatNumber(distance, 1)} m`} />
    </group>
  );
}

function Electricity3D({ stats, electrical }) {
  const active = electrical.circuitClosed && electrical.current > 0;
  return (
    <group>
      <CarModel3D stats={stats} position={[4.5, 0.45, 0]} lightsOn={active} />
      <Circuit3D active={active} broken={!electrical.circuitClosed} stats={stats} />
    </group>
  );
}

function Battery3D({ stats, batteryLoad, batteryState, proofValues, progress }) {
  const totalPower = safeNumber(proofValues.power, batteryLoad.totalPower);
  const visualCharge = Math.max(0, safeNumber(batteryState.charge, 0) - progress * Math.min(35, totalPower / 3));
  return (
    <group>
      <CarModel3D stats={stats} position={[4.2, 0.45, 0]} lightsOn={batteryState.headlightsOn && visualCharge > 0} />
      <BatteryPack3D charge={visualCharge} color={stats.battery.color} />
      <ConsumerBlocks stats={stats} batteryState={batteryState} />
    </group>
  );
}

function Lights3D({ stats, lightState, lightsState, proofValues, progress }) {
  const brightness = safeNumber(proofValues.brightness, lightState.brightness);
  const beamMeters = safeNumber(proofValues.beamMeters, lightState.beamMeters);
  const turnSignal = lightsState.turnSignal && Math.floor(progress * 12) % 2 === 0;
  return (
    <group>
      <CarModel3D
        stats={stats}
        position={[-5.5, 0.45, 0]}
        lightsOn={brightness > 0 && lightsState.circuitClosed}
        beamLength={beamMeters}
        beamBrightness={brightness}
        braking={lightsState.brake}
        turnSignal={turnSignal}
      />
      <Text position={[4, 0.1, -3.3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.45} color="#fde68a" anchorX="center">
        {formatNumber(beamMeters, 0)} m light cone
      </Text>
    </group>
  );
}

function CarModel3D({
  stats,
  position,
  rotationY = 0,
  speed = 0,
  scale = 1,
  slipping = false,
  braking = false,
  lightsOn = false,
  beamLength = 0,
  beamBrightness = 0,
  turnSignal = false,
  label
}) {
  const groupRef = useRef();
  const wheelRefs = useRef([]);
  const bodyLength = stats.body.silhouette === 'sport' ? 3.6 : stats.body.silhouette === 'suv' ? 3.9 : 3.55;
  const bodyHeight = stats.body.silhouette === 'sport' ? 0.5 : stats.body.silhouette === 'compact' ? 0.62 : 0.78;
  const cabinY = stats.body.silhouette === 'sport' ? 0.68 : 0.82;
  const beamScale = Math.max(1, beamLength / 20);

  useFrame((_, delta) => {
    const spin = (slipping ? 16 : Math.max(2, speed)) * delta;
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x -= spin;
    });
    if (groupRef.current && slipping) {
      groupRef.current.position.z = position[2] + Math.sin(performance.now() * 0.03) * 0.035;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {label && (
        <Text position={[0, 1.85, 0]} fontSize={0.42} color="#f4d35e" anchorX="center">
          {label}
        </Text>
      )}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[bodyLength, 0.25, 1.55]} />
        <meshStandardMaterial color="#111827" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.76, 0]}>
        <boxGeometry args={[bodyLength * 0.92, bodyHeight, 1.42]} />
        <meshStandardMaterial color={stats.body.color} metalness={0.28} roughness={0.34} />
      </mesh>
      <mesh castShadow position={[-0.35, cabinY + 0.3, 0]}>
        <boxGeometry args={[1.35, 0.72, 1.16]} />
        <meshStandardMaterial color="#a7d8ff" metalness={0.12} roughness={0.18} transparent opacity={0.78} />
      </mesh>
      <mesh castShadow position={[-1.05, 0.78, 0]}>
        <boxGeometry args={[0.55, 0.35, 1.08]} />
        <meshStandardMaterial color={stats.engine.color} emissive={stats.engine.color} emissiveIntensity={0.28} />
      </mesh>
      {[[-1.25, -0.82], [1.25, -0.82], [-1.25, 0.82], [1.25, 0.82]].map(([x, z], index) => (
        <Wheel3D
          key={`${x}-${z}`}
          refSetter={(node) => {
            wheelRefs.current[index] = node;
          }}
          position={[x, 0.3, z]}
          tire={stats.tire}
        />
      ))}
      {lightsOn && (
        <>
          <mesh position={[1.86, 0.75, -0.46]}>
            <sphereGeometry args={[0.09, 14, 14]} />
            <meshBasicMaterial color={stats.light.color} />
          </mesh>
          <mesh position={[1.86, 0.75, 0.46]}>
            <sphereGeometry args={[0.09, 14, 14]} />
            <meshBasicMaterial color={stats.light.color} />
          </mesh>
          {beamLength > 0 && (
            <mesh position={[2.2 + beamScale * 0.78, 0.62, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.74 + beamScale * 0.16, beamScale * 2.2, 32, 1, true]} />
              <meshBasicMaterial color={stats.light.color} transparent opacity={Math.min(0.42, beamBrightness / 210)} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          )}
          <pointLight position={[2.25, 0.8, 0]} color={stats.light.color} intensity={beamBrightness > 0 ? beamBrightness / 65 : 0.4} distance={8 + beamScale * 2} />
        </>
      )}
      {braking && (
        <mesh position={[-1.88, 0.72, 0]}>
          <boxGeometry args={[0.08, 0.28, 1.04]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}
      {turnSignal && (
        <mesh position={[1.9, 0.68, 0.68]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  );
}

function Wheel3D({ position, tire, refSetter }) {
  const radius = tire.tread === 'rugged' ? 0.42 : 0.36;
  return (
    <group position={position} ref={refSetter} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.28, 28]} />
        <meshStandardMaterial color="#06070a" roughness={0.78} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radius * 0.54, radius * 0.54, 0.3, 22]} />
        <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.28} />
      </mesh>
      {Array.from({ length: tire.tread === 'shallow' ? 8 : 14 }).map((_, index) => (
        <mesh key={index} position={[Math.cos(index) * radius * 0.82, Math.sin(index) * radius * 0.82, 0]}>
          <boxGeometry args={[0.05, 0.12, 0.32]} />
          <meshStandardMaterial color={tire.tread === 'studded' ? '#dbeafe' : '#1f2937'} />
        </mesh>
      ))}
    </group>
  );
}

function PartPedestal({ position, label, value, color }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.24, 1.1]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.9, 0.52, 0.62]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
      </mesh>
      <Text position={[0, 0.86, 0]} fontSize={0.22} color="#ffffff" anchorX="center">
        {label}
      </Text>
      <Text position={[0, -0.01, -0.75]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color="#dbeafe" anchorX="center">
        {value}
      </Text>
    </group>
  );
}

function FinishGate({ position, label, color = '#f4d35e' }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, -2]}>
        <boxGeometry args={[0.08, 2.2, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 1.1, 2]}>
        <boxGeometry args={[0.08, 2.2, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 2.22, 0]}>
        <boxGeometry args={[0.08, 0.08, 4.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <Text position={[0, 2.62, 0]} fontSize={0.34} color={color} anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function BarGraph3D({ acceleration }) {
  return (
    <group position={[8.5, 0.1, -3.1]}>
      {[1, 2, 3, 4, 5].map((item, index) => {
        const height = Math.min(2.4, 0.22 + acceleration * item * 0.14);
        return (
          <mesh key={item} position={[index * 0.45, height / 2, 0]} castShadow>
            <boxGeometry args={[0.28, height, 0.28]} />
            <meshStandardMaterial color="#80e7d5" emissive="#80e7d5" emissiveIntensity={0.16} />
          </mesh>
        );
      })}
      <Text position={[0.9, 2.8, 0]} fontSize={0.24} color="#baf7eb" anchorX="center">
        acceleration graph
      </Text>
    </group>
  );
}

function DistanceBeam({ startX, endX, z }) {
  const width = Math.abs(endX - startX);
  const center = (startX + endX) / 2;
  return (
    <mesh position={[center, 0.09, z]}>
      <boxGeometry args={[Math.max(0.2, width), 0.06, 0.08]} />
      <meshBasicMaterial color="#f4d35e" transparent opacity={0.72} />
    </mesh>
  );
}

function SlipParticles({ position, color }) {
  return (
    <group position={position}>
      {Array.from({ length: 20 }).map((_, index) => (
        <mesh key={index} position={[-(index % 5) * 0.32, 0.08 + (index % 3) * 0.08, (Math.floor(index / 5) - 1.5) * 0.22]}>
          <sphereGeometry args={[0.045 + (index % 3) * 0.012, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function GripMeter3D({ value }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <group position={[8.2, 0.15, 3]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[3.2, 0.16, 0.2]} />
        <meshBasicMaterial color="#243241" />
      </mesh>
      <mesh position={[-1.6 + (safeValue / 100) * 1.6, 0.18, 0]}>
        <boxGeometry args={[3.2 * (safeValue / 100), 0.18, 0.24]} />
        <meshBasicMaterial color={safeValue > 70 ? '#80e7d5' : safeValue > 35 ? '#f4d35e' : '#ef4444'} />
      </mesh>
      <Text position={[0, 0.58, 0]} fontSize={0.24} color="#ffffff" anchorX="center">
        grip {formatNumber(safeValue, 0)}%
      </Text>
    </group>
  );
}

function SkidLine({ startX, endX, label }) {
  const width = Math.max(0.4, Math.abs(endX - startX));
  return (
    <group>
      <mesh position={[(startX + endX) / 2, 0.06, -0.48]}>
        <boxGeometry args={[width, 0.035, 0.08]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[(startX + endX) / 2, 0.06, 0.48]}>
        <boxGeometry args={[width, 0.035, 0.08]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <Text position={[(startX + endX) / 2, 0.12, -2.1]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#fecaca" anchorX="center">
        braking distance {label}
      </Text>
    </group>
  );
}

function Circuit3D({ active, broken, stats }) {
  return (
    <group position={[-5.5, 0.25, 0]}>
      <CircuitNode position={[-3.1, 0.45, 0]} label="Battery" color={stats.battery.color} />
      <CircuitNode position={[0, 0.45, -2.2]} label={broken ? 'Open' : 'Switch'} color={broken ? '#ef4444' : '#f4d35e'} />
      <CircuitNode position={[3.1, 0.45, 0]} label="Lamp" color={active ? stats.light.color : '#64748b'} />
      <Wire3D start={[-2.45, 0.48, -0.1]} end={[-0.55, 0.48, -1.75]} active={active} color={stats.light.color} />
      <Wire3D start={[0.55, 0.48, -1.75]} end={[2.45, 0.48, -0.1]} active={active} color={stats.light.color} />
      <Wire3D start={[2.35, 0.48, 0.18]} end={[-2.35, 0.48, 0.18]} active={active} color={stats.light.color} />
      {active && Array.from({ length: 7 }).map((_, index) => (
        <mesh key={index} position={[-2.2 + index * 0.72, 0.75, Math.sin(index) * 0.16]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color={stats.light.color} />
        </mesh>
      ))}
    </group>
  );
}

function CircuitNode({ position, label, color }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 0.65, 0.8]} />
        <meshStandardMaterial color="#111827" emissive={color} emissiveIntensity={0.12} />
      </mesh>
      <Text position={[0, 0.58, 0]} fontSize={0.2} color={color} anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function Wire3D({ start, end, active, color }) {
  const sx = start[0];
  const sy = start[1];
  const sz = start[2];
  const ex = end[0];
  const ey = end[1];
  const ez = end[2];
  const dx = ex - sx;
  const dz = ez - sz;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  return (
    <mesh position={[(sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2]} rotation={[0, -angle, Math.PI / 2]}>
      <cylinderGeometry args={[0.045, 0.045, length, 10]} />
      <meshStandardMaterial color={active ? color : '#475569'} emissive={active ? color : '#000000'} emissiveIntensity={active ? 0.5 : 0} />
    </mesh>
  );
}

function BatteryPack3D({ charge, color }) {
  const clamped = Math.max(0, Math.min(100, charge));
  return (
    <group position={[-6, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2.8, 1.2, 1.35]} />
        <meshStandardMaterial color="#111827" roughness={0.32} />
      </mesh>
      <mesh position={[-1.25 + (clamped / 100) * 1.25, 0.02, 0]} castShadow>
        <boxGeometry args={[2.45 * (clamped / 100), 0.88, 1.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.24} />
      </mesh>
      <mesh position={[1.55, 0.12, 0]}>
        <boxGeometry args={[0.18, 0.48, 0.72]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <Text position={[0, 1.04, 0]} fontSize={0.28} color="#ffffff" anchorX="center">
        {formatNumber(clamped, 0)}% battery
      </Text>
    </group>
  );
}

function ConsumerBlocks({ stats, batteryState }) {
  const blocks = [
    ['Lights', batteryState.headlightsOn, stats.light.color],
    ['Dash', batteryState.dashboardOn, '#80e7d5'],
    ['Screen', batteryState.screenOn, '#a78bfa'],
    ['Motor', batteryState.motorControllerOn, stats.engine.color]
  ];

  return (
    <group position={[-6, 0.15, 2.8]}>
      {blocks.map(([label, active, color], index) => (
        <group key={label} position={[index * 1.2 - 1.8, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.45, 0.7]} />
            <meshStandardMaterial color={active ? color : '#334155'} emissive={active ? color : '#000000'} emissiveIntensity={active ? 0.25 : 0} />
          </mesh>
          <Text position={[0, 0.55, 0]} fontSize={0.16} color="#ffffff" anchorX="center">
            {label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function SceneReadout({
  lab,
  stats,
  speedCalc,
  relativeMotion,
  twoCarParams,
  frictionParams,
  brakingParams,
  electrical,
  batteryLoad,
  batteryState,
  lightState,
  lightsState,
  proofValues,
  progress
}) {
  const mass = Math.max(1, safeNumber(proofValues.mass, stats.totalMass));
  const force = Math.max(0, safeNumber(proofValues.force, stats.driveForce));
  const acceleration = force / mass;
  const mu = Math.max(0.01, safeNumber(proofValues.mu, stats.mu));
  const initialSpeed = Math.max(0, safeNumber(proofValues.initialSpeed, brakingParams.initialSpeed));
  const brakingDistance = calculateBrakingDistance(initialSpeed, mu, proofValues.mu ? 1 : stats.body.brakingFactor);
  const batteryPower = safeNumber(proofValues.power, batteryLoad.totalPower);
  const brightness = safeNumber(proofValues.brightness, lightState.brightness);
  const beamMeters = safeNumber(proofValues.beamMeters, lightState.beamMeters);

  if (lab === 'constructor') {
    return (
      <div className="stage-readout part-rack">
        <PartToken title={stats.body.shortName} detail={`${formatNumber(stats.body.mass, 0)} kg`} />
        <PartToken title={stats.engine.shortName} detail={`${stats.engine.powerKw} kW`} />
        <PartToken title={stats.tire.shortName} detail={`mu ${formatNumber(stats.mu, 2)}`} />
        <PartToken title={stats.battery.shortName} detail={`${stats.battery.capacityWh} Wh`} />
        <PartToken title={stats.light.shortName} detail={`${stats.light.powerW} W`} />
      </div>
    );
  }

  return (
    <div className="stage-readout scene-dashboard">
      {lab === 'speed' && (
        <>
          <Metric label="Timer" value={`${formatNumber(progress * Math.max(0, speedCalc.time), 1)} s`} />
          <Metric label="Speedometer" value={`${formatNumber(speedCalc.speed, 2)} m/s`} />
          <Metric label="Distance" value={`${formatNumber(speedCalc.distance, 0)} m`} />
        </>
      )}
      {lab === 'acceleration' && (
        <>
          <Metric label="Acceleration" value={`${formatNumber(acceleration, 2)} m/s^2`} />
          <Metric label="Force / mass" value={`${formatNumber(force, 0)} N / ${formatNumber(mass, 0)} kg`} />
          <Metric label="Speed now" value={`${formatNumber(acceleration * progress * 6, 2)} m/s`} />
        </>
      )}
      {lab === 'twoCar' && (
        <>
          <Metric label="Relative speed" value={`${formatNumber(relativeMotion.relativeSpeed, 2)} m/s`} />
          <Metric label={twoCarParams.scenario === 'toward' ? 'Meeting time' : 'Final distance'} value={twoCarParams.scenario === 'toward' ? `${formatNumber(relativeMotion.meetTime, 2)} s` : `${formatNumber(relativeMotion.finalDistance, 1)} m`} />
        </>
      )}
      {lab === 'friction' && (
        <>
          <Metric label="Test speed" value={`${formatNumber(frictionParams.speed, 1)} m/s`} />
          <Metric label="Friction force" value={`${formatNumber(mu * mass * G, 0)} N`} />
          <Metric label="Grip status" value={force > mu * mass * G * 0.9 ? 'slip' : 'grip'} />
        </>
      )}
      {lab === 'braking' && (
        <>
          <Metric label="Initial speed" value={`${formatNumber(initialSpeed, 1)} m/s`} />
          <Metric label="Mu" value={formatNumber(mu, 2)} />
          <Metric label="Stopping distance" value={`${formatNumber(brakingDistance, 1)} m`} />
        </>
      )}
      {lab === 'electricity' && (
        <>
          <Metric label="Voltage" value={`${formatNumber(electrical.voltage, 1)} V`} />
          <Metric label="Current" value={`${formatNumber(electrical.current, 2)} A`} />
          <Metric label="Power" value={`${formatNumber(electrical.power, 1)} W`} />
        </>
      )}
      {lab === 'battery' && (
        <>
          <Metric label="Battery" value={`${formatNumber(batteryState.charge, 0)}%`} />
          <Metric label="Active load" value={`${formatNumber(batteryPower, 1)} W`} />
          <Metric label="Time left" value={Number.isFinite(batteryLoad.hoursLeft) ? `${formatNumber(batteryLoad.hoursLeft, 1)} h` : 'no load'} />
        </>
      )}
      {lab === 'lights' && (
        <>
          <Metric label="Brightness" value={`${formatNumber(brightness, 0)}%`} />
          <Metric label="Beam" value={`${formatNumber(beamMeters, 0)} m`} />
          <Metric label="Circuit" value={lightsState.circuitClosed ? 'closed' : 'open'} />
        </>
      )}
    </div>
  );
}

function StatsPanel({ stats, batteryState, batteryLoad, lightState }) {
  return (
    <section className="side-card stats-card">
      <PanelHeader title="Live physics stats" subtitle="All values react to selected car parts." compact />
      <div className="stats-grid">
        <StatItem label="Body" value={stats.body.shortName} />
        <StatItem label="Mass" value={`${formatNumber(stats.totalMass, 0)} kg`} />
        <StatItem label="Motor" value={stats.engine.shortName} />
        <StatItem label="Power" value={`${stats.engine.powerKw} kW`} />
        <StatItem label="Force" value={`${formatNumber(stats.engine.forceN, 0)} N`} />
        <StatItem label="Acceleration" value={`${formatNumber(stats.estimatedAcceleration, 2)} m/s^2`} />
        <StatItem label="Tires" value={stats.tire.shortName} />
        <StatItem label="Biome" value={stats.road.shortName} />
        <StatItem label="Mu" value={formatNumber(stats.mu, 2)} />
        <StatItem label="Normal force" value={`${formatNumber(stats.normalForce, 0)} N`} />
        <StatItem label="Braking" value={`${formatNumber(stats.brakingDistance, 1)} m`} />
        <StatItem label="Battery" value={`${formatNumber(batteryState.charge, 0)}%`} />
      </div>
      <Meter label="Grip available" value={stats.gripPercent} />
      <Meter label="Battery stability" value={stats.battery.stability} />
      <Meter label="Light brightness" value={lightState.brightness || stats.light.brightness} />
      <p className="stats-note">
        Because the {stats.body.shortName.toLowerCase()} body has mass {formatNumber(stats.body.mass, 0)} kg, the same engine gives
        {' '}
        {formatNumber(stats.estimatedAcceleration, 2)} m/s^2 acceleration. Current electrical load is {formatNumber(batteryLoad.totalPower, 1)} W.
      </p>
    </section>
  );
}

function FormulaPanel({ formula }) {
  return (
    <section className="side-card formula-card">
      <PanelHeader title="Formula proof" subtitle={formula.principle} compact />
      <div className="formula-lines">
        {formula.lines.map((line) => (
          <code key={line}>{line}</code>
        ))}
      </div>
      <div className="variable-list">
        {formula.variables.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function TaskPanel({
  tasks,
  currentTask,
  taskIndex,
  setTaskIndex,
  taskAnswer,
  setTaskAnswer,
  checkTaskAnswer,
  showNextHint,
  hintsShown,
  taskFeedback,
  runVisualization
}) {
  if (!currentTask) {
    return (
      <section className="side-card task-card">
        <PanelHeader title="Tasks" subtitle="No task for this lab yet." compact />
      </section>
    );
  }

  return (
    <section className="side-card task-card">
      <PanelHeader title="Physics task" subtitle={`${taskIndex + 1} of ${tasks.length}`} compact />
      <select
        className="task-picker"
        value={taskIndex}
        onChange={(event) => {
          setTaskIndex(Number(event.target.value));
          setTaskAnswer('');
        }}
      >
        {tasks.map((task, index) => (
          <option key={task.id} value={index}>
            {task.title}
          </option>
        ))}
      </select>
      <h4>{currentTask.title}</h4>
      <p className="task-condition">{currentTask.condition}</p>
      <div className="task-meta">
        <div>
          <strong>Known values</strong>
          {Object.entries(currentTask.given).map(([key, value]) => (
            <span key={key}>{key}: {value}</span>
          ))}
        </div>
        <div>
          <strong>Find</strong>
          <span>{currentTask.find}</span>
          <strong>Formula</strong>
          <span>{currentTask.formula}</span>
        </div>
      </div>
      <label className="answer-input">
        <span>Your answer {currentTask.unit && `(${currentTask.unit})`}</span>
        <input value={taskAnswer} onChange={(event) => setTaskAnswer(event.target.value)} inputMode="decimal" />
      </label>
      <div className="task-actions">
        <button type="button" className="control-button primary" onClick={checkTaskAnswer}>Check answer</button>
        <button type="button" className="control-button" onClick={showNextHint}>Show hint</button>
        <button type="button" className="control-button" onClick={runVisualization}>Run proof</button>
      </div>
      {taskFeedback && <div className={`task-feedback ${taskFeedback.startsWith('Correct') ? 'good' : ''}`}>{taskFeedback}</div>}
      <div className="hint-list">
        {currentTask.hints.slice(0, hintsShown).map((hint, index) => (
          <p key={hint}><strong>Hint {index + 1}:</strong> {hint}</p>
        ))}
      </div>
      <p className="task-explanation"><strong>Explanation:</strong> {currentTask.explanation}</p>
    </section>
  );
}

function OptionSelect({ label, value, options, onChange }) {
  const selected = byId(options, value);
  return (
    <label className="field-group">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <small>{selected.note}</small>
    </label>
  );
}

function NumberField({ label, value, onChange, suffix, min, max, step = '1' }) {
  return (
    <label className="field-group number-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="segmented-group">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={value === option.id ? 'active' : ''}
            onClick={() => onChange(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function PanelHeader({ title, subtitle, compact = false }) {
  return (
    <div className={`panel-heading ${compact ? 'compact' : ''}`}>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="stat-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Meter({ label, value }) {
  const safeValue = Math.max(0, Math.min(100, safeNumber(value)));
  return (
    <div className="meter-row">
      <div>
        <span>{label}</span>
        <strong>{formatNumber(safeValue, 0)}%</strong>
      </div>
      <div className="meter-track">
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PartToken({ title, detail }) {
  return (
    <div className="part-token">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function buildFormula({
  selectedLab,
  stats,
  speedCalc,
  twoCarParams,
  relativeMotion,
  brakingParams,
  electrical,
  batteryLoad,
  lightState,
  proofValues,
  currentTask
}) {
  if (selectedLab === 'challenges' && currentTask) {
    return {
      principle: currentTask.condition,
      lines: [currentTask.formula, `correct answer = ${formatNumber(currentTask.correctAnswer)} ${currentTask.unit}`.trim()],
      variables: [`Find: ${currentTask.find}`, 'Run proof to apply the values to the car scene.']
    };
  }

  if (selectedLab === 'speed') {
    if (speedCalc.target === 'distance') {
      return {
        principle: LAB_COPY.speed.principle,
        lines: ['s = v x t', `s = ${formatNumber(speedCalc.speed)} x ${formatNumber(speedCalc.time)}`, `s = ${formatNumber(speedCalc.distance)} m`],
        variables: ['s: distance', 'v: speed', 't: time']
      };
    }

    if (speedCalc.target === 'time') {
      return {
        principle: LAB_COPY.speed.principle,
        lines: ['t = s / v', `t = ${formatNumber(speedCalc.distance)} / ${formatNumber(speedCalc.speed)}`, `t = ${formatNumber(speedCalc.time)} s`],
        variables: ['s: distance', 'v: speed', 't: time']
      };
    }

    return {
      principle: LAB_COPY.speed.principle,
      lines: ['v = s / t', `v = ${formatNumber(speedCalc.distance)} / ${formatNumber(speedCalc.time)}`, `v = ${formatNumber(speedCalc.speed)} m/s`],
      variables: ['s: distance', 'v: speed', 't: time']
    };
  }

  if (selectedLab === 'acceleration' || selectedLab === 'constructor') {
    const mass = Math.max(1, safeNumber(proofValues.mass, stats.totalMass));
    const force = Math.max(0, safeNumber(proofValues.force, stats.driveForce));
    const acceleration = force / mass;
    return {
      principle: LAB_COPY.acceleration.principle,
      lines: [
        'a = F / m',
        `a = ${formatNumber(force, 0)} N / ${formatNumber(mass, 0)} kg`,
        `a = ${formatNumber(acceleration, 2)} m/s^2`,
        `P = ${stats.engine.powerKw} kW`
      ],
      variables: ['F: effective driving force', 'm: total car mass', 'a: acceleration', 'P: motor power']
    };
  }

  if (selectedLab === 'twoCar') {
    const line =
      twoCarParams.scenario === 'same'
        ? `v_relative = |${formatNumber(twoCarParams.speedA)} - ${formatNumber(twoCarParams.speedB)}|`
        : `v_relative = ${formatNumber(twoCarParams.speedA)} + ${formatNumber(twoCarParams.speedB)}`;
    return {
      principle: LAB_COPY.twoCar.principle,
      lines: [
        twoCarParams.scenario === 'same' ? 'v_relative = |v1 - v2|' : 'v_relative = v1 + v2',
        line,
        `v_relative = ${formatNumber(relativeMotion.relativeSpeed)} m/s`,
        twoCarParams.scenario === 'toward'
          ? `t_meet = ${formatNumber(twoCarParams.initialDistance)} / ${formatNumber(relativeMotion.relativeSpeed)} = ${formatNumber(relativeMotion.meetTime)} s`
          : `final distance = ${formatNumber(relativeMotion.finalDistance)} m`
      ],
      variables: ['v1: car A speed', 'v2: car B speed', 's: distance between cars']
    };
  }

  if (selectedLab === 'friction') {
    const mass = Math.max(1, safeNumber(proofValues.mass, stats.totalMass));
    const mu = Math.max(0, safeNumber(proofValues.mu, stats.mu));
    const normalForce = mass * G;
    const frictionForce = mu * normalForce;
    return {
      principle: LAB_COPY.friction.principle,
      lines: [
        'N = m x g',
        `N = ${formatNumber(mass, 0)} x ${G}`,
        `N = ${formatNumber(normalForce, 0)} N`,
        'F_friction = mu x N',
        `F_friction = ${formatNumber(mu, 2)} x ${formatNumber(normalForce, 0)} = ${formatNumber(frictionForce, 0)} N`
      ],
      variables: ['mu: friction coefficient', 'N: normal force', 'g: 9.8 m/s^2']
    };
  }

  if (selectedLab === 'braking') {
    const initialSpeed = Math.max(0, safeNumber(proofValues.initialSpeed, brakingParams.initialSpeed));
    const mu = Math.max(0.01, safeNumber(proofValues.mu, stats.mu));
    const bodyFactor = proofValues.mu ? 1 : stats.body.brakingFactor;
    const distance = calculateBrakingDistance(initialSpeed, mu, bodyFactor);
    return {
      principle: LAB_COPY.braking.principle,
      lines: [
        'd = v^2 / (2 x mu x g)',
        `d = ${formatNumber(initialSpeed)}^2 / (2 x ${formatNumber(mu, 2)} x ${G})`,
        `d = ${formatNumber(distance, 1)} m`
      ],
      variables: ['d: braking distance', 'v: initial speed', 'mu: friction coefficient']
    };
  }

  if (selectedLab === 'electricity') {
    return {
      principle: LAB_COPY.electricity.principle,
      lines: [
        'I = U / R',
        `I = ${formatNumber(electrical.voltage)} / ${formatNumber(electrical.resistance)}`,
        `I = ${formatNumber(electrical.current, 2)} A`,
        'P = U x I',
        `P = ${formatNumber(electrical.voltage)} x ${formatNumber(electrical.current, 2)} = ${formatNumber(electrical.power, 1)} W`
      ],
      variables: ['I: current', 'U: voltage', 'R: resistance', 'P: power']
    };
  }

  if (selectedLab === 'battery') {
    const availableEnergy = Math.max(0, safeNumber(proofValues.energy, batteryLoad.availableEnergy));
    const totalPower = Math.max(0, safeNumber(proofValues.power, batteryLoad.totalPower));
    const hoursLeft = totalPower > 0 ? availableEnergy / totalPower : Infinity;
    const hours = Number.isFinite(hoursLeft) ? `${formatNumber(hoursLeft, 2)} h` : 'infinite with no load';
    return {
      principle: LAB_COPY.battery.principle,
      lines: [
        'P_total = sum of active consumers',
        `P_total = ${formatNumber(totalPower, 1)} W`,
        't = E / P',
        `t = ${formatNumber(availableEnergy, 1)} Wh / ${formatNumber(totalPower, 1)} W`,
        `t = ${hours}`
      ],
      variables: ['E: stored battery energy', 'P: power consumption', 't: working time']
    };
  }

  if (selectedLab === 'lights') {
    const proofPower = proofValues.voltage && proofValues.current ? proofValues.voltage * proofValues.current : lightState.totalPower;
    const shownPower = safeNumber(proofValues.power, proofPower);
    const shownBrightness = safeNumber(proofValues.brightness, lightState.brightness);
    const shownBeam = safeNumber(proofValues.beamMeters, lightState.beamMeters);
    return {
      principle: LAB_COPY.lights.principle,
      lines: [
        'P = U x I',
        proofValues.voltage && proofValues.current
          ? `P = ${formatNumber(proofValues.voltage)} x ${formatNumber(proofValues.current)} = ${formatNumber(shownPower, 1)} W`
          : `P_light = ${formatNumber(shownPower, 1)} W`,
        'brightness is proportional to power and available battery',
        `brightness = ${formatNumber(shownBrightness, 0)}%`,
        `beam distance = ${formatNumber(shownBeam, 0)} m`
      ],
      variables: ['P: electrical power', 'brightness: visible light intensity', 'beam: light cone distance']
    };
  }

  return {
    principle: 'Choose a lab to see its formula.',
    lines: ['Formula will appear here.'],
    variables: []
  };
}

function getValidationMessage({
  selectedLab,
  speedCalc,
  speedParams,
  twoCarParams,
  brakingParams,
  electrical,
  batteryState,
  lightsState
}) {
  if (selectedLab === 'speed') {
    if (safeNumber(speedParams.distance) < 0) return 'Distance cannot be negative.';
    if (safeNumber(speedParams.speed) < 0) return 'Speed cannot be negative.';
    if (speedCalc.invalid) return speedCalc.invalid;
  }

  if (selectedLab === 'twoCar') {
    if (safeNumber(twoCarParams.initialDistance) < 0) return 'Initial distance cannot be negative.';
    if (safeNumber(twoCarParams.simTime) < 0) return 'Simulation time cannot be negative.';
  }

  if (selectedLab === 'braking' && safeNumber(brakingParams.initialSpeed) < 0) {
    return 'Speed cannot be negative.';
  }

  if (selectedLab === 'electricity') {
    if (electrical.invalid) return electrical.invalid;
    if (safeNumber(electrical.voltage) < 0) return 'Voltage cannot be negative.';
  }

  if (selectedLab === 'battery') {
    const charge = safeNumber(batteryState.charge, 100);
    if (charge < 0 || charge > 100) return 'Battery charge must stay between 0 and 100.';
  }

  if (selectedLab === 'lights') {
    const charge = safeNumber(lightsState.batteryCharge, 100);
    if (charge < 0 || charge > 100) return 'Battery charge must stay between 0 and 100.';
  }

  return '';
}

function getSceneDuration(lab, speedCalc, twoCarParams) {
  if (lab === 'speed') return Math.max(1800, Math.min(8000, safeNumber(speedCalc.time, 5) * 260));
  if (lab === 'twoCar') return Math.max(1800, Math.min(8000, safeNumber(twoCarParams.simTime, 5) * 420));
  if (lab === 'braking') return 4200;
  if (lab === 'battery') return 6500;
  if (lab === 'lights') return 2600;
  return 3800;
}

export default CarPhysicsLab;
