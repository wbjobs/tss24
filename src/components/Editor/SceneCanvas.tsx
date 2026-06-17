import { useRef, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { RoomMesh } from './RoomMesh';
import { SourceMarker } from './SourceMarker';
import { ReceiverMarker } from './ReceiverMarker';
import { RayLines } from './RayLines';
import { useEditorStore } from '../../store/useEditorStore';
import { COLORS } from '../../../shared/constants';
import type { Point3D } from '../../../shared/types';

function SceneContent() {
  const {
    room,
    sources,
    receivers,
    selectedId,
    selectedType,
    toolMode,
    simulationResult,
    isPlayingAnimation,
    animationTime,
    setSelected,
    addSource,
    addReceiver,
    updateSourcePosition,
    updateReceiverPosition,
    setWallMaterial,
  } = useEditorStore();

  const { camera, raycaster, mouse } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);

  const handleCanvasClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (toolMode === 'select') {
      setSelected(null, null);
      return;
    }

    if (toolMode === 'addSource' || toolMode === 'addReceiver') {
      const point = getGroundIntersection(event);
      if (point) {
        if (toolMode === 'addSource') {
          addSource(point);
        } else {
          addReceiver(point);
        }
      }
    }
  }, [toolMode, addSource, addReceiver, setSelected]);

  const getGroundIntersection = (event: ThreeEvent<MouseEvent>): Point3D | null => {
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(event.pointer, camera);

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);

    if (intersection) {
      return { x: intersection.x, y: 0, z: intersection.z };
    }
    return null;
  };

  const handleSourceClick = (sourceId: string) => {
    if (toolMode === 'select') {
      setSelected(sourceId, 'source');
    }
  };

  const handleReceiverClick = (receiverId: string) => {
    if (toolMode === 'select') {
      setSelected(receiverId, 'receiver');
    }
  };

  const handleWallClick = (wallId: string) => {
    if (toolMode === 'select') {
      setSelected(wallId, 'wall');
    }
  };

  const handleSourceDrag = (id: string, position: Point3D) => {
    updateSourcePosition(id, position);
  };

  const handleReceiverDrag = (id: string, position: Point3D) => {
    updateReceiverPosition(id, position);
  };

  const allRays = simulationResult?.results.flatMap(r => r.rays) || [];

  return (
    <>
      <ambientLight intensity={0.4} color="#90CAF9" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight args={['#87CEEB', '#0A1929', 0.3]} />

      <RoomMesh
        walls={room.walls}
        selectedWallId={selectedType === 'wall' ? selectedId : null}
        onWallClick={handleWallClick}
      />

      {sources.map((source) => (
        <SourceMarker
          key={source.id}
          source={source}
          isSelected={selectedType === 'source' && selectedId === source.id}
          onClick={() => handleSourceClick(source.id)}
          onDrag={(pos) => handleSourceDrag(source.id, pos)}
        />
      ))}

      {receivers.map((receiver) => (
        <ReceiverMarker
          key={receiver.id}
          receiver={receiver}
          isSelected={selectedType === 'receiver' && selectedId === receiver.id}
          onClick={() => handleReceiverClick(receiver.id)}
          onDrag={(pos) => handleReceiverDrag(receiver.id, pos)}
        />
      ))}

      {allRays.length > 0 && (
        <RayLines
          rays={allRays}
          animationTime={animationTime}
          isPlaying={isPlayingAnimation}
        />
      )}

      <Grid
        position={[0, -room.dimensions.height / 2 + 0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={COLORS.grid}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={COLORS.primary}
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
      />

      <mesh onClick={handleCanvasClick} visible={false}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
          intensity={1.5}
        />
      </EffectComposer>

      <axesHelper args={[2]} position={[-room.dimensions.width / 2 + 0.1, -room.dimensions.height / 2 + 0.02, -room.dimensions.depth / 2 + 0.1]} />
    </>
  );
}

export function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: [8, 8, 8], fov: 50 }}
      style={{ background: COLORS.background }}
      onPointerMissed={() => useEditorStore.getState().setSelected(null, null)}
    >
      <fog attach="fog" args={[COLORS.background, 15, 50]} />
      <SceneContent />
    </Canvas>
  );
}
