import { Play, Pause, RotateCcw, Download, Loader2, Square } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

export function BottomControlBar() {
  const {
    isSimulating,
    simulationResult,
    isPlayingAnimation,
    setPlayingAnimation,
    setAnimationTime,
    runSimulation,
    resetScene,
    animationTime,
  } = useEditorStore();

  const maxTime = simulationResult
    ? Math.max(...simulationResult.results.flatMap(r => r.rays.map(ray => ray.timeDelay)))
    : 100;

  const handleExport = () => {
    if (simulationResult) {
      const dataStr = JSON.stringify(simulationResult, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acoustic-simulation-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const progress = Math.min((animationTime / maxTime) * 100, 100);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-4 px-6 py-3 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm
            transition-all duration-200
            ${isSimulating
              ? 'bg-cyan-500/30 text-cyan-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
            }
          `}
        >
          {isSimulating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              仿真计算中...
            </>
          ) : (
            <>
              <Play size={18} />
              开始仿真
            </>
          )}
        </button>

        {simulationResult && (
          <>
            <div className="h-8 w-px bg-slate-700" />

            <button
              onClick={() => setPlayingAnimation(!isPlayingAnimation)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm"
            >
              {isPlayingAnimation ? <Pause size={18} /> : <Play size={18} />}
              {isPlayingAnimation ? '暂停' : '播放'}
            </button>

            <button
              onClick={() => {
                setAnimationTime(0);
                setPlayingAnimation(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm"
            >
              <RotateCcw size={18} />
              重置
            </button>

            <div className="flex items-center gap-3 min-w-[200px]">
              <input
                type="range"
                min={0}
                max={maxTime}
                step={0.1}
                value={animationTime}
                onChange={(e) => {
                  setAnimationTime(parseFloat(e.target.value));
                  setPlayingAnimation(false);
                }}
                className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-cyan-400
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-cyan-400/50
                  [&::-webkit-slider-thumb]:cursor-pointer
                "
              />
              <span className="text-xs text-slate-400 font-mono min-w-[60px]">
                {animationTime.toFixed(1)} ms
              </span>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm"
            >
              <Download size={18} />
              导出
            </button>
          </>
        )}

        <button
          onClick={resetScene}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors text-sm"
        >
          <RotateCcw size={18} />
          重置场景
        </button>
      </div>

      {simulationResult && (
        <div className="mt-2 flex justify-center">
          <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50 text-xs text-slate-400">
            有效射线: <span className="text-cyan-400 font-mono">{simulationResult.stats.effectiveRays}</span> /{' '}
            {simulationResult.stats.totalRays} | 计算耗时:{' '}
            <span className="text-cyan-400 font-mono">{simulationResult.stats.computeTime.toFixed(0)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
