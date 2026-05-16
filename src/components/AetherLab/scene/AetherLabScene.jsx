import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, OrbitControls, Sparkles, Stars, Text } from '@react-three/drei';
import { XR } from '@react-three/xr';
import * as THREE from 'three';
import { getDamageProfile } from '../systems/DamageSystem';
import { MATERIAL_LIBRARY, getWireVisualProfile } from '../systems/WireSystem';
import { useAetherLabStore } from '../store/useAetherLabStore';
import { aetherXRStore } from './aetherXRStore';

function AetherIsland({ island, accent }) {
  return (
    <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.18}>
      <group position={island.position}>
        <mesh castShadow receiveShadow scale={island.scale}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#13223d" emissive={accent} emissiveIntensity={0.14} roughness={0.9} metalness={0.18} />
        </mesh>
        <mesh position={[0, 0.45, 0]} scale={[island.scale[0] * 0.68, 0.08, island.scale[2] * 0.68]}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial color="#1f355b" emissive={accent} emissiveIntensity={0.08} transparent opacity={0.92} />
        </mesh>
      </group>
    </Float>
  );
}

function CurrentPulse({ curve, color, offset = 0 }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }

    const t = (clock.elapsedTime * 0.35 + offset) % 1;
    const point = curve.getPointAt(t);
    ref.current.position.copy(point);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function WireFaultGlyph({ curve, label, color }) {
  const anchor = curve.getPointAt(0.5);
  const position = [anchor.x, anchor.y + 0.45, anchor.z];

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text position={[0, 0.28, 0]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function AetherWire({ wire, fromNode, toNode, analysis, environmentColor, xrayEnabled }) {
  const setHoveredEntity = useAetherLabStore((state) => state.setHoveredEntity);
  const selectEntity = useAetherLabStore((state) => state.selectEntity);
  const applyToolToEntity = useAetherLabStore((state) => state.applyToolToEntity);
  const activeToolId = useAetherLabStore((state) => state.activeToolId);
  const selectedEntity = useAetherLabStore((state) => state.selectedEntity);

  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(...fromNode.position),
      ...wire.curve.map((point) => new THREE.Vector3(...point)),
      new THREE.Vector3(...toNode.position),
    ];
    return new THREE.CatmullRomCurve3(points);
  }, [fromNode.position, toNode.position, wire.curve]);

  const tubeArgs = useMemo(() => [curve, 56, selectedEntity?.id === wire.id ? 0.18 : 0.12, 10, false], [curve, selectedEntity?.id, wire.id]);
  const linePoints = useMemo(() => curve.getPoints(42).map((point) => [point.x, point.y, point.z]), [curve]);
  const damageProfile = useMemo(() => getDamageProfile(wire, { xrayEnabled }), [wire, xrayEnabled]);
  const visual = getWireVisualProfile(wire, analysis, xrayEnabled);
  const material = MATERIAL_LIBRARY[wire.material] ?? MATERIAL_LIBRARY.copper;

  const color = visual.isOverloaded ? '#ff5874' : visual.isActive ? environmentColor : material.color;
  const emissiveIntensity = visual.isActive ? 0.6 : 0.14;
  const showInternal = xrayEnabled || wire.state.xrayRevealed;

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={(event) => {
          event.stopPropagation();
          setHoveredEntity({ type: 'wire', id: wire.id });
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHoveredEntity(null);
        }}
        onClick={(event) => {
          event.stopPropagation();
          selectEntity({ type: 'wire', id: wire.id });
          applyToolToEntity('wire', wire.id);
        }}
      >
        <tubeGeometry args={tubeArgs} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transmission={0.12}
          transparent
          opacity={visual.opacity}
          roughness={0.32}
          metalness={0.72}
          clearcoat={0.7}
        />
      </mesh>

      {visual.isActive && (
        <>
          <CurrentPulse curve={curve} color={environmentColor} offset={0.08} />
          <CurrentPulse curve={curve} color="#ffffff" offset={0.42} />
          <CurrentPulse curve={curve} color={environmentColor} offset={0.74} />
        </>
      )}

      {showInternal && damageProfile.internal.length > 0 && (
        <Line
          points={linePoints}
          color="#ff7d7d"
          lineWidth={1.4}
          transparent
          opacity={0.7}
        />
      )}

      {damageProfile.external.length > 0 && (
        <WireFaultGlyph curve={curve} label="EXT" color="#ffb55f" />
      )}

      {showInternal && damageProfile.internal.length > 0 && (
        <WireFaultGlyph curve={curve} label="INT" color="#ff6f7d" />
      )}

      {selectedEntity?.id === wire.id && (
        <Html position={[curve.getPointAt(0.5).x, curve.getPointAt(0.5).y + 0.8, curve.getPointAt(0.5).z]} center distanceFactor={14}>
          <div className="aether-scene-tooltip">
            <strong>{wire.label}</strong>
            <span>{wire.material}</span>
            <span>Tool: {activeToolId}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function AetherNode({ node, analysis, accent }) {
  const setHoveredEntity = useAetherLabStore((state) => state.setHoveredEntity);
  const selectEntity = useAetherLabStore((state) => state.selectEntity);
  const applyToolToEntity = useAetherLabStore((state) => state.applyToolToEntity);
  const selectedEntity = useAetherLabStore((state) => state.selectedEntity);

  const isSelected = selectedEntity?.id === node.id;
  const isReachable = analysis.reachableNodeIds.includes(node.id);
  const isActive = analysis.activeNodeIds.includes(node.id);
  const gateState = analysis.gateStates[node.id];

  const colorByKind = {
    source: '#8ff6ff',
    junction: '#6da4ff',
    target: '#ffd67d',
    sequenceRelay: node.state.latched ? '#83ffb5' : '#ffb84d',
    gate: gateState?.open ? '#8dffa3' : '#ff7285',
    inverterPad: '#f49cff',
    transformerPad: '#ffbf76',
    converterPad: '#b88fff',
    dynamicNode: '#76f7cf',
  };

  const color = isActive ? accent : colorByKind[node.kind] ?? '#7fd5ff';
  const scale = isSelected ? 1.2 : isReachable ? 1.08 : 1;

  return (
    <group position={node.position}>
      <mesh
        castShadow
        scale={scale}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHoveredEntity({ type: 'node', id: node.id });
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHoveredEntity(null);
        }}
        onClick={(event) => {
          event.stopPropagation();
          selectEntity({ type: 'node', id: node.id });
          applyToolToEntity('node', node.id);
        }}
      >
        <octahedronGeometry args={[0.48, 0]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.7 : 0.22}
          transmission={0.24}
          transparent
          opacity={0.96}
          roughness={0.22}
          metalness={0.46}
        />
      </mesh>

      <pointLight color={color} intensity={isActive ? 5 : 2.2} distance={isActive ? 9 : 5.2} />

      <Text position={[0, 0.86, 0]} fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle">
        {node.label}
      </Text>

      {node.kind === 'sequenceRelay' && (
        <Text position={[0, -0.8, 0]} fontSize={0.16} color={node.state.latched ? '#8effbc' : '#ffc16f'} anchorX="center" anchorY="middle">
          {node.state.latched ? 'LATCHED' : `STEP ${node.sequenceIndex}`}
        </Text>
      )}
    </group>
  );
}

