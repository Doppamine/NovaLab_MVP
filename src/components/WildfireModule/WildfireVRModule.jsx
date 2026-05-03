import React, { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Sky, Sparkles, Text } from '@react-three/drei';
import { XR, XROrigin, useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';
import {
  FUEL_MODELS,
  MODEL_REFERENCES,
  WILDFIRE_SCENARIO,
  createWildfireSimulation,
} from './wildfireModel';
import { wildfireXRStore } from './wildfireXRStore';
import './WildfireVRModule.css';

const MAX_VISIBLE_FLAMES = 130;
const CONTINUOUS_SCRUB_SECONDS_PER_SECOND = 80;
const NOTEBOOK_SPREAD_COUNT = 3;
const DRAWING_BOOK_PAGE_COUNT = 6;
const DRAWING_BOOK_BLANK_PAGE = 5;
const DRAWING_BRUSH_SIZES = [1.8, 3, 4.6, 6.2];
const DRAWING_CLEAR_HOLD_SECONDS = 0.85;
const VIEW_CLASSROOM = 'classroom';
const VIEW_LANDSCAPE = 'landscape';
const CLASSROOM_SPAWN = [0, 1.62, 5.8];
const LANDSCAPE_SPAWN = [0, 24, 76];
const CLASSROOM_WALK_SPEED = 2.25;
const LANDSCAPE_STICK_FLIGHT_SPEED = 24;
const LANDSCAPE_BUMPER_VERTICAL_SPEED = 16;
const XR_SMOOTH_TURN_SPEED = 2.35;
const HANDHELD_BOOK_SCALE = 0.115;
const HANDHELD_MAP_SCALE = 0.16;

export default function WildfireVRModule() {
  const simulation = useMemo(() => createWildfireSimulation(), []);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [result, setResult] = useState(null);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [notebookPage, setNotebookPage] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [vrView, setVrView] = useState(VIEW_LANDSCAPE);
  const [isMetricMapOpen, setIsMetricMapOpen] = useState(false);
  const estimateInputRef = useRef(null);

  const etaMinutes = simulation.houseArrivalSec / 60;
  const maxTime = simulation.houseArrivalSec + 180;
  const progress = Math.min(100, (currentTime / simulation.houseArrivalSec) * 100);
  const physicsSummary = useMemo(() => getPhysicsSummary(simulation, currentTime), [simulation, currentTime]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime((time) => {
        const nextTime = Math.min(maxTime, time + (0.1 * WILDFIRE_SCENARIO.timeScale));

        if (nextTime >= maxTime) {
          setIsRunning(false);
        }

        return nextTime;
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isRunning, maxTime]);

  const clampTime = useCallback((time) => Math.min(maxTime, Math.max(0, time)), [maxTime]);

  const handleEnterVR = async () => {
    try {
      setVrView(VIEW_CLASSROOM);
      setIsNotebookOpen(false);
      setIsMetricMapOpen(false);
      setIsAnswerRevealed(false);
      await wildfireXRStore.enterVR();
    } catch {
      window.alert('VR mode is not available in this browser or headset.');
    }
  };

  const handleSubmitEstimate = () => {
    const rawEstimate = estimateInputRef.current?.value || estimateMinutes;
    const parsed = Number.parseFloat(rawEstimate);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setResult({
        tone: 'warning',
        title: 'Enter a positive time estimate.',
        copy: 'Use minutes as the unit.',
      });
      return;
    }

    const errorMinutes = Math.abs(parsed - etaMinutes);
    const errorPercent = (errorMinutes / etaMinutes) * 100;

    if (errorPercent <= 5) {
      setResult({
        tone: 'success',
        title: 'Excellent prediction.',
        copy: `Your error is ${errorMinutes.toFixed(1)} min. Model ETA: ${etaMinutes.toFixed(1)} min.`,
      });
      return;
    }

    if (errorPercent <= 15) {
      setResult({
        tone: 'close',
        title: 'Close field estimate.',
        copy: `Your error is ${errorMinutes.toFixed(1)} min. Model ETA: ${etaMinutes.toFixed(1)} min.`,
      });
      return;
    }

    setResult({
      tone: 'warning',
      title: 'Recheck wind, slope, and moisture.',
      copy: `Your error is ${errorMinutes.toFixed(1)} min. Model ETA: ${etaMinutes.toFixed(1)} min.`,
    });
  };

  const handleReset = useCallback(() => {
    setCurrentTime(0);
    setIsRunning(false);
    setResult(null);
    setIsAnswerRevealed(false);
    setNotebookPage(0);
    setIsMetricMapOpen(false);
  }, []);

  const handleScrubTime = useCallback((deltaSeconds) => {
    setIsRunning(false);
    setCurrentTime((time) => clampTime(time + deltaSeconds));
  }, [clampTime]);

  const handleRevealAnswer = useCallback(() => {
    setIsAnswerRevealed((wasRevealed) => {
      const nextValue = !wasRevealed;

      setResult(nextValue ? {
        tone: 'success',
        title: 'Model answer revealed.',
        copy: `The simulated arrival time is ${etaMinutes.toFixed(1)} min.`,
      } : null);

      return nextValue;
    });
  }, [etaMinutes]);

  const handleToggleNotebook = useCallback(() => {
    setIsNotebookOpen((value) => !value);
  }, []);

  const handleNotebookPage = useCallback((deltaPage) => {
    setNotebookPage((page) => (page + deltaPage + NOTEBOOK_SPREAD_COUNT) % NOTEBOOK_SPREAD_COUNT);
  }, []);

  const handleEnterLandscape = useCallback(() => {
    setVrView(VIEW_LANDSCAPE);
    setIsNotebookOpen(false);
    setIsMetricMapOpen(false);
  }, []);

  const handleReturnToClassroom = useCallback(() => {
    setVrView(VIEW_CLASSROOM);
    setIsNotebookOpen(false);
    setIsMetricMapOpen(false);
    setIsAnswerRevealed(false);
  }, []);

  const handleToggleMetricMap = useCallback(() => {
    setIsMetricMapOpen((value) => !value);
  }, []);

  return (
    <div className="wildfire-vr-module">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 42, 86], fov: 58, near: 0.1, far: 600 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <XR store={wildfireXRStore}>
            <WildfireScene
              simulation={simulation}
              currentTime={currentTime}
              vrView={vrView}
              isNotebookOpen={isNotebookOpen}
              notebookPage={notebookPage}
              isAnswerRevealed={isAnswerRevealed}
              isMetricMapOpen={isMetricMapOpen}
              onToggleNotebook={handleToggleNotebook}
              onNotebookPage={handleNotebookPage}
              onEnterLandscape={handleEnterLandscape}
              onReturnToClassroom={handleReturnToClassroom}
              onToggleMetricMap={handleToggleMetricMap}
              onRevealAnswer={handleRevealAnswer}
              onScrubTime={handleScrubTime}
            />
          </XR>
        </Suspense>
      </Canvas>

      <div className="wildfire-topbar">
        <div>
          <span className="wildfire-kicker">VR wildfire physics</span>
          <strong>Fly above the forest and estimate time to the house</strong>
        </div>
        <button className="wildfire-vr-button" type="button" onClick={handleEnterVR}>
          Enter VR flight
        </button>
      </div>

      <aside className="wildfire-mission-panel" aria-label="Wildfire calculation panel">
        <section className="wildfire-panel-section">
          <span className="wildfire-section-label">Physics mission</span>
          <p className="wildfire-physics-brief">
            Find the time when the fastest fire tongue reaches the house. The useful distance is the model path,
            not a center-to-center ruler guess: {physicsSummary.metrics.totalPathDistanceM.toFixed(0)} m along fuels and terrain.
          </p>
        </section>

        <section className="wildfire-panel-section">
          <span className="wildfire-section-label">Scenario data</span>
          <div className="wildfire-data-grid">
            <Metric label="Wind" value={`${WILDFIRE_SCENARIO.windSpeedMps.toFixed(1)} m/s`} detail={`${WILDFIRE_SCENARIO.windDirectionDeg} deg`} />
            <Metric label="Slope" value={`${WILDFIRE_SCENARIO.slopePercent}%`} detail={`${WILDFIRE_SCENARIO.slopeDirectionDeg} deg`} />
            <Metric label="Moisture" value={`${Math.round(WILDFIRE_SCENARIO.fuelMoisture * 100)}%`} detail="fine fuel" />
            <Metric label="Head ROS" value={`${simulation.headFireMetrics.rateMMin.toFixed(2)} m/min`} detail="model term" />
            <Metric label="Fast path" value={`${physicsSummary.metrics.totalPathDistanceM.toFixed(0)} m`} detail={`${Math.max(0, physicsSummary.pathExtraPercent).toFixed(0)}% over direct`} />
            <Metric label="ETA" value={`${physicsSummary.etaMinutes.toFixed(1)} min`} detail={`${physicsSummary.effectivePathRateMMin.toFixed(2)} m/min path`} />
          </div>
        </section>

        <section className="wildfire-panel-section">
          <span className="wildfire-section-label">Formula set</span>
          <div className="wildfire-formula-stack">
            <code>etaM = 1 - 2.59r + 5.11r^2 - 3.52r^3</code>
            <code>R = R0 * etaM * (1 + phiW + phiS)</code>
            <code>I = H * w * R</code>
            <code>t = distance / R</code>
          </div>
        </section>

        <section className="wildfire-panel-section">
          <span className="wildfire-section-label">Fuel models</span>
          <div className="wildfire-fuel-list">
            {Object.entries(FUEL_MODELS).map(([key, fuel]) => (
              <div key={key}>
                <i style={{ background: fuel.color }}></i>
                <span>{fuel.label}</span>
                <strong>{(fuel.baseRateMps * 60).toFixed(1)} m/min</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="wildfire-panel-section">
          <span className="wildfire-section-label">Your estimate</span>
          <div className="wildfire-estimate-row">
            <input
              ref={estimateInputRef}
              aria-label="Estimated minutes until fire reaches the house"
              type="number"
              min="1"
              step="0.1"
              value={estimateMinutes}
              onInput={(event) => setEstimateMinutes(event.currentTarget.value)}
              onChange={(event) => setEstimateMinutes(event.target.value)}
              placeholder="minutes"
            />
            <button
              type="button"
              onMouseDown={handleSubmitEstimate}
              onPointerDown={handleSubmitEstimate}
              onClick={handleSubmitEstimate}
            >
              Check
            </button>
          </div>
          {result ? (
            <div className={`wildfire-result wildfire-result-${result.tone}`}>
              <strong>{result.title}</strong>
              <span>{result.copy}</span>
            </div>
          ) : null}
        </section>
      </aside>

      <div className="wildfire-timeline">
        <button type="button" onClick={() => setIsRunning((value) => !value)}>
          {isRunning ? 'Pause fire' : 'Run fire'}
        </button>
        <button type="button" onClick={handleReset}>Reset</button>
        <div className="wildfire-progress" aria-label="Fire progress to house">
          <span style={{ width: `${progress}%` }}></span>
        </div>
        <strong>{(currentTime / 60).toFixed(1)} min</strong>
      </div>

      <div className="wildfire-source-chip">
        Model basis: {MODEL_REFERENCES.map((reference) => reference.label).join(' + ')}
      </div>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="wildfire-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function WildfireScene({
  simulation,
  currentTime,
  vrView,
  isNotebookOpen,
  notebookPage,
  isAnswerRevealed,
  isMetricMapOpen,
  onToggleNotebook,
  onNotebookPage,
  onEnterLandscape,
  onReturnToClassroom,
  onToggleMetricMap,
  onRevealAnswer,
  onScrubTime,
}) {
  const isClassroom = vrView === VIEW_CLASSROOM;
  const originRef = useRef(null);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [drawingBookPage, setDrawingBookPage] = useState(0);
  const [isDrawingBookFullscreen, setIsDrawingBookFullscreen] = useState(false);

  useEffect(() => {
    if (!isScratchpadOpen) {
      setIsDrawingBookFullscreen(false);
    }
  }, [isScratchpadOpen]);

  const handleDrawingBookPage = useCallback((deltaPage) => {
    setDrawingBookPage((page) => (page + deltaPage + DRAWING_BOOK_PAGE_COUNT) % DRAWING_BOOK_PAGE_COUNT);
  }, []);

  const handleToggleDrawingBookFullscreen = useCallback(() => {
    setIsDrawingBookFullscreen((value) => !value);
  }, []);

  return (
    <>
      <color attach="background" args={[isClassroom ? '#20272c' : '#8ea7b1']} />
      <fog attach="fog" args={[isClassroom ? '#20272c' : '#98a7aa', isClassroom ? 9 : 58, isClassroom ? 30 : 265]} />
      {isClassroom ? null : <Sky sunPosition={[80, 38, 24]} turbidity={7.2} rayleigh={1.8} mieCoefficient={0.008} mieDirectionalG={0.78} />}
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#c7d9ff', '#4a3c27', 1.4]} />
      <directionalLight
        castShadow
        position={[46, 84, 30]}
        intensity={3.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <pointLight position={[-64, 12, -55]} color="#ff8a35" intensity={currentTime > 0 ? 16 : 4} distance={90} />

      <FlightRig
        originRef={originRef}
        vrView={vrView}
        isNotebookOpen={isNotebookOpen}
        isMetricMapOpen={isMetricMapOpen}
        isScratchpadOpen={isScratchpadOpen}
        drawingBookPage={drawingBookPage}
        onToggleNotebook={onToggleNotebook}
        onNotebookPage={onNotebookPage}
        onDrawingBookPage={handleDrawingBookPage}
        onEnterLandscape={onEnterLandscape}
        onReturnToClassroom={onReturnToClassroom}
        onToggleMetricMap={onToggleMetricMap}
        onSetScratchpadOpen={setIsScratchpadOpen}
        onToggleDrawingBookFullscreen={handleToggleDrawingBookFullscreen}
        onRevealAnswer={onRevealAnswer}
        onScrubTime={onScrubTime}
      />
      <DesktopCameraDirector vrView={vrView} />
      <OrbitControls makeDefault enablePan enableZoom maxPolarAngle={Math.PI * 0.48} target={isClassroom ? [0, 1.2, -1.15] : [0, 0, 0]} />
      <LeftHandDrawingBook
        simulation={simulation}
        originRef={originRef}
        isOpen={isScratchpadOpen}
        page={drawingBookPage}
        currentTime={currentTime}
        isFullscreen={isDrawingBookFullscreen}
        isAnswerRevealed={isAnswerRevealed}
      />
      {isClassroom ? (
        <ClassroomBriefing simulation={simulation} currentTime={currentTime} />
      ) : (
        <>
          <TerrainMesh simulation={simulation} />
          <BurnScarLayer simulation={simulation} currentTime={currentTime} />
          <TreesLayer simulation={simulation} currentTime={currentTime} />
          <RockLayer simulation={simulation} />
          <HouseAsset simulation={simulation} currentTime={currentTime} />
          <FireFrontLayer simulation={simulation} currentTime={currentTime} />
          <PredictionPath simulation={simulation} />
        </>
      )}
      <VRBookPanel
        simulation={simulation}
        currentTime={currentTime}
        isOpen={isNotebookOpen}
        page={notebookPage}
        originRef={originRef}
        isAnswerRevealed={isAnswerRevealed}
      />
      <MetricFireMapPanel simulation={simulation} currentTime={currentTime} isOpen={isMetricMapOpen} originRef={originRef} />
      {isClassroom ? null : <Sparkles count={120} scale={[150, 38, 150]} position={[0, 12, 0]} size={1.4} speed={0.12} color="#ffd08a" />}
    </>
  );
}

function FlightRig({
  originRef,
  vrView,
  isNotebookOpen,
  isMetricMapOpen,
  isScratchpadOpen,
  drawingBookPage,
  onToggleNotebook,
  onNotebookPage,
  onDrawingBookPage,
  onEnterLandscape,
  onReturnToClassroom,
  onToggleMetricMap,
  onSetScratchpadOpen,
  onToggleDrawingBookFullscreen,
  onRevealAnswer,
  onScrubTime,
}) {
  const pressedKeysRef = useRef(new Set());
  const previousButtonsRef = useRef({});
  const hasPlacedClassroomSpawnRef = useRef(false);
  const camera = useThree((state) => state.camera);
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');

  useEffect(() => {
    const handleKeyDown = (event) => {
      pressedKeysRef.current.add(event.code);
    };
    const handleKeyUp = (event) => {
      pressedKeysRef.current.delete(event.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta, frame) => {
    const isPresentingXR = state.gl.xr.isPresenting;
    const activeCamera = getActiveCamera(state, camera);
    const referenceSpace = wildfireXRStore.getState().originReferenceSpace || state.gl.xr.getReferenceSpace();
    const viewerPose = getViewerWorldPose(state, frame, originRef.current, referenceSpace, activeCamera);
    const keys = pressedKeysRef.current;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 34 : 18;
    const isClassroom = vrView === VIEW_CLASSROOM;
    const isLandscape = vrView === VIEW_LANDSCAPE;
    const viewDirection = viewerPose.direction;
    const forward = viewDirection.clone();
    forward.y = 0;

    if (forward.lengthSq() < 0.001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const movement = new THREE.Vector3();
    const rightTriggerValue = getControllerAnalog(rightController, 'xr-standard-trigger', [0]);
    const leftTriggerValue = getControllerAnalog(leftController, 'xr-standard-trigger', [0]);
    const triggerDelta = rightTriggerValue - leftTriggerValue;
    const rightTriggerPressed = rightTriggerValue > 0.72;
    const leftTriggerPressed = leftTriggerValue > 0.72;
    const leftBumperPressed = isControllerButtonDown(leftController, 'xr-standard-squeeze', [1], { useFallbackWhenComponentExists: true });
    const rightBumperPressed = isControllerButtonDown(rightController, 'xr-standard-squeeze', [1], { useFallbackWhenComponentExists: true });
    const aPressed = isControllerButtonDown(rightController, 'a-button', getFaceButtonFallbackIndexes(rightController, 'lower'));
    const xPressed = isControllerButtonDown(leftController, 'x-button', getFaceButtonFallbackIndexes(leftController, 'lower'));
    const yPressed = isControllerButtonDown(leftController, 'y-button', getFaceButtonFallbackIndexes(leftController, 'upper'));
    const leftStick = getThumbstick(leftController);
    const rightStick = getThumbstick(rightController);

    if (!isPresentingXR) {
      hasPlacedClassroomSpawnRef.current = false;
    } else if (isClassroom && originRef.current && !hasPlacedClassroomSpawnRef.current) {
      movePlayerTo(originRef.current, CLASSROOM_SPAWN);
      hasPlacedClassroomSpawnRef.current = true;
    }

    runButtonOnce(previousButtonsRef.current, 'a', aPressed, () => {
      if (isScratchpadOpen && drawingBookPage === DRAWING_BOOK_BLANK_PAGE) {
        onToggleDrawingBookFullscreen();
        return;
      }

      if (isScratchpadOpen) {
        return;
      }

      onSetScratchpadOpen(false);
      if (isNotebookOpen) {
        onToggleNotebook();
      }
      onToggleMetricMap();
    });
    runButtonOnce(previousButtonsRef.current, 'x', xPressed, () => {
      if (isNotebookOpen) {
        onToggleNotebook();
      }

      if (isMetricMapOpen) {
        onToggleMetricMap();
      }

      onSetScratchpadOpen((isOpen) => !isOpen);
    });
    runButtonOnce(previousButtonsRef.current, 'y', yPressed, () => {
      if (isScratchpadOpen) {
        onRevealAnswer();
        return;
      }

      if (isNotebookOpen) {
        onRevealAnswer();
        return;
      }

      if (!originRef.current) {
        return;
      }

      onSetScratchpadOpen(false);
      if (isMetricMapOpen) {
        onToggleMetricMap();
      }

      if (vrView === VIEW_LANDSCAPE) {
        movePlayerTo(originRef.current, CLASSROOM_SPAWN);
        onReturnToClassroom();
        return;
      }

      movePlayerTo(originRef.current, LANDSCAPE_SPAWN);
      onEnterLandscape();
    });
    if (isScratchpadOpen) {
      runButtonOnce(previousButtonsRef.current, 'drawing-rt-page', rightTriggerPressed, () => onDrawingBookPage(1));
      runButtonOnce(previousButtonsRef.current, 'drawing-lt-page', leftTriggerPressed, () => onDrawingBookPage(-1));
      runButtonOnce(previousButtonsRef.current, 'drawing-stick-next', rightStick.x > 0.68, () => onDrawingBookPage(1));
      runButtonOnce(previousButtonsRef.current, 'drawing-stick-prev', rightStick.x < -0.68, () => onDrawingBookPage(-1));
      runButtonOnce(previousButtonsRef.current, 'rt-page', false);
    } else if (isNotebookOpen) {
      runButtonOnce(previousButtonsRef.current, 'drawing-rt-page', false);
      runButtonOnce(previousButtonsRef.current, 'drawing-lt-page', false);
      runButtonOnce(previousButtonsRef.current, 'drawing-stick-next', false);
      runButtonOnce(previousButtonsRef.current, 'drawing-stick-prev', false);
      runButtonOnce(previousButtonsRef.current, 'rt-page', rightTriggerPressed, () => onNotebookPage(1));
    } else {
      runButtonOnce(previousButtonsRef.current, 'drawing-rt-page', false);
      runButtonOnce(previousButtonsRef.current, 'drawing-lt-page', false);
      runButtonOnce(previousButtonsRef.current, 'drawing-stick-next', false);
      runButtonOnce(previousButtonsRef.current, 'drawing-stick-prev', false);
      runButtonOnce(previousButtonsRef.current, 'rt-page', false);
    }

    if (!isNotebookOpen && !isScratchpadOpen && !isMetricMapOpen && Math.abs(triggerDelta) > 0.08) {
      onScrubTime(triggerDelta * CONTINUOUS_SCRUB_SECONDS_PER_SECOND * delta);
    }

    if (keys.has('KeyW') || keys.has('ArrowUp')) movement.add(forward);
    if (keys.has('KeyS') || keys.has('ArrowDown')) movement.sub(forward);
    if (keys.has('KeyD') || keys.has('ArrowRight')) movement.add(right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) movement.sub(right);
    if (isLandscape && (keys.has('KeyE') || keys.has('Space'))) movement.y += 1;
    if (isLandscape && (keys.has('KeyQ') || keys.has('ControlLeft'))) movement.y -= 1;

    const rightStickTurn = !isScratchpadOpen && Math.abs(rightStick.x) > 0.16 ? rightStick.x : 0;

    if (isPresentingXR && originRef.current && rightStickTurn !== 0) {
      rotateOriginAroundWorldPoint(originRef.current, viewerPose.position, -rightStickTurn * XR_SMOOTH_TURN_SPEED * delta);
    }

    const controllerMovementActive = (
      Math.abs(leftStick.x) > 0.12 ||
      Math.abs(leftStick.y) > 0.12
    );
    const target = controllerMovementActive && originRef.current ? originRef.current : camera;

    if (Math.abs(leftStick.x) > 0.12 || Math.abs(leftStick.y) > 0.12) {
      movement.add(right.clone().multiplyScalar(leftStick.x));
      movement.add((isLandscape ? viewDirection : forward).clone().multiplyScalar(-leftStick.y));
    }

    if (isLandscape && originRef.current && !isScratchpadOpen && !isMetricMapOpen && !isNotebookOpen) {
      const altitudeInput = (rightBumperPressed ? 1 : 0) - (leftBumperPressed ? 1 : 0);

      if (altitudeInput !== 0) {
        originRef.current.position.y += altitudeInput * LANDSCAPE_BUMPER_VERTICAL_SPEED * delta;
        keepPlayerInBounds(originRef.current.position);
      }
    }

    if (isClassroom) {
      movement.y = 0;
    }

    if (movement.lengthSq() > 0) {
      const movementSpeed = isClassroom ? CLASSROOM_WALK_SPEED : isPresentingXR ? LANDSCAPE_STICK_FLIGHT_SPEED : speed;

      movement.normalize().multiplyScalar(movementSpeed * delta);
      target.position.add(movement);
      if (isClassroom) {
        keepPlayerInClassroomBounds(target.position);
      } else {
        keepPlayerInBounds(target.position);
      }
    }
  });

  return <XROrigin ref={originRef} position={CLASSROOM_SPAWN} />;
}

function DesktopCameraDirector({ vrView }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (gl.xr.isPresenting) {
      return;
    }

    if (vrView === VIEW_CLASSROOM) {
      camera.position.set(0, 2.15, 5.35);
      camera.lookAt(0, 1.18, -1.08);
      return;
    }

    camera.position.set(0, 42, 86);
    camera.lookAt(0, 0, 0);
  }, [camera, gl, vrView]);

  return null;
}

function LeftHandDrawingBook({ simulation, originRef, isOpen, page, currentTime, isFullscreen, isAnswerRevealed }) {
  const groupRef = useRef(null);
  const cursorRef = useRef(null);
  const activeStrokeIndexRef = useRef(null);
  const lastPointRef = useRef(null);
  const previousButtonsRef = useRef({});
  const clearHoldRef = useRef(0);
  const camera = useThree((state) => state.camera);
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');
  const [strokes, setStrokes] = useState([]);
  const [brushIndex, setBrushIndex] = useState(1);
  const [clearProgress, setClearProgress] = useState(0);
  const physicsSummary = useMemo(() => getPhysicsSummary(simulation, currentTime), [simulation, currentTime]);
  const {
    metrics,
    etaMinutes,
    elapsedPathDistanceM,
    effectivePathRateMMin,
    moistureRatio,
    moistureFactor,
    pathExtraPercent,
    directDistanceM,
    topFuelLines,
  } = physicsSummary;
  const brushWidth = DRAWING_BRUSH_SIZES[brushIndex];
  const isBlankPage = page === DRAWING_BOOK_BLANK_PAGE;

  const appendStrokePoint = useCallback((point, width) => {
    setStrokes((previousStrokes) => {
      if (activeStrokeIndexRef.current === null) {
        activeStrokeIndexRef.current = previousStrokes.length;
        return [...previousStrokes, { points: [point], width }];
      }

      return previousStrokes.map((stroke, index) => (
        index === activeStrokeIndexRef.current ? { ...stroke, points: [...stroke.points, point] } : stroke
      ));
    });
  }, []);

  const changeBrush = useCallback((deltaBrush) => {
    setBrushIndex((index) => THREE.MathUtils.clamp(index + deltaBrush, 0, DRAWING_BRUSH_SIZES.length - 1));
  }, []);

  const clearStrokes = useCallback(() => {
    activeStrokeIndexRef.current = null;
    lastPointRef.current = null;
    setStrokes([]);
  }, []);

  useFrame((state, delta, frame) => {
    if (!groupRef.current) {
      return;
    }

    const referenceSpace = wildfireXRStore.getState().originReferenceSpace || state.gl.xr.getReferenceSpace();
    const leftPose = getControllerWorldPose(leftController, frame, originRef?.current, referenceSpace);
    const rightPose = getControllerWorldPose(rightController, frame, originRef?.current, referenceSpace);
    const cameraPose = getCameraAnchorPose(state, camera);

    if (!state.gl.xr.isPresenting || !isOpen || (!leftPose && !isFullscreen)) {
      groupRef.current.visible = false;
      activeStrokeIndexRef.current = null;
      lastPointRef.current = null;
      if (clearHoldRef.current !== 0) {
        clearHoldRef.current = 0;
        setClearProgress(0);
      }
      return;
    }

    const panelPosition = isFullscreen
      ? cameraPose.position
        .clone()
        .add(cameraPose.direction.clone().multiplyScalar(2.35))
        .add(cameraPose.up.clone().multiplyScalar(-0.08))
      : leftPose.position
        .clone()
        .add(leftPose.forward.clone().multiplyScalar(0.46))
        .add(leftPose.up.clone().multiplyScalar(0.05))
        .add(leftPose.right.clone().multiplyScalar(0.12));

    groupRef.current.visible = true;
    groupRef.current.position.copy(panelPosition);
    groupRef.current.quaternion.copy(isFullscreen ? cameraPose.quaternion : leftPose.quaternion);
    groupRef.current.scale.setScalar(isFullscreen ? 0.38 : HANDHELD_BOOK_SCALE);
    groupRef.current.updateMatrixWorld(true);

    if (!rightPose || !isBlankPage) {
      if (cursorRef.current) {
        cursorRef.current.visible = false;
      }
      activeStrokeIndexRef.current = null;
      lastPointRef.current = null;
      if (clearHoldRef.current !== 0) {
        clearHoldRef.current = 0;
        setClearProgress(0);
      }
      return;
    }

    const stylusTip = rightPose.position.clone().add(rightPose.forward.clone().multiplyScalar(0.24));
    const localTip = groupRef.current.worldToLocal(stylusTip.clone());
    const isOverPaper = localTip.x > 0.26 && localTip.x < 2.18 && localTip.y > -1.08 && localTip.y < 0.98 && Math.abs(localTip.z) < 0.58;
    const rightBumperPressed = isControllerButtonDown(rightController, 'xr-standard-squeeze', [1], { useFallbackWhenComponentExists: true });
    const leftBumperPressed = isControllerButtonDown(leftController, 'xr-standard-squeeze', [1], { useFallbackWhenComponentExists: true });
    const bPressed = isControllerButtonDown(rightController, 'b-button', getFaceButtonFallbackIndexes(rightController, 'upper'));

    runButtonOnce(previousButtonsRef.current, 'brush-down', leftBumperPressed, () => changeBrush(-1));
    runButtonOnce(previousButtonsRef.current, 'brush-up', rightBumperPressed && !isOverPaper, () => changeBrush(1));

    if (bPressed) {
      clearHoldRef.current = Math.min(DRAWING_CLEAR_HOLD_SECONDS, clearHoldRef.current + delta);
      setClearProgress(clearHoldRef.current / DRAWING_CLEAR_HOLD_SECONDS);

      if (clearHoldRef.current >= DRAWING_CLEAR_HOLD_SECONDS) {
        clearStrokes();
        clearHoldRef.current = 0;
        setClearProgress(0);
      }
    } else if (clearHoldRef.current !== 0) {
      clearHoldRef.current = 0;
      setClearProgress(0);
    }

    if (cursorRef.current) {
      cursorRef.current.visible = isOverPaper;
      cursorRef.current.position.set(
        THREE.MathUtils.clamp(localTip.x, 0.26, 2.18),
        THREE.MathUtils.clamp(localTip.y, -1.08, 0.98),
        0.25,
      );
      cursorRef.current.scale.setScalar(0.85 + (brushIndex * 0.34));
    }

    if (isOverPaper && rightBumperPressed) {
      const point = [
        THREE.MathUtils.clamp(localTip.x, 0.26, 2.18),
        THREE.MathUtils.clamp(localTip.y, -1.08, 0.98),
        0.26,
      ];
      const lastPoint = lastPointRef.current;
      const isFarEnough = !lastPoint || Math.hypot(point[0] - lastPoint[0], point[1] - lastPoint[1]) > 0.025;

      if (isFarEnough) {
        appendStrokePoint(point, brushWidth);
        lastPointRef.current = point;
      }

      return;
    }

    activeStrokeIndexRef.current = null;
    lastPointRef.current = null;
  });

  return (
    <group ref={groupRef} visible={isOpen} renderOrder={28}>
      <mesh position={[0, -0.05, -0.1]}>
        <boxGeometry args={[5.15, 3.2, 0.16]} />
        <meshStandardMaterial color="#4a2817" emissive="#120806" emissiveIntensity={0.34} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.18, 3.12, 0.2]} />
        <meshStandardMaterial color="#2b1710" emissive="#100504" emissiveIntensity={0.42} roughness={0.82} />
      </mesh>

      <mesh position={[-1.16, 0, 0.08]} rotation={[0, 0.04, 0]}>
        <boxGeometry args={[2.22, 2.96, 0.05]} />
        <meshStandardMaterial color="#fff4d7" roughness={0.82} />
      </mesh>
      <mesh position={[1.16, 0, 0.08]} rotation={[0, -0.04, 0]}>
        <boxGeometry args={[2.22, 2.96, 0.05]} />
        <meshStandardMaterial color="#fff4d7" roughness={0.82} />
      </mesh>
      <mesh position={[-0.08, 0, 0.13]} rotation={[0, 0.02, 0]}>
        <boxGeometry args={[0.08, 2.82, 0.035]} />
        <meshStandardMaterial color="#e2c78f" roughness={0.76} />
      </mesh>
      <mesh position={[0.08, 0, 0.13]} rotation={[0, -0.02, 0]}>
        <boxGeometry args={[0.08, 2.82, 0.035]} />
        <meshStandardMaterial color="#e2c78f" roughness={0.76} />
      </mesh>

      <Text position={[-2.35, 1.72, 0.18]} fontSize={0.12} color="#ffe5a3" anchorX="left" anchorY="middle" maxWidth={4.6}>
        FIELD NOTEBOOK
      </Text>
      <Text position={[-0.58, 1.72, 0.18]} fontSize={0.095} color="#eaf6ff" anchorX="center" anchorY="middle" maxWidth={1.55}>
        {`SIM ${formatSimulationClock(currentTime)}`}
      </Text>
      <Text position={[0.75, 1.72, 0.18]} fontSize={0.078} color="#ffd166" anchorX="left" anchorY="middle" maxWidth={1.85}>
        LT/RT pages | Y answer | X
      </Text>

      {page === 0 ? (
        <>
          <Text position={[-2.0, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            WHAT TO SOLVE
          </Text>
          <Text position={[-2.0, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`Unknown: T_house, the minute when the fastest fire perimeter reaches the house radius.

This is a shortest-time path problem, not a simple circle-radius problem.

Wind, slope, fuel type, and moisture change the rate in every direction.`}
          </Text>
          <Text position={[0.34, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            WORKFLOW
          </Text>
          <Text position={[0.34, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.22}>
            {`1. Open A map to see the fastest path.
2. Use pages 2-4 for formula and data.
3. Write your estimate on page 6.
4. Press Y in this book to reveal the answer.

Timer now: ${formatSimulationClock(currentTime)}`}
          </Text>
        </>
      ) : null}

      {page === 1 ? (
        <>
          <Text position={[-2.0, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            CORE MODEL
          </Text>
          <Text position={[-2.0, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`For each small terrain step:

d_i = step distance
R_i = R0 * etaM * (1 + phiW + phiS)
dt_i = d_i / R_i

Total arrival time:
T = sum(dt_i)`}
          </Text>
          <Text position={[0.34, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            WHY IT BENDS
          </Text>
          <Text position={[0.34, 0.84, 0.18]} fontSize={0.074} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`etaM = 1 - 2.59r + 5.11r^2 - 3.52r^3

phiW grows when fire moves with the wind.

phiS grows when fire moves uphill.

The solver chooses the path with the smallest total T.`}
          </Text>
        </>
      ) : null}

      {page === 2 ? (
        <>
          <Text position={[-2.0, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            GIVEN DATA
          </Text>
          <Text position={[-2.0, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`Wind:\n${WILDFIRE_SCENARIO.windSpeedMps.toFixed(1)} m/s at ${WILDFIRE_SCENARIO.windDirectionDeg} deg\n\nSlope:\n${WILDFIRE_SCENARIO.slopePercent}% toward ${WILDFIRE_SCENARIO.slopeDirectionDeg} deg\n\nFine fuel moisture:\n${Math.round(WILDFIRE_SCENARIO.fuelMoisture * 100)}%`}
            {`\n\nr = ${moistureRatio.toFixed(2)}, etaM = ${moistureFactor.toFixed(2)}`}
          </Text>
          <Text position={[0.34, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            PATH FUELS
          </Text>
          <Text position={[0.34, 0.84, 0.18]} fontSize={0.074} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`Base spread rates:
Pine litter: ${(FUEL_MODELS.pineLitter.baseRateMps * 60).toFixed(1)} m/min
Understory: ${(FUEL_MODELS.denseUnderstory.baseRateMps * 60).toFixed(1)} m/min
Dry meadow: ${(FUEL_MODELS.dryMeadow.baseRateMps * 60).toFixed(1)} m/min
Wet draw: ${(FUEL_MODELS.wetDraw.baseRateMps * 60).toFixed(1)} m/min

Fastest path mix:
${topFuelLines.join('\n')}`}
          </Text>
        </>
      ) : null}

      {page === 3 ? (
        <>
          <Text position={[-2.0, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            LIVE MEASUREMENT
          </Text>
          <Text position={[-2.0, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`Direct edge-to-house distance:\n${directDistanceM.toFixed(0)} m

Fastest time path length:\n${metrics.totalPathDistanceM.toFixed(0)} m

Path extra from terrain/fuels:\n${Math.max(0, pathExtraPercent).toFixed(0)}%

Already burned on path:\n${elapsedPathDistanceM.toFixed(0)} m`}
          </Text>
          <mesh position={[-1.18, -0.72, 0.205]}>
            <boxGeometry args={[1.45, 0.07, 0.018]} />
            <meshBasicMaterial color="#d7c59c" transparent opacity={0.48} />
          </mesh>
          <mesh position={[-1.18, -0.72, 0.22]} scale={[Math.max(metrics.pathProgressPercent / 100, 0.001), 1, 1]}>
            <boxGeometry args={[1.45, 0.07, 0.025]} />
            <meshBasicMaterial color="#e2662f" transparent opacity={0.88} />
          </mesh>
          <Text position={[0.34, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            ESTIMATE
          </Text>
          <Text position={[0.34, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`Effective path rate:
${effectivePathRateMMin.toFixed(2)} m/min

Remaining path:
${metrics.remainingPathDistanceM.toFixed(0)} m

Remaining model time:
${(metrics.remainingTimeSec / 60).toFixed(1)} min

Quick check:
time left = distance / rate`}
          </Text>
        </>
      ) : null}

      {page === 4 ? (
        <>
          <Text position={[-2.0, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            SELF-CHECK
          </Text>
          <Text position={[-2.0, 0.84, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`Use the effective path calculation:

T = path distance / effective path rate

T = ${metrics.totalPathDistanceM.toFixed(0)} m / ${effectivePathRateMMin.toFixed(2)} m/min

Acceptable student estimate:
within +/- ${(etaMinutes * 0.05).toFixed(1)} min`}
          </Text>
          <Text position={[0.34, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            ANSWER
          </Text>
          <Text position={[0.34, 0.84, 0.18]} fontSize={0.079} color={isAnswerRevealed ? '#16301c' : '#655842'} anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {isAnswerRevealed
              ? `Model arrival:
${etaMinutes.toFixed(1)} min

Timer at impact:
${formatSimulationClock(simulation.houseArrivalSec)}

At the current timer:
${(metrics.remainingTimeSec / 60).toFixed(1)} min remain.`
              : `Make your estimate first.

Press Y while this book is open to reveal the model answer here.

Hint: the A map shows the path distance and fire-front shape.`}
          </Text>
          {isAnswerRevealed ? (
            <mesh position={[1.15, -0.94, 0.22]}>
              <boxGeometry args={[1.56, 0.12, 0.025]} />
              <meshBasicMaterial color="#65c46f" transparent opacity={0.72} />
            </mesh>
          ) : null}
        </>
      ) : null}

      {isBlankPage ? (
        <>
          <Text position={[-2.0, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            BLANK SHEET
          </Text>
          <Text position={[-2.0, 0.84, 0.18]} fontSize={0.074} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
            {`RB + right hand: draw\nLB/RB off page: brush ${brushIndex + 1}/${DRAWING_BRUSH_SIZES.length}\nHold B: erase\nA: ${isFullscreen ? 'hand size' : 'fullscreen'}\nSIM ${formatSimulationClock(currentTime)}`}
          </Text>
          <mesh position={[-1.18, -0.98, 0.22]} scale={[Math.max(clearProgress, 0.001), 1, 1]}>
            <boxGeometry args={[1.15, 0.045, 0.025]} />
            <meshBasicMaterial color="#d94638" transparent opacity={0.86} />
          </mesh>
          <Text position={[0.34, 1.12, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
            NOTES
          </Text>
          {[-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78].map((y) => (
            <Line key={y} points={[[0.34, y, 0.22], [2.08, y, 0.22]]} color="#d7c59c" lineWidth={1} transparent opacity={0.64} />
          ))}
          {strokes.map((stroke, index) => (
            stroke.points.length > 1 ? (
              <Line key={`${index}-${stroke.points.length}`} points={stroke.points} color="#1d2430" lineWidth={stroke.width} />
            ) : (
              <mesh key={`${index}-${stroke.points.length}`} position={stroke.points[0]}>
                <sphereGeometry args={[0.014 + (stroke.width * 0.004), 10, 10]} />
                <meshBasicMaterial color="#1d2430" />
              </mesh>
            )
          ))}
        </>
      ) : null}

      {Array.from({ length: DRAWING_BOOK_PAGE_COUNT }).map((_, index) => (
        <mesh key={`book-tab-${index}`} position={[2.64, 1.05 - (index * 0.34), 0.18]}>
          <boxGeometry args={[0.13, 0.2, 0.05]} />
          <meshStandardMaterial color={index === page ? '#ffd166' : '#7a4a26'} emissive={index === page ? '#8f4a16' : '#140906'} emissiveIntensity={index === page ? 0.38 : 0.18} roughness={0.68} />
        </mesh>
      ))}

      <Text position={[-0.15, -1.72, 0.18]} fontSize={0.082} color="#f4c983" anchorX="center" anchorY="middle" maxWidth={2}>
        {`page ${page + 1} / ${DRAWING_BOOK_PAGE_COUNT}`}
      </Text>
      <mesh ref={cursorRef} visible={false}>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshBasicMaterial color="#20d6ff" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function runButtonOnce(memory, key, isPressed, callback) {
  if (isPressed && !memory[key]) {
    callback?.();
  }

  memory[key] = isPressed;
}

function keepPlayerInBounds(position) {
  position.x = THREE.MathUtils.clamp(position.x, -140, 140);
  position.y = THREE.MathUtils.clamp(position.y, 6, 108);
  position.z = THREE.MathUtils.clamp(position.z, -140, 140);
}

function keepPlayerInClassroomBounds(position) {
  position.x = THREE.MathUtils.clamp(position.x, -5.9, 5.9);
  position.y = CLASSROOM_SPAWN[1];
  position.z = THREE.MathUtils.clamp(position.z, -4.85, 5.65);
}

function movePlayerTo(origin, position) {
  origin.position.set(position[0], position[1], position[2]);
}

function rotateOriginAroundWorldPoint(origin, point, yawRadians) {
  const offset = origin.position.clone().sub(point).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRadians);

  origin.position.copy(point.clone().add(offset));
  origin.rotation.y += yawRadians;
}

function getActiveCamera(state, fallbackCamera) {
  return state.gl.xr.isPresenting ? state.gl.xr.getCamera() : fallbackCamera;
}

function getViewerWorldPose(state, frame, origin, referenceSpace, fallbackCamera) {
  const direction = fallbackCamera.getWorldDirection(new THREE.Vector3()).normalize();
  const position = fallbackCamera.getWorldPosition(new THREE.Vector3());

  if (!state.gl.xr.isPresenting || !frame || !referenceSpace) {
    return { position, direction };
  }

  const pose = frame.getViewerPose(referenceSpace);

  if (!pose) {
    return { position, direction };
  }

  const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);

  if (origin) {
    origin.updateMatrixWorld();
    matrix.premultiply(origin.matrixWorld);
  }

  const xrPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
  const xrDirection = new THREE.Vector3(0, 0, -1).transformDirection(matrix).normalize();

  return {
    position: xrPosition,
    direction: xrDirection,
  };
}

function getCameraAnchorPose(state, fallbackCamera) {
  const activeCamera = getActiveCamera(state, fallbackCamera);
  const poseCamera = activeCamera.cameras?.[0] || activeCamera;
  const position = activeCamera.getWorldPosition(new THREE.Vector3());
  const quaternion = poseCamera.getWorldQuaternion(new THREE.Quaternion());
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion).normalize();

  return {
    position,
    quaternion,
    direction,
    up,
  };
}

function getControllerWorldPose(controller, frame, origin, referenceSpace) {
  const controllerSpace = controller?.inputSource?.gripSpace || controller?.inputSource?.targetRaySpace;

  if (frame && controllerSpace && referenceSpace) {
    const pose = frame.getPose(controllerSpace, referenceSpace);

    if (pose) {
      const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);

      if (origin) {
        origin.updateMatrixWorld();
        matrix.premultiply(origin.matrixWorld);
      }

      return makePoseFromMatrix(matrix);
    }
  }

  if (controller?.object) {
    controller.object.updateMatrixWorld();
    return makePoseFromMatrix(controller.object.matrixWorld);
  }

  return null;
}

function makePoseFromMatrix(matrix) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  matrix.decompose(position, quaternion, scale);

  return {
    position,
    quaternion,
    forward: new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).normalize(),
    up: new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion).normalize(),
    right: new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize(),
  };
}

function TerrainMesh({ simulation }) {
  const geometry = useMemo(() => {
    const { gridCount } = simulation.scenario;
    const positions = [];
    const colors = [];
    const indices = [];
    const low = new THREE.Color('#2d442c');
    const high = new THREE.Color('#b5a46a');

    simulation.cells.forEach((cell) => {
      positions.push(cell.x, cell.height, cell.z);
      const fuelColor = new THREE.Color(FUEL_MODELS[cell.fuelKey].color);
      const elevation = THREE.MathUtils.clamp((cell.height + 11) / 24, 0, 1);
      const color = fuelColor.lerpColors(fuelColor.clone().lerp(low, 0.25), high, elevation * 0.18);
      colors.push(color.r, color.g, color.b);
    });

    for (let row = 0; row < gridCount - 1; row += 1) {
      for (let col = 0; col < gridCount - 1; col += 1) {
        const a = (row * gridCount) + col;
        const b = a + 1;
        const c = ((row + 1) * gridCount) + col;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const terrainGeometry = new THREE.BufferGeometry();
    terrainGeometry.setIndex(indices);
    terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeometry.computeVertexNormals();

    return terrainGeometry;
  }, [simulation]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0.03} />
    </mesh>
  );
}

function BurnScarLayer({ simulation, currentTime }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    simulation.cells.forEach((cell, index) => {
      const age = currentTime - simulation.arrivalTimes[cell.id];
      const isBurned = age >= 110;
      const scale = isBurned ? simulation.scenario.cellSize * 0.96 : 0.001;

      dummy.position.set(cell.x, cell.height + 0.08, cell.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(scale, scale, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [currentTime, dummy, simulation]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, simulation.cells.length]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#17100c" transparent opacity={0.48} depthWrite={false} />
    </instancedMesh>
  );
}

function TreesLayer({ simulation, currentTime }) {
  return (
    <group>
      {simulation.forestAssets.map((tree) => (
        <TreeAsset key={tree.id} tree={tree} currentTime={currentTime} />
      ))}
    </group>
  );
}

const TreeAsset = memo(function TreeAsset({ tree, currentTime }) {
  const burnAge = currentTime - tree.arrivalTime;
  const isBurning = burnAge >= 0 && burnAge < 160;
  const isCharred = burnAge >= 160;
  const trunkColor = isCharred ? '#17110e' : tree.type === 'birch' ? '#d8d0bd' : '#5a351f';
  const crownColor = isCharred ? '#211814' : tree.fuelKey === 'dryMeadow' ? '#697b35' : '#2f6232';
  const emissive = isBurning ? '#ff5d22' : '#000000';
  const crownOpacity = isCharred ? 0.72 : 1;

  return (
    <group position={[tree.x, tree.height, tree.z]} rotation={[0, tree.rotation, 0]} scale={tree.scale}>
      <mesh castShadow receiveShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 4.2, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.86} metalness={0.02} />
      </mesh>

      {tree.type === 'pine' ? (
        <>
          <mesh castShadow position={[0, 4.1, 0]}>
            <coneGeometry args={[1.35, 3.4, 9]} />
            <meshStandardMaterial color={crownColor} emissive={emissive} emissiveIntensity={isBurning ? 0.45 : 0} transparent opacity={crownOpacity} roughness={0.74} />
          </mesh>
          <mesh castShadow position={[0, 5.6, 0]} scale={[0.78, 0.78, 0.78]}>
            <coneGeometry args={[1.18, 2.8, 9]} />
            <meshStandardMaterial color={crownColor} emissive={emissive} emissiveIntensity={isBurning ? 0.55 : 0} transparent opacity={crownOpacity} roughness={0.78} />
          </mesh>
        </>
      ) : (
        <mesh castShadow position={[0, 4.6, 0]}>
          <dodecahedronGeometry args={[1.35, 1]} />
          <meshStandardMaterial color={crownColor} emissive={emissive} emissiveIntensity={isBurning ? 0.42 : 0} transparent opacity={crownOpacity} roughness={0.82} />
        </mesh>
      )}
    </group>
  );
});

function RockLayer({ simulation }) {
  return (
    <group>
      {simulation.rockAssets.map((rock) => (
        <mesh
          key={rock.id}
          castShadow
          receiveShadow
          position={[rock.x, rock.height + (0.28 * rock.scale), rock.z]}
          rotation={[0.2, rock.rotation, -0.12]}
          scale={[rock.scale * 1.4, rock.scale * 0.62, rock.scale]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#77736a" roughness={0.9} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function HouseAsset({ simulation, currentTime }) {
  const [x, z] = simulation.scenario.housePosition;
  const houseCell = simulation.cells.find((cell) => cell.id === simulation.houseCellId);
  const y = (houseCell?.height || 0) + 0.18;
  const isAtRisk = currentTime > simulation.houseArrivalSec * 0.78;
  const isReached = currentTime >= simulation.houseArrivalSec;

  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[simulation.scenario.houseRadiusM, simulation.scenario.houseRadiusM + 0.35, 96]} />
        <meshBasicMaterial color={isReached ? '#ff3322' : '#ffd166'} transparent opacity={isAtRisk ? 0.6 : 0.38} depthWrite={false} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 2.4, 0]}>
        <boxGeometry args={[9.5, 4.8, 7.2]} />
        <meshStandardMaterial color={isReached ? '#7a5142' : '#d9c6a3'} roughness={0.68} metalness={0.03} />
      </mesh>
      <GableRoof isReached={isReached} />
      <mesh castShadow position={[2.8, 6.5, -1.8]}>
        <boxGeometry args={[1, 2.3, 1]} />
        <meshStandardMaterial color="#5c4a41" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.6, -3.64]}>
        <boxGeometry args={[1.65, 2.7, 0.08]} />
        <meshStandardMaterial color="#634635" roughness={0.72} />
      </mesh>
      {[-2.6, 2.6].map((windowX) => (
        <mesh key={windowX} position={[windowX, 3.2, -3.68]}>
          <boxGeometry args={[1.55, 1.15, 0.08]} />
          <meshStandardMaterial color="#f7d98c" emissive="#f1a63d" emissiveIntensity={isReached ? 1.2 : 0.34} roughness={0.25} />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 0.18, -5.7]}>
        <boxGeometry args={[7.2, 0.36, 2.8]} />
        <meshStandardMaterial color="#8b6a4b" roughness={0.8} />
      </mesh>
      <Text position={[0, 8.6, 0]} fontSize={1.35} color="#fff4cf" anchorX="center" anchorY="middle">
        HOUSE
      </Text>
    </group>
  );
}

function GableRoof({ isReached }) {
  const geometry = useMemo(() => {
    const width = 10.4;
    const depth = 8.2;
    const height = 2.7;
    const vertices = new Float32Array([
      -width / 2, 0, -depth / 2,
      width / 2, 0, -depth / 2,
      0, height, -depth / 2,
      -width / 2, 0, depth / 2,
      width / 2, 0, depth / 2,
      0, height, depth / 2,
    ]);
    const indices = [
      0, 1, 2,
      3, 5, 4,
      0, 3, 1,
      1, 3, 4,
      0, 2, 3,
      2, 5, 3,
      1, 4, 2,
      2, 4, 5,
    ];
    const roofGeometry = new THREE.BufferGeometry();
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    roofGeometry.setIndex(indices);
    roofGeometry.computeVertexNormals();
    return roofGeometry;
  }, []);

  return (
    <mesh castShadow receiveShadow geometry={geometry} position={[0, 4.92, 0]}>
      <meshStandardMaterial color={isReached ? '#6b241b' : '#7e2f22'} roughness={0.62} metalness={0.04} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  );
}

function FireFrontLayer({ simulation, currentTime }) {
  const activeCells = useMemo(() => {
    const cells = simulation.cells.filter((cell) => {
      const age = currentTime - simulation.arrivalTimes[cell.id];
      return age >= 0 && age < 170 && ((cell.col + cell.row) % 2 === 0 || age < 35);
    });

    return cells.slice(-MAX_VISIBLE_FLAMES);
  }, [currentTime, simulation]);

  const centroid = useMemo(() => {
    if (activeCells.length === 0) {
      return null;
    }

    const sum = activeCells.reduce((acc, cell) => {
      acc.x += cell.x;
      acc.y += cell.height + 6;
      acc.z += cell.z;
      return acc;
    }, { x: 0, y: 0, z: 0 });

    return [sum.x / activeCells.length, sum.y / activeCells.length, sum.z / activeCells.length];
  }, [activeCells]);

  return (
    <group>
      {centroid ? <pointLight position={centroid} color="#ff6a21" intensity={18} distance={72} /> : null}
      {activeCells.map((cell) => (
        <FlameColumn
          key={cell.id}
          cell={cell}
          age={currentTime - simulation.arrivalTimes[cell.id]}
          seed={(cell.col * 17.17) + (cell.row * 8.31)}
        />
      ))}
    </group>
  );
}

function FlameColumn({ cell, age, seed }) {
  const groupRef = useRef(null);
  const life = THREE.MathUtils.clamp(1 - (age / 170), 0.16, 1);
  const baseScale = 0.8 + (life * 1.5);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    const flicker = 0.88 + (Math.sin((clock.elapsedTime * 8.5) + seed) * 0.12);
    groupRef.current.scale.set(baseScale * flicker, baseScale * (1 + (flicker * 0.16)), baseScale * flicker);
  });

  return (
    <group ref={groupRef} position={[cell.x, cell.height + 0.55, cell.z]}>
      <mesh position={[0, 1.15, 0]}>
        <coneGeometry args={[1.15, 3.4, 8]} />
        <meshStandardMaterial color="#ff4b1f" emissive="#ff4b1f" emissiveIntensity={1.2} transparent opacity={0.74} roughness={0.38} />
      </mesh>
      <mesh position={[0.16, 1.75, 0.12]} scale={[0.58, 0.84, 0.58]}>
        <coneGeometry args={[0.82, 3.1, 8]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffae2a" emissiveIntensity={1.6} transparent opacity={0.84} roughness={0.28} />
      </mesh>
      <mesh position={[0, 3.35, 0]} scale={[1.5, 1.7, 1.5]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#46413f" transparent opacity={0.22 * life} roughness={1} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ClassroomBriefing({ simulation, currentTime }) {
  const etaMinutes = simulation.houseArrivalSec / 60;
  const physicsSummary = useMemo(() => getPhysicsSummary(simulation, currentTime), [simulation, currentTime]);

  return (
    <group>
      <pointLight position={[0, 4.2, 1.5]} intensity={22} distance={13} color="#ffe5b8" />
      <pointLight position={[-4.8, 2.6, -2.2]} intensity={5} distance={8} color="#9fd7ff" />

      <mesh receiveShadow position={[0, -0.04, 0]}>
        <boxGeometry args={[14, 0.08, 12]} />
        <meshStandardMaterial color="#5b624f" roughness={0.86} />
      </mesh>
      <mesh receiveShadow position={[0, 2.35, -6.05]}>
        <boxGeometry args={[14, 4.8, 0.16]} />
        <meshStandardMaterial color="#d8d0bd" roughness={0.82} />
      </mesh>
      <mesh receiveShadow position={[0, 2.35, 6.05]}>
        <boxGeometry args={[14, 4.8, 0.16]} />
        <meshStandardMaterial color="#d2c7b8" roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.88, 5.94]}>
        <boxGeometry args={[3.2, 2.55, 0.08]} />
        <meshStandardMaterial color="#9d886b" roughness={0.78} />
      </mesh>
      <mesh position={[4.6, 2.75, 5.92]}>
        <boxGeometry args={[2.2, 1.25, 0.08]} />
        <meshStandardMaterial color="#b9d6e2" emissive="#396175" emissiveIntensity={0.16} roughness={0.42} />
      </mesh>
      <mesh receiveShadow position={[-7.05, 2.35, 0]}>
        <boxGeometry args={[0.16, 4.8, 12]} />
        <meshStandardMaterial color="#c8d1c7" roughness={0.82} />
      </mesh>
      <mesh receiveShadow position={[7.05, 2.35, 0]}>
        <boxGeometry args={[0.16, 4.8, 12]} />
        <meshStandardMaterial color="#c8d1c7" roughness={0.82} />
      </mesh>
      <mesh position={[0, 4.72, 0]}>
        <boxGeometry args={[14.2, 0.16, 12.2]} />
        <meshStandardMaterial color="#ece5d6" roughness={0.78} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.74, -1.2]}>
        <boxGeometry args={[6.6, 0.12, 4.6]} />
        <meshStandardMaterial color="#7a5432" roughness={0.74} />
      </mesh>
      {[-2.85, 2.85].map((x) => (
        [-1.95, 1.55].map((z) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.38, z - 1.2]}>
            <boxGeometry args={[0.18, 0.8, 0.18]} />
            <meshStandardMaterial color="#5b3b22" roughness={0.8} />
          </mesh>
        ))
      ))}

      <ClassroomMiniMap simulation={simulation} currentTime={currentTime} />

      <mesh position={[0, 2.45, -5.94]}>
        <boxGeometry args={[7.8, 2.55, 0.08]} />
        <meshStandardMaterial color="#24352d" roughness={0.7} metalness={0.04} />
      </mesh>
      <Text position={[-3.65, 3.45, -5.86]} fontSize={0.18} color="#f4f0d7" anchorX="left" anchorY="top" maxWidth={7.05} lineHeight={1.16}>
        {`WILDFIRE ARRIVAL TASK
Estimate how long it takes for the fire to reach the house.

Known data: wind ${WILDFIRE_SCENARIO.windSpeedMps.toFixed(1)} m/s at ${WILDFIRE_SCENARIO.windDirectionDeg} deg, slope ${WILDFIRE_SCENARIO.slopePercent}% at ${WILDFIRE_SCENARIO.slopeDirectionDeg} deg, fuel moisture ${Math.round(WILDFIRE_SCENARIO.fuelMoisture * 100)}%.

Use: etaM = 1 - 2.59r + 5.11r^2 - 3.52r^3
R = R0 * etaM * (1 + phiW + phiS)
t = path distance / spread rate

Fastest path: ${physicsSummary.metrics.totalPathDistanceM.toFixed(0)} m, ${Math.max(0, physicsSummary.pathExtraPercent).toFixed(0)}% longer than the direct edge-to-house line.
Effective path rate: ${physicsSummary.effectivePathRateMMin.toFixed(2)} m/min.
Solver ETA: ${etaMinutes.toFixed(1)} min.`}
      </Text>

      <mesh position={[3.95, 1.5, 1.75]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[2.6, 1.55, 0.08]} />
        <meshStandardMaterial color="#162029" roughness={0.6} emissive="#071018" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[2.9, 2.1, 1.36]} rotation={[0, -0.4, 0]} fontSize={0.081} color="#fff1b8" anchorX="left" anchorY="top" maxWidth={2.15} lineHeight={1.12}>
        {`VR controls
Left stick: walk / fly
Right stick: turn view
Y: switch class / landscape
RB: climb
LB: descend
A: open metric fire map
X: open physics notebook

Inside landscape:
RT/LT: scrub time when hands are free

Inside notebook:
RT/LT: pages
Y: reveal answer
Page 6: RB draws, LB/RB changes brush, hold B erases`}
      </Text>

      <Text position={[-2.9, 1.16, 1.45]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.13} color="#fff4cf" anchorX="left" anchorY="middle" maxWidth={5.8}>
        Table map: terrain height, fuels, ignition zone, fastest arrival path, house target.
      </Text>
    </group>
  );
}

function ClassroomMiniMap({ simulation, currentTime }) {
  return (
    <group position={[0, 1.34, -1.08]}>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[6.08, 0.09, 4.06]} />
        <meshStandardMaterial color="#2d2a20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[6.25, 0.035, 4.22]} />
        <meshStandardMaterial color="#9a7245" emissive="#2f1a0b" emissiveIntensity={0.18} roughness={0.68} />
      </mesh>
      <group scale={[0.031, 0.01, 0.031]} position={[0, 0.32, 0]} rotation={[0, 0, 0]}>
        <TerrainMesh simulation={simulation} />
        <BurnScarLayer simulation={simulation} currentTime={currentTime} />
        <HouseAsset simulation={simulation} currentTime={currentTime} />
        <FireFrontLayer simulation={simulation} currentTime={currentTime} />
        <PredictionPath simulation={simulation} />
      </group>
    </group>
  );
}

function PredictionPath({ simulation }) {
  const cellById = useMemo(() => new Map(simulation.cells.map((cell) => [cell.id, cell])), [simulation]);
  const points = useMemo(() => simulation.pathCellIds.map((cellId) => {
    const cell = cellById.get(cellId);
    return [cell.x, cell.height + 0.55, cell.z];
  }), [cellById, simulation.pathCellIds]);
  const ignition = simulation.scenario.ignitionPosition;
  const house = simulation.scenario.housePosition;
  const ignitionHeight = simulation.cells.find((cell) => cell.id === simulation.ignitionCellIds[0])?.height || 0;

  return (
    <group>
      <Line points={points} color="#ffe08a" lineWidth={3} transparent opacity={0.78} />
      <Line
        points={[
          [ignition[0], ignitionHeight + 0.4, ignition[1]],
          [house[0], 2.2, house[1]],
        ]}
        color="#ffffff"
        lineWidth={1}
        transparent
        opacity={0.35}
      />
      <mesh position={[ignition[0], ignitionHeight + 0.3, ignition[1]]}>
        <cylinderGeometry args={[simulation.scenario.ignitionRadiusM, simulation.scenario.ignitionRadiusM, 0.16, 48]} />
        <meshStandardMaterial color="#ff5a21" emissive="#ff5a21" emissiveIntensity={0.28} transparent opacity={0.46} />
      </mesh>
      <Text position={[ignition[0], ignitionHeight + 8, ignition[1]]} fontSize={1.1} color="#ffd1a1" anchorX="center" anchorY="middle">
        IGNITION
      </Text>
    </group>
  );
}

function VRBookPanel({ simulation, currentTime, isOpen, page, originRef, isAnswerRevealed }) {
  const groupRef = useRef(null);
  const turningPageRef = useRef(null);
  const lastPageRef = useRef(page);
  const turnProgressRef = useRef(1);
  const turnDirectionRef = useRef(1);
  const camera = useThree((state) => state.camera);
  const rightController = useXRInputSourceState('controller', 'right');
  const spreads = getNotebookSpreads(simulation, currentTime);
  const spread = spreads[page] || spreads[0];
  const etaMinutes = simulation.houseArrivalSec / 60;

  useEffect(() => {
    if (page === lastPageRef.current) {
      return;
    }

    const rawDelta = page - lastPageRef.current;
    turnDirectionRef.current = rawDelta < 0 || rawDelta > 1 ? -1 : 1;
    turnProgressRef.current = 0;
    lastPageRef.current = page;
  }, [page]);

  useFrame((state, delta, frame) => {
    if (!groupRef.current) {
      return;
    }

    const referenceSpace = wildfireXRStore.getState().originReferenceSpace || state.gl.xr.getReferenceSpace();
    const rightHandPose = getControllerWorldPose(rightController, frame, originRef?.current, referenceSpace);
    const isHandheld = Boolean(rightHandPose && state.gl.xr.isPresenting);
    const cameraPose = getCameraAnchorPose(state, camera);
    const panelPosition = isHandheld
      ? rightHandPose.position
        .clone()
        .add(rightHandPose.forward.clone().multiplyScalar(0.46))
        .add(rightHandPose.up.clone().multiplyScalar(0.05))
        .add(rightHandPose.right.clone().multiplyScalar(-0.12))
      : cameraPose.position
        .clone()
        .add(cameraPose.direction.clone().multiplyScalar(5.1))
        .add(cameraPose.up.clone().multiplyScalar(-0.18));

    groupRef.current.position.copy(panelPosition);
    groupRef.current.quaternion.copy(isHandheld ? rightHandPose.quaternion : cameraPose.quaternion);
    groupRef.current.scale.setScalar(isHandheld ? HANDHELD_BOOK_SCALE : 1.02);

    if (!isOpen) {
      return;
    }

    if (turningPageRef.current) {
      turnProgressRef.current = Math.min(1, turnProgressRef.current + (delta * 4.2));
      const eased = 1 - ((1 - turnProgressRef.current) ** 3);
      const from = turnDirectionRef.current > 0 ? -0.12 : -Math.PI + 0.12;
      const to = turnDirectionRef.current > 0 ? -Math.PI + 0.12 : -0.12;
      turningPageRef.current.visible = turnProgressRef.current < 1;
      turningPageRef.current.rotation.y = THREE.MathUtils.lerp(from, to, eased);
    }
  });

  return (
    <group ref={groupRef} visible={isOpen} renderOrder={20}>
      <mesh position={[0, -0.05, -0.1]}>
        <boxGeometry args={[5.15, 3.2, 0.16]} />
        <meshStandardMaterial color="#4a2817" emissive="#120806" emissiveIntensity={0.34} roughness={0.78} />
      </mesh>

      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.18, 3.12, 0.2]} />
        <meshStandardMaterial color="#2b1710" emissive="#100504" emissiveIntensity={0.42} roughness={0.82} />
      </mesh>

      <BookPageSide side="left" title={spread.leftTitle} copy={spread.leftCopy} />
      <BookPageSide side="right" title={spread.rightTitle} copy={spread.rightCopy} />

      {isAnswerRevealed ? (
        <group position={[0, -1.08, 0.28]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[4.52, 0.55, 0.08]} />
            <meshStandardMaterial color="#13251a" emissive="#092013" emissiveIntensity={0.55} roughness={0.72} transparent opacity={0.97} />
          </mesh>
          <mesh position={[-2.08, 0, 0.03]}>
            <boxGeometry args={[0.08, 0.46, 0.04]} />
            <meshStandardMaterial color="#94ffb6" emissive="#1b9b50" emissiveIntensity={0.85} roughness={0.42} />
          </mesh>
          <Text position={[-1.94, 0.12, 0.08]} fontSize={0.082} color="#94ffb6" anchorX="left" anchorY="middle" maxWidth={4.0}>
            MODEL ANSWER
          </Text>
          <Text position={[-1.94, -0.09, 0.08]} fontSize={0.085} color="#fffdf0" anchorX="left" anchorY="middle" maxWidth={4.0}>
            {`Arrival time: ${etaMinutes.toFixed(1)} min. Head rate: ${simulation.headFireMetrics.rateMMin.toFixed(2)} m/min.`}
          </Text>
        </group>
      ) : null}

      <group ref={turningPageRef} position={[0, 0, 0.15]}>
        <mesh position={[1.08, 0, 0]}>
          <planeGeometry args={[2.16, 2.86]} />
          <meshStandardMaterial color="#fff1c9" roughness={0.72} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[1.98, 0.08, 0.02]}>
          <boxGeometry args={[0.03, 2.52, 0.02]} />
          <meshStandardMaterial color="#c8a96c" roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[-2.62, 0, 0.1]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[0.08, 2.96, 0.12]} />
        <meshStandardMaterial color="#7a4a26" roughness={0.78} />
      </mesh>
      <mesh position={[2.62, 0, 0.1]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.08, 2.96, 0.12]} />
        <meshStandardMaterial color="#7a4a26" roughness={0.78} />
      </mesh>

      <Text position={[-2.35, 1.72, 0.18]} fontSize={0.12} color="#ffe5a3" anchorX="left" anchorY="middle" maxWidth={4.6}>
        FIELD BOOK
      </Text>
      <Text position={[-0.72, 1.72, 0.18]} fontSize={0.095} color="#eaf6ff" anchorX="center" anchorY="middle" maxWidth={1.35}>
        {`SIM ${formatSimulationClock(currentTime)}`}
      </Text>
      <Text position={[0.7, 1.72, 0.18]} fontSize={0.078} color="#ffd166" anchorX="left" anchorY="middle" maxWidth={1.75}>
        A close | RT page | Y answer
      </Text>
      <Text position={[-0.15, -1.72, 0.18]} fontSize={0.082} color="#f4c983" anchorX="center" anchorY="middle" maxWidth={2}>
        {`spread ${page + 1} / ${NOTEBOOK_SPREAD_COUNT}`}
      </Text>
    </group>
  );
}

function BookPageSide({ side, title, copy }) {
  const isLeft = side === 'left';
  const x = isLeft ? -1.16 : 1.16;
  const rotationY = isLeft ? 0.04 : -0.04;
  const innerX = isLeft ? -1.95 : 0.32;

  return (
    <group>
      <mesh position={[x, 0, 0.08]} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[2.22, 2.96, 0.05]} />
        <meshStandardMaterial color="#fff4d7" roughness={0.82} />
      </mesh>
      <mesh position={[isLeft ? -0.08 : 0.08, 0, 0.13]} rotation={[0, rotationY * 0.55, 0]}>
        <boxGeometry args={[0.08, 2.82, 0.035]} />
        <meshStandardMaterial color="#e2c78f" roughness={0.76} />
      </mesh>
      <Text position={[innerX, 1.15, 0.18]} fontSize={0.13} color="#4b2616" anchorX="left" anchorY="top" maxWidth={1.62}>
        {title}
      </Text>
      <Text position={[innerX, 0.9, 0.18]} fontSize={0.078} color="#1d1a15" anchorX="left" anchorY="top" maxWidth={1.62} lineHeight={1.24}>
        {copy}
      </Text>
    </group>
  );
}

function MetricFireMapPanel({ simulation, currentTime, isOpen, originRef }) {
  const groupRef = useRef(null);
  const camera = useThree((state) => state.camera);
  const rightController = useXRInputSourceState('controller', 'right');
  const metrics = useMemo(() => getFireMetricSnapshot(simulation, currentTime), [simulation, currentTime]);

  useFrame((state, _delta, frame) => {
    if (!groupRef.current) {
      return;
    }

    const referenceSpace = wildfireXRStore.getState().originReferenceSpace || state.gl.xr.getReferenceSpace();
    const rightHandPose = getControllerWorldPose(rightController, frame, originRef?.current, referenceSpace);
    const isHandheld = Boolean(rightHandPose && state.gl.xr.isPresenting);
    const cameraPose = getCameraAnchorPose(state, camera);
    const panelPosition = isHandheld
      ? rightHandPose.position
        .clone()
        .add(rightHandPose.forward.clone().multiplyScalar(0.62))
        .add(rightHandPose.up.clone().multiplyScalar(0.1))
        .add(rightHandPose.right.clone().multiplyScalar(-0.12))
      : cameraPose.position
        .clone()
        .add(cameraPose.direction.clone().multiplyScalar(5.2))
        .add(cameraPose.up.clone().multiplyScalar(-0.18));

    groupRef.current.position.copy(panelPosition);
    groupRef.current.quaternion.copy(isHandheld ? rightHandPose.quaternion : cameraPose.quaternion);
    groupRef.current.scale.setScalar(isHandheld ? HANDHELD_MAP_SCALE : 1.16);
  });

  return (
    <group ref={groupRef} visible={isOpen} renderOrder={24}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[5.9, 3.25, 0.1]} />
        <meshStandardMaterial color="#111b1f" emissive="#061016" emissiveIntensity={0.48} roughness={0.74} transparent opacity={0.97} />
      </mesh>
      <mesh position={[-1.72, -0.15, 0.04]}>
        <boxGeometry args={[2.65, 2.45, 0.05]} />
        <meshStandardMaterial color="#26342f" roughness={0.78} />
      </mesh>
      <MetricMapMiniature simulation={simulation} currentTime={currentTime} metrics={metrics} />

      <Text position={[-2.68, 1.36, 0.1]} fontSize={0.13} color="#fff4cf" anchorX="left" anchorY="middle" maxWidth={5.2}>
        FIRE METRIC MAP
      </Text>
      <Text position={[1.18, 1.36, 0.1]} fontSize={0.105} color="#eaf6ff" anchorX="left" anchorY="middle" maxWidth={1.55}>
        {`SIM ${formatSimulationClock(currentTime)}`}
      </Text>
      <Text position={[0.05, 1.08, 0.1]} fontSize={0.09} color="#cfefff" anchorX="left" anchorY="top" maxWidth={2.7} lineHeight={1.2}>
        {`Current sim time: ${formatSimulationClock(currentTime)}
Distance along fastest path: ${metrics.totalPathDistanceM.toFixed(0)} m
Remaining path to house: ${metrics.remainingPathDistanceM.toFixed(0)} m
Remaining time estimate: ${(metrics.remainingTimeSec / 60).toFixed(1)} min

Fire front shape:
active width ${metrics.fireWidthM.toFixed(0)} m
active depth ${metrics.fireDepthM.toFixed(0)} m
path progress ${metrics.pathProgressPercent.toFixed(0)}%

Why shape matters:
The front is elongated by wind and slope. The house is threatened when the fastest tongue of the perimeter reaches the defensible-space cells, not when the average radius arrives.`}
      </Text>
      <Text position={[-2.85, -1.42, 0.1]} fontSize={0.075} color="#ffd166" anchorX="left" anchorY="middle" maxWidth={5.4}>
        A close | Yellow line: fastest path | Orange ring: active fire-front shape | White dot: house
      </Text>
    </group>
  );
}

function MetricMapMiniature({ simulation, metrics }) {
  const scale = 0.0118;
  const ignition = simulation.scenario.ignitionPosition;
  const house = simulation.scenario.housePosition;
  const pathPoints = metrics.pathPoints.map((point) => [point.x * scale, point.z * scale, 0.08]);

  return (
    <group position={[-1.72, -0.18, 0.09]}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.35, 2.15]} />
        <meshBasicMaterial color="#1b2c25" transparent opacity={0.92} />
      </mesh>
      <Line points={pathPoints} color="#ffe08a" lineWidth={3} transparent opacity={0.86} />
      <mesh position={[metrics.fireCenterX * scale, metrics.fireCenterZ * scale, 0.09]} scale={[Math.max(metrics.fireWidthM * scale * 0.5, 0.12), Math.max(metrics.fireDepthM * scale * 0.5, 0.12), 1]}>
        <ringGeometry args={[0.72, 1, 64]} />
        <meshBasicMaterial color="#ff6a21" transparent opacity={0.78} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[ignition[0] * scale, ignition[1] * scale, 0.12]}>
        <circleGeometry args={[0.075, 24]} />
        <meshBasicMaterial color="#ff4b1f" />
      </mesh>
      <mesh position={[house[0] * scale, house[1] * scale, 0.12]}>
        <circleGeometry args={[0.082, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Text position={[-1.1, 1.0, 0.12]} fontSize={0.07} color="#c9ffe0" anchorX="left" anchorY="middle" maxWidth={1.8}>
        {`progress ${metrics.pathProgressPercent.toFixed(0)}%`}
      </Text>
    </group>
  );
}

function getNotebookSpreads(simulation, currentTime) {
  const simClock = formatSimulationClock(currentTime);

  return [
    {
      leftTitle: 'MISSION',
      leftCopy: `Simulation timer: ${simClock}\n\nFly above the burn area and predict when the fire front reaches the house.\n\nHouse distance is solved through the fastest spread path, not a straight ruler guess.`,
      rightTitle: 'FIELD DATA',
      rightCopy: `Wind: ${WILDFIRE_SCENARIO.windSpeedMps.toFixed(1)} m/s at ${WILDFIRE_SCENARIO.windDirectionDeg} deg\nSlope: ${WILDFIRE_SCENARIO.slopePercent}% at ${WILDFIRE_SCENARIO.slopeDirectionDeg} deg\nFine-fuel moisture: ${Math.round(WILDFIRE_SCENARIO.fuelMoisture * 100)}%\nHead spread: ${simulation.headFireMetrics.rateMMin.toFixed(2)} m/min`,
    },
    {
      leftTitle: 'FORMULAS',
      leftCopy: 'etaM = 1 - 2.59r + 5.11r^2 - 3.52r^3\n\nR = R0 * etaM * (1 + phiW + phiS)\n\nI = H * w * R\n\nt = distance / R',
      rightTitle: 'FUEL RATES',
      rightCopy: `Pine litter: ${(FUEL_MODELS.pineLitter.baseRateMps * 60).toFixed(1)} m/min\nDense understory: ${(FUEL_MODELS.denseUnderstory.baseRateMps * 60).toFixed(1)} m/min\nDry meadow: ${(FUEL_MODELS.dryMeadow.baseRateMps * 60).toFixed(1)} m/min\nWet draw: ${(FUEL_MODELS.wetDraw.baseRateMps * 60).toFixed(1)} m/min\nCleared grass: ${(FUEL_MODELS.defensibleSpace.baseRateMps * 60).toFixed(1)} m/min`,
    },
    {
      leftTitle: 'HOW TO SOLVE',
      leftCopy: '1. Read wind and slope arrows.\n2. Inspect fuel colors around the path.\n3. Use R for the active fuel and modifiers.\n4. Divide spread distance by rate.\n5. Compare your estimate with Y only when ready.',
      rightTitle: 'VR CONTROLS',
      rightCopy: 'Left stick: walk in class and fly in the landscape.\nRight stick: turn the view.\nLB/RB: descend / climb.\n\nA: open metric map\nX: open the drawing book\nRT: draw in the drawing book\nY with book closed: switch classroom / landscape\nRT/LT with hands free: scrub simulation time',
    },
  ];
}

function getPhysicsSummary(simulation, currentTime) {
  const metrics = getFireMetricSnapshot(simulation, currentTime);
  const etaMinutes = simulation.houseArrivalSec / 60;
  const elapsedPathDistanceM = Math.max(0, metrics.totalPathDistanceM - metrics.remainingPathDistanceM);
  const effectivePathRateMMin = etaMinutes > 0 ? metrics.totalPathDistanceM / etaMinutes : 0;
  const [houseX, houseZ] = simulation.scenario.housePosition;
  const [ignitionX, ignitionZ] = simulation.scenario.ignitionPosition;
  const centerDistanceM = Math.hypot(houseX - ignitionX, houseZ - ignitionZ);
  const directDistanceM = Math.max(
    1,
    centerDistanceM - simulation.scenario.ignitionRadiusM - simulation.scenario.houseRadiusM,
  );
  const pathExtraPercent = directDistanceM > 0 ? ((metrics.totalPathDistanceM / directDistanceM) - 1) * 100 : 0;
  const referenceFuel = FUEL_MODELS.denseUnderstory;
  const moistureRatio = Math.min(1, Math.max(0, WILDFIRE_SCENARIO.fuelMoisture / referenceFuel.extinctionMoisture));
  const moistureFactor = Math.min(
    1,
    Math.max(0.05, 1 - (2.59 * moistureRatio) + (5.11 * moistureRatio ** 2) - (3.52 * moistureRatio ** 3)),
  );

  return {
    metrics,
    etaMinutes,
    elapsedPathDistanceM,
    effectivePathRateMMin,
    directDistanceM,
    pathExtraPercent,
    moistureRatio,
    moistureFactor,
    topFuelLines: getPathFuelLines(simulation),
  };
}

function getPathFuelLines(simulation) {
  const cellById = new Map(simulation.cells.map((cell) => [cell.id, cell]));
  const fuelCounts = simulation.pathCellIds.reduce((counts, cellId) => {
    const fuelKey = cellById.get(cellId)?.fuelKey;

    if (!fuelKey) {
      return counts;
    }

    counts.set(fuelKey, (counts.get(fuelKey) || 0) + 1);
    return counts;
  }, new Map());
  const total = Math.max(1, simulation.pathCellIds.length);
  const lines = [...fuelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([fuelKey, count]) => `${FUEL_MODELS[fuelKey].label}: ${Math.round((count / total) * 100)}%`);

  return lines.length > 0 ? lines : ['No path data yet'];
}

function getFireMetricSnapshot(simulation, currentTime) {
  const cellById = new Map(simulation.cells.map((cell) => [cell.id, cell]));
  const pathPoints = simulation.pathCellIds
    .map((cellId) => cellById.get(cellId))
    .filter(Boolean);
  const segmentDistances = [];
  let totalPathDistanceM = 0;
  let distanceToCurrentFrontM = 0;
  let reachedPathIndex = 0;

  for (let index = 1; index < pathPoints.length; index += 1) {
    const distance = distanceBetweenPathPoints(pathPoints[index - 1], pathPoints[index]);
    segmentDistances.push(distance);
    totalPathDistanceM += distance;

    if (simulation.arrivalTimes[pathPoints[index].id] <= currentTime) {
      reachedPathIndex = index;
      distanceToCurrentFrontM += distance;
    }
  }

  const activeCells = simulation.cells.filter((cell) => {
    const age = currentTime - simulation.arrivalTimes[cell.id];
    return age >= 0 && age < 170;
  });
  const shapeCells = activeCells.length > 0
    ? activeCells
    : simulation.ignitionCellIds.map((cellId) => cellById.get(cellId)).filter(Boolean);
  const bounds = shapeCells.reduce((acc, cell) => ({
    minX: Math.min(acc.minX, cell.x),
    maxX: Math.max(acc.maxX, cell.x),
    minZ: Math.min(acc.minZ, cell.z),
    maxZ: Math.max(acc.maxZ, cell.z),
  }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
  const hasBounds = Number.isFinite(bounds.minX);
  const fireWidthM = hasBounds ? Math.max(8, bounds.maxX - bounds.minX + simulation.scenario.cellSize) : simulation.scenario.ignitionRadiusM * 2;
  const fireDepthM = hasBounds ? Math.max(8, bounds.maxZ - bounds.minZ + simulation.scenario.cellSize) : simulation.scenario.ignitionRadiusM * 2;
  const remainingPathDistanceM = Math.max(0, totalPathDistanceM - distanceToCurrentFrontM);
  const remainingTimeSec = Math.max(0, simulation.houseArrivalSec - currentTime);

  return {
    pathPoints,
    totalPathDistanceM,
    remainingPathDistanceM,
    remainingTimeSec,
    reachedPathIndex,
    pathProgressPercent: totalPathDistanceM > 0 ? (distanceToCurrentFrontM / totalPathDistanceM) * 100 : 0,
    fireWidthM,
    fireDepthM,
    fireCenterX: hasBounds ? (bounds.minX + bounds.maxX) / 2 : simulation.scenario.ignitionPosition[0],
    fireCenterZ: hasBounds ? (bounds.minZ + bounds.maxZ) / 2 : simulation.scenario.ignitionPosition[1],
  };
}

function distanceBetweenPathPoints(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function formatSimulationClock(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainderSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;
}

function isControllerButtonDown(controller, componentId, fallbackButtonIndexes = [], options = {}) {
  const component = controller?.gamepad?.[componentId];

  if (component && (component.state === 'pressed' || (component.button ?? 0) > 0.82)) {
    return true;
  }

  const buttons = controller?.inputSource?.gamepad?.buttons;

  if (!buttons || (component && !options.useFallbackWhenComponentExists)) {
    return false;
  }

  return fallbackButtonIndexes.some((index) => buttons[index]?.pressed || buttons[index]?.value > 0.82);
}

function getControllerAnalog(controller, componentId, fallbackButtonIndexes = []) {
  const component = controller?.gamepad?.[componentId];
  const componentValue = component?.button || 0;

  const buttons = controller?.inputSource?.gamepad?.buttons;

  if (!buttons) {
    return componentValue;
  }

  return fallbackButtonIndexes.reduce((max, index) => Math.max(max, buttons[index]?.value || 0), componentValue);
}

function getFaceButtonFallbackIndexes(controller, slot) {
  const buttonCount = controller?.inputSource?.gamepad?.buttons?.length || 0;

  if (buttonCount >= 6) {
    return slot === 'upper' ? [5] : [4];
  }

  return slot === 'upper' ? [4] : [3];
}

function getThumbstick(controller) {
  const thumbstick = controller?.gamepad?.['xr-standard-thumbstick'];

  if (thumbstick) {
    return {
      x: thumbstick.xAxis || 0,
      y: thumbstick.yAxis || 0,
    };
  }

  const rawGamepad = controller?.inputSource?.gamepad;

  if (!rawGamepad || !rawGamepad.axes) {
    return { x: 0, y: 0 };
  }

  if (rawGamepad.axes.length >= 4) {
    return { x: rawGamepad.axes[2] || 0, y: rawGamepad.axes[3] || 0 };
  }

  if (rawGamepad.axes.length >= 2) {
    return { x: rawGamepad.axes[0] || 0, y: rawGamepad.axes[1] || 0 };
  }

  return { x: 0, y: 0 };
}
