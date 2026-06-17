export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Material {
  name: string;
  absorption: number;
  reflection: number;
  diffusion: number;
}

export interface Wall {
  id: string;
  vertices: [Point3D, Point3D, Point3D, Point3D];
  normal: Point3D;
  material: Material;
}

export interface RoomDimensions {
  width: number;
  height: number;
  depth: number;
  lExtension?: number;
  lWidth?: number;
}

export interface Room {
  type: 'box' | 'l-shape';
  dimensions: RoomDimensions;
  walls: Wall[];
}

export interface Source {
  id: string;
  position: Point3D;
  power: number;
}

export interface Receiver {
  id: string;
  position: Point3D;
  radius: number;
}

export interface SimulationParams {
  rayCount: number;
  maxReflections: number;
  soundSpeed: number;
  frequency: number;
}

export interface SimulationRequest {
  room: Room;
  sources: Source[];
  receivers: Receiver[];
  params: SimulationParams;
}

export type ReflectionType = 'specular' | 'diffuse';

export interface RayPath {
  id: string;
  sourceId: string;
  receiverId: string;
  points: Point3D[];
  reflectionCount: number;
  timeDelay: number;
  energy: number;
  reflectionTypes: ReflectionType[];
}

export interface ReceiverResult {
  receiverId: string;
  rays: RayPath[];
  totalEnergy: number;
  earlyEnergy: number;
  lateEnergy: number;
}

export interface AcousticParams {
  rt60: number;
  rt30: number;
  c50: number;
  d50: number;
  t20: number;
}

export interface SimulationStats {
  totalRays: number;
  effectiveRays: number;
  computeTime: number;
}

export interface SimulationResponse {
  success: boolean;
  results: ReceiverResult[];
  acousticParams: AcousticParams;
  stats: SimulationStats;
  error?: string;
}

export type ToolMode = 'select' | 'addSource' | 'addReceiver' | 'move';

export interface EditorState {
  room: Room;
  sources: Source[];
  receivers: Receiver[];
  selectedId: string | null;
  toolMode: ToolMode;
  isSimulating: boolean;
  simulationResult: SimulationResponse | null;
  isPlayingAnimation: boolean;
  animationTime: number;
}

export interface EnergyTimePoint {
  time: number;
  energy: number;
}
