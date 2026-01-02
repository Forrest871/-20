import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleTextProps {
  text: string;
  size?: number; 
  position?: [number, number, number];
  density?: number; 
  particleSize?: number;
  color?: string;
  glow?: boolean;
  extrusion?: number; 
  fontFamily?: string;
  speedFactor?: number; // Controls how fast particles snap to new positions
}

const ParticleText: React.FC<ParticleTextProps> = ({
  text,
  size = 5,
  position = [0, 0, 0],
  density = 2,
  particleSize = 0.1,
  color = '#ffffff',
  glow = false,
  extrusion = 0.5,
  fontFamily = 'Tenor Sans',
  speedFactor = 1.0
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const targetColorsRef = useRef<Float32Array | null>(null);
  
  // Increased buffer to 600,000 to ensure long strings (like the footer) are never cut off
  const MAX_PARTICLES = 600000;

  const { positions, randomOffsets, initialColors } = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const rand = new Float32Array(MAX_PARTICLES * 3);
    const cols = new Float32Array(MAX_PARTICLES * 3);
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;

      rand[i * 3] = Math.random(); 
      rand[i * 3 + 1] = Math.random(); 
      rand[i * 3 + 2] = Math.random();

      cols[i * 3] = 0;
      cols[i * 3 + 1] = 0;
      cols[i * 3 + 2] = 0;
    }
    return { positions: pos, randomOffsets: rand, initialColors: cols };
  }, []);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use a high resolution canvas
    const fontSize = 200; 
    // Default weight 400 for Tenor Sans, 900 for Share Tech Mono if needed, but standardizing here
    const fontStr = `${fontSize}px "${fontFamily}"`;

    ctx.font = fontStr;
    const measurements = ctx.measureText(text);
    const width = Math.ceil(measurements.width);
    const height = Math.ceil(fontSize * 1.2); 

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.font = fontStr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const collectedPoints: number[] = [];
    const collectedColors: number[] = [];

    const baseColor = new THREE.Color(color);
    
    // Improved Density Logic:
    const step = Math.max(1, Math.floor(6 / density));
    
    const scale = size / (fontSize * 0.7);

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 128) { 
          const posX = (x - width / 2) * scale;
          const posY = -(y - height / 2) * scale;
          
          // 1. Front Face
          collectedPoints.push(posX, posY, extrusion / 2);
          collectedColors.push(baseColor.r, baseColor.g, baseColor.b);

          // 2. Back Face
          collectedPoints.push(posX, posY, -extrusion / 2);
          collectedColors.push(baseColor.r * 0.4, baseColor.g * 0.4, baseColor.b * 0.4);

          // 3. Volumetric Fill
          // More particles for blockier fonts
          const internalCount = density > 4 ? 3 : 2; 
          for (let k = 0; k < internalCount; k++) {
            const z = (Math.random() - 0.5) * extrusion;
            collectedPoints.push(posX, posY, z);
            const shade = 0.5 + Math.random() * 0.5; 
            collectedColors.push(baseColor.r * shade, baseColor.g * shade, baseColor.b * shade);
          }
        }
      }
    }

    const pointCount = collectedPoints.length / 3;
    const newTargets = new Float32Array(MAX_PARTICLES * 3);
    const newColors = new Float32Array(MAX_PARTICLES * 3);

    if (pointCount > MAX_PARTICLES) {
      console.warn(`Particle overflow! Needed ${pointCount}, max ${MAX_PARTICLES}. Text: "${text}" might be clipped.`);
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < pointCount) {
        newTargets[i * 3] = collectedPoints[i * 3];
        newTargets[i * 3 + 1] = collectedPoints[i * 3 + 1];
        newTargets[i * 3 + 2] = collectedPoints[i * 3 + 2];
        
        newColors[i * 3] = collectedColors[i * 3];
        newColors[i * 3 + 1] = collectedColors[i * 3 + 1];
        newColors[i * 3 + 2] = collectedColors[i * 3 + 2];
      } else {
        // Hide unused
        newTargets[i * 3] = (Math.random() - 0.5) * size * 20;
        newTargets[i * 3 + 1] = (Math.random() - 0.5) * size * 20;
        newTargets[i * 3 + 2] = -500; 
        
        newColors[i * 3] = 0;
        newColors[i * 3 + 1] = 0;
        newColors[i * 3 + 2] = 0;
      }
    }
    
    targetPositionsRef.current = newTargets;
    targetColorsRef.current = newColors;

  }, [text, size, density, extrusion, color, fontFamily]);

  useFrame((state) => {
    if (!pointsRef.current || !targetPositionsRef.current || !targetColorsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionsAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colorsAttr = geometry.attributes.color as THREE.BufferAttribute;
    
    const currentPositions = positionsAttr.array as Float32Array;
    const currentColors = colorsAttr.array as Float32Array;
    
    const targets = targetPositionsRef.current;
    const targetColors = targetColorsRef.current;
    
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const idx = i * 3;
      
      const tx = targets[idx];
      const ty = targets[idx + 1];
      const tz = targets[idx + 2];
      const tCr = targetColors[idx];

      // Skip processing for hidden particles
      if (tz < -400) {
        if (currentPositions[idx+2] > -400) {
            currentPositions[idx] = tx;
            currentPositions[idx+1] = ty;
            currentPositions[idx+2] = tz;
            currentColors[idx] = 0;
            currentColors[idx+1] = 0;
            currentColors[idx+2] = 0;
        }
        continue;
      }

      const cx = currentPositions[idx];
      const cy = currentPositions[idx + 1];
      const cz = currentPositions[idx + 2];

      const isActive = tCr > 0.01;

      // SPEED LOGIC:
      // High speedFactor means we want a "Stopwatch" effect (snappy, mechanical).
      // Low speedFactor means we want a fluid, floaty effect.
      
      const isHighSpeed = speedFactor > 1.5;

      const baseSpeed = isHighSpeed ? 0.3 : 0.08; 
      const speed = baseSpeed + randomOffsets[idx] * 0.05 * speedFactor; 
      
      // If high speed (stopwatch), reduce noise to almost zero for clean mechanical movement.
      const noiseAmp = isActive ? (isHighSpeed ? 0.001 : 0.005) : 0.0; 
      
      const noiseX = Math.sin(time * 5 + randomOffsets[idx + 1] * 10) * noiseAmp;
      const noiseY = Math.cos(time * 4 + randomOffsets[idx + 2] * 10) * noiseAmp;
      
      currentPositions[idx] += (tx - cx) * speed + noiseX;
      currentPositions[idx + 1] += (ty - cy) * speed + noiseY;
      currentPositions[idx + 2] += (tz - cz) * speed;

      const cCr = currentColors[idx];
      const cCg = currentColors[idx+1];
      const cCb = currentColors[idx+2];
      
      const tCg = targetColors[idx+1];
      const tCb = targetColors[idx+2];

      const colorSpeed = 0.1 * speedFactor;
      currentColors[idx] += (tCr - cCr) * colorSpeed;
      currentColors[idx + 1] += (tCg - cCg) * colorSpeed;
      currentColors[idx + 2] += (tCb - cCb) * colorSpeed;
    }

    positionsAttr.needsUpdate = true;
    colorsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_PARTICLES}
          array={initialColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        vertexColors
        transparent
        opacity={glow ? 1.0 : 0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleText;