import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Scene from './components/Scene';

// Automatic Camera Rig for cinematic movement
// "Front fixed shot" base with slow left-right sway
const CameraRig: React.FC = () => {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Config:
    const swaySpeed = 0.25;  // Slow, majestic speed
    const swayRangeX = 20;   // Left/Right range
    const swayRangeY = 5;    // Subtle Up/Down float
    const baseDistance = 50; // Distance from center

    // Calculate position
    // Primarily moves left and right (X), with slight depth adjustment (Z) to form a subtle arc
    state.camera.position.x = Math.sin(t * swaySpeed) * swayRangeX;
    state.camera.position.y = Math.sin(t * swaySpeed * 0.8) * swayRangeY;
    state.camera.position.z = baseDistance + Math.cos(t * swaySpeed) * 5; 
    
    // Always look at the center of the scene
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

const App: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const font1 = new FontFaceObserver('Tenor Sans');
        const font2 = new FontFaceObserver('Share Tech Mono');
        await Promise.all([font1.load(), font2.load()]);
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Font loading timeout or error, proceeding anyway.", e);
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  return (
    <div className="w-full h-full bg-black relative">
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, stencil: false, depth: true }}>
          <color attach="background" args={['#000000']} />
          {/* Fog helps blend the 3D text into the deep black void */}
          <fog attach="fog" args={['#000000', 30, 90]} />
          
          <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={45} />
          
          <Suspense fallback={null}>
            {fontsLoaded && <Scene />}
          </Suspense>
          
          {/* Automatic camera movement instead of manual OrbitControls */}
          <CameraRig />
        </Canvas>
      </div>
      
      {!fontsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-50">
          <p className="animate-pulse tracking-widest font-mono text-xl">INITIALIZING SYSTEM...</p>
        </div>
      )}
    </div>
  );
};

class FontFaceObserver {
  fontName: string;
  constructor(fontName: string) {
    this.fontName = fontName;
  }
  async load(timeout = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (document.fonts.check(`12px "${this.fontName}"`)) {
        return true;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    // If timeout, just return true to not block the app, font might swap in later
    return true; 
  }
}

export default App;