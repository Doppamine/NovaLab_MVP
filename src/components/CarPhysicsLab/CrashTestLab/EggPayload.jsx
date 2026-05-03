import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';

export default function EggPayload({ isSafe, simulationState, position = [0, 1.5, 0] }) {
  // Wobble animation if it survives the crash
  const { wobble } = useSpring({
    from: { wobble: 0 },
    to: { 
      wobble: simulationState === 'finished' && isSafe ? 1 : 0 
    },
    config: { mass: 1, tension: 500, friction: 10 }
  });

  // Egg is hidden if it's finished and NOT safe (meaning it splattered)
  const isVisible = !(simulationState === 'finished' && !isSafe);

  if (!isVisible) return null;

  return (
    <animated.group 
      position={position}
      rotation-z={wobble.to(w => Math.sin(w * Math.PI * 4) * 0.2)}
      rotation-x={wobble.to(w => Math.sin(w * Math.PI * 3) * 0.1)}
    >
      {/* The Egg */}
      <mesh scale={[0.5, 0.65, 0.5]} position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#fffbeb" roughness={0.4} />
      </mesh>

      {/* Straps holding the egg */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.05, 0.05, 0.05]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 1.05]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {/* Base mounting plate */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
    </animated.group>
  );
}
