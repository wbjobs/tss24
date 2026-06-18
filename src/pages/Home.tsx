import { useEffect } from 'react';
import { FileDown } from 'lucide-react';
import { SceneCanvas } from '../components/Editor/SceneCanvas';
import { LeftToolbar } from '../components/Toolbar/LeftToolbar';
import { BottomControlBar } from '../components/Toolbar/BottomControlBar';
import { RightPanel } from '../components/Panel/RightPanel';
import { AcousticParamsTable } from '../components/Results/AcousticParamsTable';
import { EnergyTimeCurve } from '../components/Results/EnergyTimeCurve';
import { useEditorStore } from '../store/useEditorStore';
import { exportReport } from '../utils/exportReport';

export default function Home() {
  const { toolMode, isSimulating, animationTime, setAnimationTime, isPlayingAnimation } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useEditorStore.getState().setToolMode('select');
        useEditorStore.getState().setSelected(null, null);
      }
      if (e.key === '1') useEditorStore.getState().setToolMode('select');
      if (e.key === '2') useEditorStore.getState().setToolMode('addSource');
      if (e.key === '3') useEditorStore.getState().setToolMode('addReceiver');
      if (e.key === 'm' || e.key === 'M') useEditorStore.getState().setToolMode('move');
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedId, selectedType, removeSource, removeReceiver } = useEditorStore.getState();
        if (selectedId && selectedType !== 'wall') {
          if (selectedType === 'source') removeSource(selectedId);
          else if (selectedType === 'receiver') removeReceiver(selectedId);
        }
      }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        const { isPlayingAnimation, setPlayingAnimation } = useEditorStore.getState();
        setPlayingAnimation(!isPlayingAnimation);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isPlayingAnimation) return;

    const interval = setInterval(() => {
      const currentTime = useEditorStore.getState().animationTime;
      const maxTime = useEditorStore.getState().simulationResult
        ? Math.max(
            ...useEditorStore
              .getState()
              .simulationResult!.results.flatMap((r) => r.rays.map((ray) => ray.timeDelay))
          )
        : 100;

      if (currentTime >= maxTime) {
        useEditorStore.getState().setAnimationTime(0);
      } else {
        useEditorStore.getState().setAnimationTime(currentTime + 0.5);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isPlayingAnimation]);

  const getCursorStyle = () => {
    switch (toolMode) {
      case 'addSource':
      case 'addReceiver':
        return 'crosshair';
      case 'move':
        return 'move';
      default:
        return 'default';
    }
  };

  return (
    <div className="w-full h-full relative" style={{ cursor: getCursorStyle() }}>
      <SceneCanvas />

      <LeftToolbar />
      <RightPanel />
      <BottomControlBar />
      <AcousticParamsTable />
      <EnergyTimeCurve />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <div className="px-6 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50">
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            室内声学仿真辅助工具
          </h1>
        </div>
        <button
          onClick={() => {
            const state = useEditorStore.getState();
            exportReport({
              room: state.room,
              sources: state.sources,
              receivers: state.receivers,
              simulationResult: state.simulationResult,
              heatmaps: state.soundFieldResult?.heatmaps || [],
              walls: state.room.walls,
            });
          }}
          className="px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50 
            text-cyan-400 text-sm font-medium hover:bg-slate-800 hover:border-cyan-500/50 
            transition-all flex items-center gap-2"
        >
          <FileDown size={16} />
          导出报告
        </button>
      </div>

      {isSimulating && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-cyan-400 mb-2">仿真计算中...</h2>
            <p className="text-slate-400 text-sm">正在进行射线追踪计算，请稍候</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10">
        <div className="px-3 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50 text-[10px] text-slate-500">
          <div>快捷键: 1-选择 | 2-添加声源 | 3-添加接收点 | M-移动 | Space-播放/暂停 | Delete-删除</div>
        </div>
      </div>
    </div>
  );
}
