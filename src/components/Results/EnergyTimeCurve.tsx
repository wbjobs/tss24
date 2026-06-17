import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useEditorStore } from '../../store/useEditorStore';
import type { EnergyTimePoint } from '../../../shared/types';

export function EnergyTimeCurve() {
  const { simulationResult } = useEditorStore();

  const chartData = useMemo((): EnergyTimePoint[] => {
    if (!simulationResult) return [];

    const allRays = simulationResult.results.flatMap((r) => r.rays);
    if (allRays.length === 0) return [];

    const maxTime = Math.max(...allRays.map((r) => r.timeDelay));
    const binSize = Math.max(1, maxTime / 50);
    const bins: Map<number, number> = new Map();

    allRays.forEach((ray) => {
      const binIndex = Math.floor(ray.timeDelay / binSize) * binSize;
      const currentEnergy = bins.get(binIndex) || 0;
      bins.set(binIndex, currentEnergy + ray.energy);
    });

    const data: EnergyTimePoint[] = Array.from(bins.entries())
      .map(([time, energy]) => ({ time, energy }))
      .sort((a, b) => a.time - b.time);

    return data;
  }, [simulationResult]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    let cumulativeEnergy = 0;
    const totalEnergy = chartData.reduce((sum, d) => sum + d.energy, 0);
    let t50Index = chartData.length - 1;

    for (let i = 0; i < chartData.length; i++) {
      cumulativeEnergy += chartData[i].energy;
      if (cumulativeEnergy >= totalEnergy * 0.5 && t50Index === chartData.length - 1) {
        t50Index = i;
      }
    }

    return {
      maxEnergy: Math.max(...chartData.map((d) => d.energy)),
      totalEnergy,
      t50Time: chartData[t50Index]?.time || 0,
    };
  }, [chartData]);

  if (!simulationResult || chartData.length === 0) return null;

  return (
    <div className="absolute left-4 bottom-32 z-10 w-96">
      <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">能量时间曲线 (ETC)</h3>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                label={{ value: '时间 (ms)', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 10 }}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                tickFormatter={(value) => value.toExponential(0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                formatter={(value: number) => [value.toExponential(3), '能量']}
                labelFormatter={(label) => `时间: ${label.toFixed(1)} ms`}
              />
              <ReferenceLine
                x={50}
                stroke="#00E676"
                strokeDasharray="5 5"
                label={{ value: '50ms', fill: '#00E676', fontSize: 10, position: 'top' }}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#00D4FF"
                strokeWidth={2}
                fill="url(#energyGradient)"
                name="能量"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {stats && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-500">峰值能量</div>
              <div className="text-cyan-400 font-mono">{stats.maxEnergy.toExponential(2)}</div>
            </div>
            <div>
              <div className="text-slate-500">总能量</div>
              <div className="text-cyan-400 font-mono">{stats.totalEnergy.toExponential(2)}</div>
            </div>
            <div>
              <div className="text-slate-500">T50时间</div>
              <div className="text-green-400 font-mono">{stats.t50Time.toFixed(1)} ms</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
