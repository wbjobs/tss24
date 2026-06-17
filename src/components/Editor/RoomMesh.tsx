import { useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Wall } from '../../../shared/types';
import { COLORS } from '../../../shared/constants';

interface RoomMeshProps {
  walls: Wall[];
  selectedWallId: string | null;
  onWallClick: (wallId: string) => void;
}

export function RoomMesh({ walls, selectedWallId, onWallClick }: RoomMeshProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const wallMeshes = useMemo(() => {
    return walls.map((wall) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        wall.vertices[0].x, wall.vertices[0].y, wall.vertices[0].z,
        wall.vertices[1].x, wall.vertices[1].y, wall.vertices[1].z,
        wall.vertices[2].x, wall.vertices[2].y, wall.vertices[2].z,
        wall.vertices[0].x, wall.vertices[0].y, wall.vertices[0].z,
        wall.vertices[2].x, wall.vertices[2].y, wall.vertices[2].z,
        wall.vertices[3].x, wall.vertices[3].y, wall.vertices[3].z,
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();

      const edgeGeometry = new THREE.EdgesGeometry(geometry);

      const isSelected = wall.id === selectedWallId;

      return {
        id: wall.id,
        geometry,
        edgeGeometry,
        isSelected,
        material: wall.material,
        wall,
      };
    });
  }, [walls, selectedWallId]);

  return (
    <group ref={groupRef}>
      {wallMeshes.map(({ id, geometry, edgeGeometry, isSelected, wall }) => (
        <group key={id}>
          <mesh
            geometry={geometry}
            onClick={(e) => {
              e.stopPropagation();
              onWallClick(id);
            }}
          >
            <meshStandardMaterial
              color={isSelected ? COLORS.primary : COLORS.wall}
              transparent
              opacity={isSelected ? 0.3 : 0.1}
              side={THREE.DoubleSide}
              emissive={isSelected ? COLORS.primary : '#000000'}
              emissiveIntensity={isSelected ? 0.2 : 0}
            />
          </mesh>
          <lineSegments geometry={edgeGeometry}>
            <lineBasicMaterial
              color={isSelected ? COLORS.primary : COLORS.wallEdge}
              transparent
              opacity={0.8}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
