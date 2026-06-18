import { create } from 'zustand';
import type {
  Room,
  Source,
  Receiver,
  ToolMode,
  SimulationResponse,
  SimulationParams,
  Point3D,
  RoomDimensions,
  Material,
  SoundFieldResponse,
  SoundFieldHeatmap,
} from '../../shared/types';
import { generateRoom, generateId } from '../../shared/geometry';
import { DEFAULT_ROOM_DIMENSIONS, DEFAULT_SIMULATION_PARAMS } from '../../shared/constants';
import { getMaterialByName } from '../../shared/materials';

interface EditorStore {
  room: Room;
  sources: Source[];
  receivers: Receiver[];
  selectedId: string | null;
  selectedType: 'source' | 'receiver' | 'wall' | null;
  toolMode: ToolMode;
  isSimulating: boolean;
  simulationResult: SimulationResponse | null;
  isPlayingAnimation: boolean;
  animationTime: number;
  simulationParams: SimulationParams;
  selectedWallMaterial: Material;
  showResultsPanel: boolean;
  showHeatmap: boolean;
  soundFieldResult: SoundFieldResponse | null;
  isCalculatingSoundField: boolean;
  heatmapGridResolution: number;
  heatmapSurfaces: ('floor' | 'ceiling' | 'walls')[];

  setRoomType: (type: 'box' | 'l-shape') => void;
  setRoomDimensions: (dimensions: Partial<RoomDimensions>) => void;
  setWallMaterial: (wallId: string, materialName: string) => void;
  setAllWallsMaterial: (materialName: string) => void;
  addSource: (position: Point3D) => void;
  addReceiver: (position: Point3D) => void;
  removeSource: (id: string) => void;
  removeReceiver: (id: string) => void;
  updateSourcePosition: (id: string, position: Point3D) => void;
  updateReceiverPosition: (id: string, position: Point3D) => void;
  updateSourcePower: (id: string, power: number) => void;
  updateReceiverRadius: (id: string, radius: number) => void;
  setSelected: (id: string | null, type: 'source' | 'receiver' | 'wall' | null) => void;
  setToolMode: (mode: ToolMode) => void;
  setSimulating: (simulating: boolean) => void;
  setSimulationResult: (result: SimulationResponse | null) => void;
  setPlayingAnimation: (playing: boolean) => void;
  setAnimationTime: (time: number) => void;
  setSimulationParams: (params: Partial<SimulationParams>) => void;
  setShowResultsPanel: (show: boolean) => void;
  setShowHeatmap: (show: boolean) => void;
  setHeatmapGridResolution: (resolution: number) => void;
  setHeatmapSurfaces: (surfaces: ('floor' | 'ceiling' | 'walls')[]) => void;
  setSoundFieldResult: (result: SoundFieldResponse | null) => void;
  resetScene: () => void;
  runSimulation: () => Promise<void>;
  calculateSoundField: () => Promise<void>;
}

const createInitialRoom = (): Room => {
  return generateRoom('box', { ...DEFAULT_ROOM_DIMENSIONS });
};

const createInitialSources = (): Source[] => [
  {
    id: generateId(),
    position: { x: -2, y: 0, z: -2 },
    power: 90,
  },
];

const createInitialReceivers = (): Receiver[] => [
  {
    id: generateId(),
    position: { x: 2, y: 0, z: 2 },
    radius: 0.3,
  },
];

