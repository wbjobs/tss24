import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RayPath } from '../../../shared/types';
import { COLORS } from '../../../shared/constants';

interface RayLinesProps {
  rays: RayPath[];
  animationTime: number;
  isPlaying: boolean;
  maxReflectionsForLOD?: number;
}

interface RayMetaData {
  ray: RayPath;
  maxTime: number;
  segmentStart: number;
  segmentCount: number;
  reflectionStartIdx: number;
  reflectionCount: number;
}

export function RayLines({ rays, animationTime, isPlaying, maxReflectionsForLOD = 5 }: RayLinesProps) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(animationTime);
  const metadataRef = useRef<RayMetaData[]>([]);
  const zeroScale = useMemo(() => {
    const m = new THREE.Matrix4();
    m.makeScale(0, 0, 0);
    return m;
  }, []);
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (isPlaying) {
      timeRef.current += delta * 50;
    }

    const currentTime = timeRef.current;
    let totalVisibleVertices = 0;
    let instanceIdx = 0;

    for (const meta of metadataRef.current) {
      const progress = Math.min(currentTime / meta.maxTime, 1);
      const visibleSegments = Math.floor(meta.segmentCount * progress);
      totalVisibleVertices += visibleSegments * 2;

      if (instancedMeshRef.current) {
        const totalPoints = meta.ray.points.length;
        for (let r = 0; r < meta.reflectionCount; r++) {
          const reflectionIdx = r + 1;
          const pointProgress = (reflectionIdx + 1) / totalPoints;
          if (progress >= pointProgress) {
            const point = meta.ray.points[reflectionIdx];
            tmpMatrix.makeTranslation(point.x, point.y, point.z);
            tmpMatrix.scale(new THREE.Vector3(0.05, 0.05, 0.05));
            instancedMeshRef.current.setMatrixAt(instanceIdx, tmpMatrix);
            const isSpecular = meta.ray.reflectionTypes[r] === 'specular';
            tmpColor.set(isSpecular ? COLORS.primary : '#FFD700');
            instancedMeshRef.current.setColorAt(instanceIdx, tmpColor);
          } else {
            instancedMeshRef.current.setMatrixAt(instanceIdx, zeroScale);
          }
          instanceIdx++;
        }
      }
    }

    if (linesRef.current) {
      linesRef.current.geometry.setDrawRange(0, totalVisibleVertices);
    }

    if (instancedMeshRef.current) {
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  const { positions, colors, reflectionTotalCount, metadata } = useMemo(() => {
    const filteredRays = rays.filter(r => r.reflectionCount <= maxReflectionsForLOD);
    const sortedRays = [...filteredRays].sort((a, b) => b.energy - a.energy);
    const displayRays = sortedRays.slice(0, 500);

    const positionsArray: number[] = [];
    const colorsArray: number[] = [];
    const meta: RayMetaData[] = [];
    let reflCount = 0;

    for (const ray of displayRays) {
      const totalDistance = calculateTotalDistance(ray.points);
      const maxTime = (totalDistance / 343) * 1000;
      const segStart = positionsArray.length / 3;
      const segCount = ray.points.length - 1;
      const reflStart = reflCount;
      const reflCnt = Math.max(0, ray.points.length - 2);
      reflCount += reflCnt;

      const colorStr = getEnergyColor(ray.energy);
      const rgb = parseRGB(colorStr);

      for (let i = 0; i < ray.points.length - 1; i++) {
        positionsArray.push(ray.points[i].x, ray.points[i].y, ray.points[i].z);
        positionsArray.push(ray.points[i + 1].x, ray.points[i + 1].y, ray.points[i + 1].z);
        const a = Math.min(ray.energy * 2, 0.8);
        colorsArray.push(rgb.r * a, rgb.g * a, rgb.b * a);
        colorsArray.push(rgb.r * a, rgb.g * a, rgb.b * a);
      }

      meta.push({ ray, maxTime, segmentStart: segStart, segmentCount: segCount, reflectionStartIdx: reflStart, reflectionCount: reflCnt });
    }

    return { positions: positionsArray, colors: colorsArray, reflectionTotalCount: reflCount, metadata: meta };
  }, [rays, maxReflectionsForLOD]);

  metadataRef.current = metadata;

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, [positions, colors]);

  return (
    <group>
      <lineSegments ref={linesRef} geometry={lineGeometry} frustumCulled={false}>
        <lineBasicMaterial vertexColors toneMapped={false} transparent opacity={1} />
      </lineSegments>
      {reflectionTotalCount > 0 && (
        <instancedMesh
          ref={instancedMeshRef}
          args={[undefined, undefined, reflectionTotalCount]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
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

function parseRGB(str: string): { r: number; g: number; b: number } {
  const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    return { r: parseInt(m[1]) / 255, g: parseInt(m[2]) / 255, b: parseInt(m[3]) / 255 };
  }
  return { r: 1, g: 1, b: 1 };
}
