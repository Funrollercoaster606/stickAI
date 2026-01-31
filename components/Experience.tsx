import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import StickFigure from './StickFigure';

interface ExperienceProps {
  isSpeaking: boolean;
}

const Experience: React.FC<ExperienceProps> = ({ isSpeaking }) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 12], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <StickFigure isSpeaking={isSpeaking} mood={isSpeaking ? 'happy' : 'neutral'} />
        
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default Experience;