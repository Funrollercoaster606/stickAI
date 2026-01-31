import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface StickFigureProps {
  isSpeaking: boolean;
  mood: 'neutral' | 'happy' | 'confused' | 'shocked';
}

const StickFigure: React.FC<StickFigureProps> = ({ isSpeaking, mood }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  // Random micro-movements state
  const targetRotation = useRef(new THREE.Vector2(0, 0));
  const currentRotation = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Floating animation (reduced height)
    groupRef.current.position.y = -2.0 + Math.sin(time * 1.5) * 0.1;

    // Speaking animation - bounce or vibrate
    if (isSpeaking) {
      const speakIntensity = Math.sin(time * 20) * 0.05;
      groupRef.current.position.y += speakIntensity;
      if (mouthRef.current) {
         mouthRef.current.scale.y = 1 + Math.sin(time * 30) * 0.8;
      }
    } else {
       if (mouthRef.current) mouthRef.current.scale.y = 0.2; // Closed mouth
    }

    // Eye movement (Look around randomly)
    if (Math.random() > 0.98) {
      targetRotation.current.set(
        (Math.random() - 0.5) * 0.5, // x look
        (Math.random() - 0.5) * 0.5  // y look
      );
    }
    
    // Smooth eye lerp
    currentRotation.current.lerp(targetRotation.current, 0.1);

    if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.rotation.y = currentRotation.current.x;
        leftEyeRef.current.rotation.x = currentRotation.current.y;
        rightEyeRef.current.rotation.y = currentRotation.current.x;
        rightEyeRef.current.rotation.x = currentRotation.current.y;
    }
  });

  // Synchronized colors: All limbs and head are black
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.5 });
  // Features (Eyes, Mouth) are white to stand out
  const featureMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.2 });

  return (
    <group ref={groupRef} position={[0, -2.0, 0]}>
      {/* Head - Now using bodyMaterial for uniform look */}
      <Sphere ref={headRef} args={[0.7, 32, 32]} position={[0, 2.8, 0]}>
        <primitive object={bodyMaterial} />
        
        {/* Face Group */}
        <group position={[0, 0, 0.6]}>
             {/* Left Eye */}
            <group ref={leftEyeRef} position={[-0.25, 0.1, 0]}>
                <Sphere args={[0.18, 32, 32]}>
                    <primitive object={featureMaterial} />
                </Sphere>
                <Sphere args={[0.08, 32, 32]} position={[0, 0, 0.15]}>
                     <primitive object={pupilMaterial} />
                </Sphere>
            </group>

            {/* Right Eye */}
            <group ref={rightEyeRef} position={[0.25, 0.1, 0]}>
                <Sphere args={[0.18, 32, 32]}>
                     <primitive object={featureMaterial} />
                </Sphere>
                 <Sphere args={[0.08, 32, 32]} position={[0, 0, 0.15]}>
                     <primitive object={pupilMaterial} />
                </Sphere>
            </group>

            {/* Mouth - Now using featureMaterial (white) to see it on black head */}
            <Sphere ref={mouthRef} args={[0.1, 16, 16]} position={[0, -0.3, 0]} scale={[1, 0.2, 0.5]}>
                <primitive object={featureMaterial} />
            </Sphere>
        </group>
      </Sphere>

      {/* Body */}
      <Cylinder ref={bodyRef} args={[0.05, 0.05, 2.5, 16]} position={[0, 1.4, 0]}>
        <primitive object={bodyMaterial} />
      </Cylinder>

      {/* Arms */}
      <group position={[0, 2.2, 0]}>
        {/* Left Arm */}
        <group rotation={[0, 0, 0.4]}>
            <Cylinder args={[0.04, 0.04, 1.8, 16]} position={[-0.9, 0, 0]} rotation={[0, 0, 1.2]}>
                <primitive object={bodyMaterial} />
            </Cylinder>
        </group>
         {/* Right Arm */}
         <group rotation={[0, 0, -0.4]}>
            <Cylinder args={[0.04, 0.04, 1.8, 16]} position={[0.9, 0, 0]} rotation={[0, 0, -1.2]}>
                <primitive object={bodyMaterial} />
            </Cylinder>
        </group>
      </group>

       {/* Legs */}
       <group position={[0, 0.2, 0]}>
        {/* Left Leg */}
            <Cylinder args={[0.05, 0.05, 1.8, 16]} position={[-0.4, -0.8, 0]} rotation={[0, 0, 0.2]}>
                <primitive object={bodyMaterial} />
            </Cylinder>
         {/* Right Leg */}
            <Cylinder args={[0.05, 0.05, 1.8, 16]} position={[0.4, -0.8, 0]} rotation={[0, 0, -0.2]}>
                <primitive object={bodyMaterial} />
            </Cylinder>
      </group>

    </group>
  );
};

export default StickFigure;