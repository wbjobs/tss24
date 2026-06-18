import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SoundFieldHeatmap, Wall } from '../../../shared/types';
import { COLORS } from '../../../shared/constants';

interface HeatmapMeshProps {
  heatmap: SoundFieldHeatmap;
  wall: Wall;
  opacity?: number;
}

function HeatmapMesh({ heatmap, wall, opacity = 0.7 }: HeatmapMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { texture, geometry, position, rotation } = useMemo(() => {
    const [v0, v1, v2, v3] = wall.vertices;
    const edgeU = new THREE.Vector3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z);
    const edgeV = new THREE.Vector3(v3.x - v0.x, v3.y - v0.y, v3.z - v0.z);
    const width = edgeU.length();
    const height = edgeV.length();

    const geo = new THREE.PlaneGeometry(width, height);
    const center = new THREE.Vector3(v0.x, v0.y, v0.z)
      .add(edgeU.multiplyScalar(0.5))
      .add(edgeV.multiplyScalar(0.5));

    const normal = new THREE.Vector3(wall.normal.x, wall.normal.y, wall.normal.z);
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    const canvas = document.createElement('canvas');
    const gridU = heatmap.gridSize.u;
    const gridV = heatmap.gridSize.v;
    const texWidth = gridU * 10;
    const texHeight = gridV * 10;
    canvas.width = texWidth;
    canvas.height = texHeight;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(texWidth, texHeight);

    const energies: number[][] = [];
    let minDb = Infinity;
    let maxDb = -Infinity;

    for (let v = 0; v < gridV; v++) {
      energies[v] = [];
      for (let u = 0; u < gridU; u++) {
        const idx = v * gridU + u;
        const point = heatmap.points[idx];
        const db = point?.db ?? -120;
        energies[v][u] = db;
        if (db > maxDb) maxDb = db;
        if (db < minDb) minDb = db;
      }
    }

    for (let y = 0; y < texHeight; y++) {
      for (let x = 0; x < texWidth; x++) {
        const u = (x / texWidth) * (gridU - 1);
        const v = (y / texHeight) * (gridV - 1);
        const u0 = Math.floor(u);
        const v0 = Math.floor(v);
        const u1 = Math.min(u0 + 1, gridU - 1);
        const v1 = Math.min(v0 + 1, gridV - 1);
        const uFrac = u - u0;
        const vFrac = v - v0;

        const e00 = energies[v0]?.[u0] ?? -120;
        const e10 = energies[v0]?.[u1] ?? -120;
        const e01 = energies[v1]?.[u0] ?? -120;
        const e11 = energies[v1]?.[u1] ?? -120;

        const db = e00 * (1 - uFrac) * (1 - vFrac) +
                   e10 * uFrac * (1 - vFrac) +
                   e01 * (1 - uFrac) * vFrac +
                   e11 * uFrac * vFrac;

        const normalized = maxDb !== minDb
          ? Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))
          : 0.5;

        const color = getHeatColor(normalized);
        const pixelIdx = (y * texWidth + x) * 4;
        imageData.data[pixelIdx] = color.r;
        imageData.data[pixelIdx + 1] = color.g;
        imageData.data[pixelIdx + 2] = color.b;
        imageData.data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;

    return {
      texture: tex,
      geometry: geo,
      position: { x: center.x, y: center.y, z: center.z },
      rotation: { x: euler.x, y: euler.y, z: euler.z },
    };
  }, [heatmap, wall]);

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function getHeatColor(t: number): { r: number; g: number; b: number } {
  const colors = [
    { t: 0.0, r: 0, g: 0, b: 139 },
    { t: 0.2, r: 0, g: 100, b: 255 },
    { t: 0.4, r: 0, g: 255, b: 255 },
    { t: 0.6, r: 0, g: 255, b: 100 },
    { t: 0.8, r: 255, g: 255, b: 0 },
    { t: 1.0, r: 255, g: 50, b: 0 },
  ];

  for (let i = 0; i < colors.length - 1; i++) {
    if (t <= colors[i + 1].t) {
      const range = colors[i + 1].t - colors[i].t;
      const f = (t - colors[i].t) / range;
      return {
        r: Math.round(colors[i].r + f * (colors[i + 1].r - colors[i].r)),
        g: Math.round(colors[i].g + f * (colors[i + 1].g - colors[i].g)),
        b: Math.round(colors[i].b + f * (colors[i + 1].b - colors[i].b)),
      };
    }
  }

  return { r: 255, g: 50, b: 0 };
}

interface HeatmapContainerProps {
  heatmaps: SoundFieldHeatmap[];
  walls: Wall[];
  opacity?: number;
}

export function HeatmapContainer({ heatmaps, walls, opacity = 0.7 }: HeatmapContainerProps) {
  const wallMap = useMemo(() => {
    const map = new Map<string, Wall>();
    walls.forEach(w => map.set(w.id, w));
    return map;
  }, [walls]);

  return (
    <group>
      {heatmaps.map((heatmap) => {
        const wall = wallMap.get(heatmap.wallId);
        if (!wall) return null;
        return (
          <HeatmapMesh
            key={heatmap.wallId}
            heatmap={heatmap}
            wall={wall}
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}