function ReactiveVoid({ level, analysis }) {
  const advanceSimulation = useAetherLabStore((state) => state.advanceSimulation);

  useFrame((state, delta) => {
    advanceSimulation(delta);

    const intensity = analysis.success ? 0.6 : analysis.failureReasons.length ? 0.32 : 0.18;
    state.gl.toneMappingExposure = THREE.MathUtils.lerp(state.gl.toneMappingExposure, 1 + intensity, 0.06);
  });

  return (
    <>
      <color attach="background" args={[level.environment.fogColor]} />
      <fogExp2 attach="fog" args={[level.environment.fogColor, 0.045]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#74e7ff', '#081224', 1.2]} />
      <directionalLight position={[12, 18, 8]} intensity={2.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[0, 10, 0]} color={level.environment.accent} intensity={7} distance={28} />
      <Stars radius={80} depth={35} count={2500} factor={3.4} saturation={0.9} fade speed={0.7} />
      <Sparkles count={60} scale={[25, 12, 25]} size={2.4} speed={0.24} color={level.environment.currentColor} />
    </>
  );
}

function AetherWorld() {
  const level = useAetherLabStore((state) => state.level);
  const analysis = useAetherLabStore((state) => state.analysis);

  const nodeMap = useMemo(
    () =>
      level.nodes.reduce((accumulator, node) => {
        accumulator[node.id] = node;
        return accumulator;
      }, {}),
    [level.nodes],
  );

  return (
    <>
      <ReactiveVoid level={level} analysis={analysis} />
      <group position={[0, -2.4, 0]}>
        {level.environment.islands.map((island) => (
          <AetherIsland key={island.id} island={island} accent={level.environment.accent} />
        ))}
      </group>

      {level.wires.map((wire) => (
        <AetherWire
          key={wire.id}
          wire={wire}
          fromNode={nodeMap[wire.from]}
          toNode={nodeMap[wire.to]}
          analysis={analysis}
          environmentColor={level.environment.currentColor}
          xrayEnabled={level.xrayEnabled}
        />
      ))}

      {level.nodes.map((node) => (
        <AetherNode key={node.id} node={node} analysis={analysis} accent={level.environment.currentColor} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.55, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color="#081120" transparent opacity={0.32} />
      </mesh>
    </>
  );
}

export default function AetherLabScene() {
  return (
    <div className="aether-scene-root">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 7.5, 17], fov: 44 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <XR store={aetherXRStore}>
            <AetherWorld />
          </XR>
        </Suspense>
        <OrbitControls enableDamping dampingFactor={0.06} minDistance={8} maxDistance={26} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
    </div>
  );
}
