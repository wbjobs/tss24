import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Receiver } from '../../../shared/types';
import { COLORS } from '../../../shared/constants';

interface ReceiverMarkerProps {
  receiver: Receiver;
  isSelected: boolean;
  onClick: () => void;
  onDrag: (position: { x: number; y: number; z: number }) => void;
}

export function ReceiverMarker({ receiver, isSelected, onClick, onDrag }: ReceiverMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const rotateRef = useRef(0);

  useFrame((_, delta) => {
    rotateRef.current += delta * 0.5;
    if (meshRef.current) {
      meshRef.current.rotation.y = rotateRef.current;
    }
  });

  return (
    <group position={[receiver.position.x, receiver.position.y, receiver.position.z]}>
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
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color={COLORS.receiver}
          emissive={COLORS.receiver}
          emissiveIntensity={isSelected || hovered ? 0.8 : 0.3}
        />
      </mesh>
      <pointLight
        color={COLORS.receiver}
        intensity={isSelected ? 1.5 : 0.5}
        distance={2}
        decay={2}
      />
      <mesh>
        <sphereGeometry args={[receiver.radius, 16, 16]} />
        <meshBasicMaterial
          color={COLORS.receiver}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </group>
  );
}