export const useEditorStore = create<EditorStore>((set, get) => ({
  room: createInitialRoom(),
  sources: createInitialSources(),
  receivers: createInitialReceivers(),
  selectedId: null,
  selectedType: null,
  toolMode: 'select',
  isSimulating: false,
  simulationResult: null,
  isPlayingAnimation: false,
  animationTime: 0,
  simulationParams: { ...DEFAULT_SIMULATION_PARAMS },
  selectedWallMaterial: getMaterialByName('混凝土'),
  showResultsPanel: true,
  showHeatmap: false,
  soundFieldResult: null,
  isCalculatingSoundField: false,
  heatmapGridResolution: 10,
  heatmapSurfaces: ['floor'],

  setRoomType: (type) => {
    const { dimensions } = get().room;
    set({ room: generateRoom(type, dimensions) });
  },

  setRoomDimensions: (newDimensions) => {
    const { room } = get();
    const updatedDimensions = { ...room.dimensions, ...newDimensions };
    set({ room: generateRoom(room.type, updatedDimensions) });
  },

  setWallMaterial: (wallId, materialName) => {
    const material = getMaterialByName(materialName);
    set((state) => ({
      room: {
        ...state.room,
        walls: state.room.walls.map((w) =>
          w.id === wallId ? { ...w, material } : w
        ),
      },
      selectedWallMaterial: material,
    }));
  },

  setAllWallsMaterial: (materialName) => {
    const material = getMaterialByName(materialName);
    set((state) => ({
      room: {
        ...state.room,
        walls: state.room.walls.map((w) => ({ ...w, material })),
      },
      selectedWallMaterial: material,
    }));
  },

  addSource: (position) => {
    const newSource: Source = {
      id: generateId(),
      position,
      power: 90,
    };
    set((state) => ({
      sources: [...state.sources, newSource],
      selectedId: newSource.id,
      selectedType: 'source',
      toolMode: 'select',
    }));
  },

  addReceiver: (position) => {
    const newReceiver: Receiver = {
      id: generateId(),
      position,
      radius: 0.3,
    };
    set((state) => ({
      receivers: [...state.receivers, newReceiver],
      selectedId: newReceiver.id,
      selectedType: 'receiver',
      toolMode: 'select',
    }));
  },

  removeSource: (id) => {
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
  },

  removeReceiver: (id) => {
    set((state) => ({
      receivers: state.receivers.filter((r) => r.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
  },

  updateSourcePosition: (id, position) => {
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === id ? { ...s, position } : s
      ),
    }));
  },

  updateReceiverPosition: (id, position) => {
    set((state) => ({
      receivers: state.receivers.map((r) =>
        r.id === id ? { ...r, position } : r
      ),
    }));
  },

  updateSourcePower: (id, power) => {
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === id ? { ...s, power } : s
      ),
    }));
  },

  updateReceiverRadius: (id, radius) => {
    set((state) => ({
      receivers: state.receivers.map((r) =>
        r.id === id ? { ...r, radius } : r
      ),
    }));
  },

  setSelected: (id, type) => {
    set({ selectedId: id, selectedType: type });
  },

  setToolMode: (mode) => {
    set({ toolMode: mode, selectedId: null, selectedType: null });
  },

  setSimulating: (simulating) => {
    set({ isSimulating: simulating });
  },

  setSimulationResult: (result) => {
    set({
      simulationResult: result,
      isSimulating: false,
      animationTime: 0,
      isPlayingAnimation: result !== null,
      showResultsPanel: result !== null,
    });
  },

  setPlayingAnimation: (playing) => {
    set({ isPlayingAnimation: playing });
  },

  setAnimationTime: (time) => {
    set({ animationTime: time });
  },

  setSimulationParams: (params) => {
    set((state) => ({
      simulationParams: { ...state.simulationParams, ...params },
    }));
  },

  setShowResultsPanel: (show) => {
    set({ showResultsPanel: show });
  },

  setShowHeatmap: (show) => {
    set({ showHeatmap: show });
  },

  setHeatmapGridResolution: (resolution) => {
    set({ heatmapGridResolution: resolution });
  },

  setHeatmapSurfaces: (surfaces) => {
    set({ heatmapSurfaces: surfaces });
  },

  setSoundFieldResult: (result) => {
    set({ soundFieldResult: result, isCalculatingSoundField: false });
  },

  resetScene: () => {
    set({
      room: createInitialRoom(),
      sources: createInitialSources(),
      receivers: createInitialReceivers(),
      selectedId: null,
      selectedType: null,
      simulationResult: null,
      isPlayingAnimation: false,
      animationTime: 0,
      soundFieldResult: null,
      showHeatmap: false,
    });
  },

  runSimulation: async () => {
    const state = get();
    if (state.sources.length === 0 || state.receivers.length === 0) {
      alert('请至少放置一个声源和一个接收点');
      return;
    }

    set({ isSimulating: true, simulationResult: null });

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: state.room,
          sources: state.sources,
          receivers: state.receivers,
          params: state.simulationParams,
        }),
      });

      const result = await response.json();

      if (result.success) {
        set({
          simulationResult: result,
          isSimulating: false,
          animationTime: 0,
          isPlayingAnimation: true,
          showResultsPanel: true,
        });
      } else {
        throw new Error(result.error || '仿真失败');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      alert(`仿真失败: ${error instanceof Error ? error.message : '未知错误'}`);
      set({ isSimulating: false });
    }
  },

  calculateSoundField: async () => {
    const state = get();
    if (state.sources.length === 0) {
      alert('请至少放置一个声源');
      return;
    }

    set({ isCalculatingSoundField: true, soundFieldResult: null });

    try {
      const response = await fetch('/api/soundfield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: state.room,
          sources: state.sources,
          params: state.simulationParams,
          gridResolution: state.heatmapGridResolution,
          targetSurfaces: state.heatmapSurfaces,
        }),
      });

      const result = await response.json();

      if (result.success) {
        set({
          soundFieldResult: result,
          isCalculatingSoundField: false,
          showHeatmap: true,
        });
      } else {
        throw new Error(result.error || '声场计算失败');
      }
    } catch (error) {
      console.error('Sound field error:', error);
      alert(`声场计算失败: ${error instanceof Error ? error.message : '未知错误'}`);
      set({ isCalculatingSoundField: false });
    }
  },
}));
