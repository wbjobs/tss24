import { useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { AcousticParams } from '../../../shared/types';

interface ParamCardProps {
  label: string;
  value: number;
  unit: string;
  description: string;
  idealRange?: string;
  decimals?: number;
}

function ParamCard({ label, value, unit, description, idealRange, decimals = 2 }: ParamCardProps) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-lg font-bold text-cyan-400 font-mono">
          {value.toFixed(decimals)}
          <span className="text-xs text-slate-500 ml-1">{unit}</span>
        </span>
      </div>
      <p className="text-[10px] text-slate-500">{description}</p>
      {idealRange && (
        <p className="text-[10px] text-green-400/70 mt-1">理想范围: {idealRange}</p>
      )}
    </div>
  );
}

export function AcousticParamsTable() {
  const { simulationResult, showResultsPanel, setShowResultsPanel } = useEditorStore();

  const params = simulationResult?.acousticParams;

  const qualityAssessment = useMemo(() => {
    if (!params) return null;

    const assessments: { param: string; quality: 'good' | 'fair' | 'poor'; message: string }[] = [];

    if (params.rt60 >= 0.8 && params.rt60 <= 1.5) {
      assessments.push({ param: 'RT60', quality: 'good', message: '混响时间适宜' });
    } else if (params.rt60 >= 0.5 && params.rt60 <= 2.0) {
      assessments.push({ param: 'RT60', quality: 'fair', message: '混响时间可接受' });
    } else {
      assessments.push({ param: 'RT60', quality: 'poor', message: '混响时间需要调整' });
    }

    if (params.c50 >= 1) {
      assessments.push({ param: 'C50', quality: 'good', message: '清晰度良好' });
    } else if (params.c50 >= -3) {
      assessments.push({ param: 'C50', quality: 'fair', message: '清晰度一般' });
    } else {
      assessments.push({ param: 'C50', quality: 'poor', message: '清晰度不足' });
    }

    if (params.d50 >= 50) {
      assessments.push({ param: 'D50', quality: 'good', message: '语言清晰度优秀' });
    } else if (params.d50 >= 40) {
      assessments.push({ param: 'D50', quality: 'fair', message: '语言清晰度良好' });
    } else {
      assessments.push({ param: 'D50', quality: 'poor', message: '语言清晰度不足' });
    }

    return assessments;
  }, [params]);

  if (!simulationResult || !showResultsPanel) return null;

  return (
    <div className="absolute left-4 top-4 z-10 w-96">
      <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">声学参数分析</h3>
          <button
            onClick={() => setShowResultsPanel(false)}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xs"
          >
            收起
          </button>
        </div>

        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {params && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <ParamCard
                  label="混响时间 RT60"
                  value={params.rt60}
                  unit="s"
                  description="声音衰减60dB所需时间"
                  idealRange="0.8-1.5s (音乐厅)"
                />
                <ParamCard
                  label="混响时间 RT30"
                  value={params.rt30}
                  unit="s"
                  description="声音衰减30dB所需时间"
                />
                <ParamCard
                  label="清晰度 C50"
                  value={params.c50}
                  unit="dB"
                  description="50ms内早期能量与晚期能量比"
                  idealRange="> 0 dB"
                />
                <ParamCard
                  label="语言清晰度 D50"
                  value={params.d50}
                  unit="%"
                  description="50ms内能量占总能量比例"
                  idealRange="> 50%"
                />
                <ParamCard
                  label="早期衰变时间 T20"
                  value={params.t20}
                  unit="s"
                  description="初始20dB衰减率"
                />
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-medium text-slate-400 mb-2">质量评估</h4>
                <div className="space-y-2">
                  {qualityAssessment?.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                        a.quality === 'good'
                          ? 'bg-green-500/10 border border-green-500/30'
                          : a.quality === 'fair'
                          ? 'bg-yellow-500/10 border border-yellow-500/30'
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          a.quality === 'good'
                            ? 'bg-green-400'
                            : a.quality === 'fair'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                      />
                      <span className="font-medium text-slate-300">{a.param}:</span>
                      <span className="text-slate-400">{a.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2">接收点详情</h4>
                {simulationResult.results.map((result, idx) => (
                  <div key={result.receiverId} className="mb-3 p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-slate-300">
                        接收点 #{idx + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {result.rays.length} 条有效射线
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-slate-500">总能量</div>
                        <div className="text-cyan-400 font-mono">
                          {result.totalEnergy.toExponential(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">早期能量</div>
                        <div className="text-green-400 font-mono">
                          {result.earlyEnergy.toExponential(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">晚期能量</div>
                        <div className="text-orange-400 font-mono">
                          {result.lateEnergy.toExponential(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {!showResultsPanel && (
        <button
          onClick={() => setShowResultsPanel(true)}
          className="mt-2 w-full py-2 bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700/50 text-sm transition-colors"
        >
          展开参数面板
        </button>
      )}
    </div>
  );
}
