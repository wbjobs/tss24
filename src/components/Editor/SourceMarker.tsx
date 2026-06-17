import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Source } from '../../../shared/types';
import { COLORS } from '../../../shared/constants';

interface SourceMarkerProps {
  source: Source;
  isSelected: boolean;
  onClick: () => void;
  onDrag: (position: { x: number; y: number; z: number }) => void;
}

export function SourceMarker({ source, isSelected, onClick, onDrag }: SourceMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef(0);

  useFrame((_, delta) => {
    pulseRef.current += delta * 2;
    if (meshRef.current) {
      const scale = 1 + Math.sin(pulseRef.current) * 0.1;
      meshRef.current.scale.setScalar(isSelected ? scale * 1.2 : scale);
    }
  });

  return (
    <group position={[source.position.x, source.position.y, source.position.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.source}
          emissive={COLORS.source}
          emissiveIntensity={isSelected || hovered ? 1 : 0.5}
        />
      </mesh>
      <pointLight
        color={COLORS.source}
        intensity={isSelected ? 2 : 1}
        distance={3}
        decay={2}
      />
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial
          color={COLORS.source}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}
