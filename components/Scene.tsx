import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import ParticleText from './ParticleText';
import { useCountdown } from '../hooks/useCountdown';

const Scene: React.FC = () => {
  const { timeLeft } = useCountdown(5 * 60); 
  const groupRef = useRef<THREE.Group>(null);
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.15;
      groupRef.current.rotation.x = Math.cos(t * 0.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title: NEXT SHOW - Tenor Sans */}
      <ParticleText 
        text="NEXT SHOW" 
        fontFamily="Tenor Sans"
        size={2.0} 
        position={[0, 8, 0]} 
        density={4} 
        particleSize={0.04}
        extrusion={0.5} 
        color="#ffffff"
        speedFactor={0.5} 
      />

      {/* Main Countdown - STOPWATCH STYLE 
          - Share Tech Mono Font
          - Reduced extrusion (1.0) for cleaner look
          - High SpeedFactor (3.0) for mechanical snap
      */}
      <ParticleText 
        text={formatTime(timeLeft)} 
        fontFamily="Share Tech Mono"
        size={10} 
        position={[0, -1, 0]} 
        density={6} 
        particleSize={0.06}
        color="#E0FFFF" 
        extrusion={1.0} 
        glow={true}
        speedFactor={3.0} 
      />

      {/* Footer: MENGTIAN LIVESHOW - Tenor Sans */}
      <ParticleText 
        text="MENGTIAN LIVESHOW" 
        fontFamily="Tenor Sans"
        size={1.6} 
        position={[0, -9, 0]} 
        density={4} 
        particleSize={0.04}
        color="#999999"
        extrusion={0.4}
        speedFactor={0.5}
      />
    </group>
  );
};

export default Scene;