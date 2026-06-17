import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RayPath } from '../../../shared/types';
import { COLORS } from '../../../shared/constants';

interface RayLinesProps {
  rays: RayPath[];
  animationTime: number;
  isPlaying: boolean;
}

export function RayLines({ rays, animationTime, isPlaying }: RayLinesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(animationTime);

  useFrame((_, delta) => {
    if (isPlaying) {
      timeRef.current += delta * 50;
    }
  });

  const rayGeometries = useMemo(() => {
    return rays.map((ray) => {
      const positions: number[] = [];
      for (let i = 0; i < ray.points.length; i++) {
        positions.push(ray.points[i].x, ray.points[i].y, ray.points[i].z);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      const totalDistance = calculateTotalDistance(ray.points);
      const maxTime = (totalDistance / 343) * 1000;

      const energyColor = getEnergyColor(ray.energy);
      const reflectionColor = getReflectionCount(ray.reflectionCount);

      return {
        id: ray.id,
        geometry,
        ray,
        maxTime,
        energyColor,
        reflectionColor,
        totalDistance,
      };
    });
  }, [rays]);

  return (
    <group ref={groupRef}>
      {rayGeometries.map(({ id, geometry, ray, maxTime, energyColor }) => {
        const currentTime = timeRef.current;
        const progress = Math.min(currentTime / maxTime, 1);

        const visiblePoints = Math.floor(ray.points.length * progress);
        const totalPoints = ray.points.length;

        if (visiblePoints < 2) return null;

        const drawRange = {
          start: 0,
          count: visiblePoints * 3,
        };

        return (
          <group key={id}>
            <lineSegments geometry={geometry}>
              <lineBasicMaterial
                color={energyColor}
                transparent
                opacity={Math.min(ray.energy * 2, 0.8)}
              />
            </lineSegments>
            {ray.points.slice(1, -1).map((point, i) => (
              <mesh
                key={`reflection-${id}-${i}`}
                position={[point.x, point.y, point.z]}
                visible={progress > (i + 1) / totalPoints}
              >
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial
                  color={ray.reflectionTypes[i] === 'specular' ? COLORS.primary : '#FFD700'}
                />
              </mesh>
            ))}
            {progress >= 1 && (
              <mesh
                position={[ray.points[ray.points.length - 1].x, ray.points[ray.points.length - 1].y, ray.points[ray.points.length - 1].z]}
              >
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color={COLORS.receiver} transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function calculateTotalDistance(points: { x: number; y: number; z: number }[]): number {
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dz = points[i].z - points[i - 1].z;
    distance += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return distance;
}

function getEnergyColor(energy: number): string {
  const normalizedEnergy = Math.min(energy * 10, 1);
  const r = Math.floor(255 * normalizedEnergy);
  const g = Math.floor(212 * normalizedEnergy);
  const b = Math.floor(255 * (1 - normalizedEnergy * 0.5));
  return `rgb(${r}, ${g}, ${b})`;
}

function getReflectionCount(count: number): string {
  const colors = ['#00D4FF', '#00E676', '#FFD700', '#FF6B35', '#FF4081', '#E040FB'];
  return colors[Math.min(count, colors.length - 1)];
}
