import { useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Box, Layers, Radio } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { MATERIALS } from '../../../shared/materials';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
      >
        {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        {icon}
        <span className="text-sm font-medium text-slate-200">{title}</span>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function NumberInput({ label, value, onChange, min, max, step = 0.1, unit }: NumberInputProps) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        {unit && <span className="text-xs text-slate-500 w-8">{unit}</span>}
      </div>
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

function SliderInput({ label, value, onChange, min, max, step = 1, unit }: SliderInputProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-mono text-cyan-400">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow
        "
      />
    </div>
  );
}

export function RightPanel() {
  const {
    room,
    sources,
    receivers,
    selectedId,
    selectedType,
    simulationParams,
    setRoomType,
    setRoomDimensions,
    setWallMaterial,
    setAllWallsMaterial,
    updateSourcePower,
    updateReceiverRadius,
    setSimulationParams,
  } = useEditorStore();

  const selectedSource = selectedType === 'source' ? sources.find(s => s.id === selectedId) : null;
  const selectedReceiver = selectedType === 'receiver' ? receivers.find(r => r.id === selectedId) : null;
  const selectedWall = selectedType === 'wall' ? room.walls.find(w => w.id === selectedId) : null;

  return (
    <div className="absolute right-4 top-4 bottom-24 w-80 z-10 overflow-hidden">
      <div className="h-full flex flex-col bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-200">参数设置</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Section title="房间设置" icon={<Box size={16} className="text-cyan-400" />}>
            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">房间类型</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoomType('box')}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg transition-colors ${
                    room.type === 'box'
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  长方体
                </button>
                <button
                  onClick={() => setRoomType('l-shape')}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg transition-colors ${
                    room.type === 'l-shape'
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  L型
                </button>
              </div>
            </div>

            <NumberInput
              label="宽度 (X轴)"
              value={room.dimensions.width}
              onChange={(v) => setRoomDimensions({ width: v })}
              min={2}
              max={50}
              unit="m"
            />
            <NumberInput
              label="高度 (Y轴)"
              value={room.dimensions.height}
              onChange={(v) => setRoomDimensions({ height: v })}
              min={2}
              max={20}
              unit="m"
            />
            <NumberInput
              label="深度 (Z轴)"
              value={room.dimensions.depth}
              onChange={(v) => setRoomDimensions({ depth: v })}
              min={2}
              max={50}
              unit="m"
            />

            {room.type === 'l-shape' && (
              <>
                <NumberInput
                  label="延伸长度"
                  value={room.dimensions.lExtension || 4}
                  onChange={(v) => setRoomDimensions({ lExtension: v })}
                  min={1}
                  max={20}
                  unit="m"
                />
                <NumberInput
                  label="延伸宽度"
                  value={room.dimensions.lWidth || 4}
                  onChange={(v) => setRoomDimensions({ lWidth: v })}
                  min={1}
                  max={20}
                  unit="m"
                />
              </>
            )}
          </Section>

          <Section title="材料设置" icon={<Layers size={16} className="text-cyan-400" />}>
            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">全局墙面材料</label>
              <select
                onChange={(e) => setAllWallsMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {MATERIALS.map((mat) => (
                  <option key={mat.name} value={mat.name}>
                    {mat.name} (吸声: {mat.absorption})
                  </option>
                ))}
              </select>
            </div>

            {selectedWall && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
                <div className="text-xs text-slate-400 mb-2">
                  选中墙面: <span className="text-cyan-400">{selectedWall.id}</span>
                </div>
                <label className="block text-xs text-slate-400 mb-1">墙面材料</label>
                <select
                  value={selectedWall.material.name}
                  onChange={(e) => setWallMaterial(selectedWall.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {MATERIALS.map((mat) => (
                    <option key={mat.name} value={mat.name}>
                      {mat.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-slate-500">吸声</div>
                    <div className="text-slate-300 font-mono">{selectedWall.material.absorption}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">反射</div>
                    <div className="text-slate-300 font-mono">{selectedWall.material.reflection}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">扩散</div>
                    <div className="text-slate-300 font-mono">{selectedWall.material.diffusion}</div>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {selectedSource && (
            <Section title="声源属性" icon={<Radio size={16} className="text-orange-400" />}>
              <div className="text-xs text-slate-400 mb-2">
                ID: <span className="text-orange-400 font-mono">{selectedSource.id}</span>
              </div>
              <SliderInput
                label="声源强度"
                value={selectedSource.power}
                onChange={(v) => updateSourcePower(selectedSource.id, v)}
                min={60}
                max={120}
                step={1}
                unit=" dB"
              />
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                <div>
                  <div className="text-slate-500">X</div>
                  <div className="text-slate-300 font-mono">{selectedSource.position.x.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Y</div>
                  <div className="text-slate-300 font-mono">{selectedSource.position.y.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Z</div>
                  <div className="text-slate-300 font-mono">{selectedSource.position.z.toFixed(2)}</div>
                </div>
              </div>
            </Section>
          )}

          {selectedReceiver && (
            <Section title="接收点属性" icon={<Radio size={16} className="text-green-400" />}>
              <div className="text-xs text-slate-400 mb-2">
                ID: <span className="text-green-400 font-mono">{selectedReceiver.id}</span>
              </div>
              <SliderInput
                label="接收半径"
                value={selectedReceiver.radius}
                onChange={(v) => updateReceiverRadius(selectedReceiver.id, v)}
                min={0.1}
                max={1}
                step={0.05}
                unit=" m"
              />
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                <div>
                  <div className="text-slate-500">X</div>
                  <div className="text-slate-300 font-mono">{selectedReceiver.position.x.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Y</div>
                  <div className="text-slate-300 font-mono">{selectedReceiver.position.y.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Z</div>
                  <div className="text-slate-300 font-mono">{selectedReceiver.position.z.toFixed(2)}</div>
                </div>
              </div>
            </Section>
          )}

          <Section title="仿真参数" icon={<Settings size={16} className="text-cyan-400" />}>
            <SliderInput
              label="射线数量"
              value={simulationParams.rayCount}
              onChange={(v) => setSimulationParams({ rayCount: v })}
              min={100}
              max={5000}
              step={100}
              unit=" 条"
            />
            <SliderInput
              label="最大反射次数"
              value={simulationParams.maxReflections}
              onChange={(v) => setSimulationParams({ maxReflections: v })}
              min={1}
              max={10}
              step={1}
              unit=" 次"
            />
            <NumberInput
              label="声速"
              value={simulationParams.soundSpeed}
              onChange={(v) => setSimulationParams({ soundSpeed: v })}
              min={300}
              max={400}
              unit="m/s"
            />
            <NumberInput
              label="参考频率"
              value={simulationParams.frequency}
              onChange={(v) => setSimulationParams({ frequency: v })}
              min={100}
              max={4000}
              unit="Hz"
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
