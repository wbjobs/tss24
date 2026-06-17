import { MousePointer2, Volume2, Mic2, Move, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { COLORS } from '../../../shared/constants';
import type { ToolMode } from '../../../shared/types';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  mode: ToolMode;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, mode, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group w-12 h-12 flex items-center justify-center rounded-lg
        transition-all duration-200 border
        ${isActive
          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-500/20'
          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600 hover:text-slate-200'
        }
      `}
      title={label}
    >
      {icon}
      <span className="absolute left-14 whitespace-nowrap px-2 py-1 bg-slate-900 text-xs text-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </span>
    </button>
  );
}

export function LeftToolbar() {
  const {
    toolMode,
    setToolMode,
    selectedId,
    selectedType,
    removeSource,
    removeReceiver,
  } = useEditorStore();

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'select', icon: <MousePointer2 size={20} />, label: '选择工具' },
    { mode: 'addSource', icon: <Volume2 size={20} />, label: '添加声源' },
    { mode: 'addReceiver', icon: <Mic2 size={20} />, label: '添加接收点' },
    { mode: 'move', icon: <Move size={20} />, label: '移动工具' },
  ];

  const handleDelete = () => {
    if (selectedId) {
      if (selectedType === 'source') {
        removeSource(selectedId);
      } else if (selectedType === 'receiver') {
        removeReceiver(selectedId);
      }
    }
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
      <div className="flex flex-col gap-2 p-3 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
        {tools.map((tool) => (
          <ToolButton
            key={tool.mode}
            icon={tool.icon}
            label={tool.label}
            mode={tool.mode}
            isActive={toolMode === tool.mode}
            onClick={() => setToolMode(tool.mode)}
          />
        ))}

        <div className="h-px bg-slate-700 my-1" />

        <button
          onClick={handleDelete}
          disabled={!selectedId || selectedType === 'wall'}
          className={`
            relative group w-12 h-12 flex items-center justify-center rounded-lg
            transition-all duration-200 border
            ${selectedId && selectedType !== 'wall'
              ? 'bg-red-500/20 border-red-400/50 text-red-400 hover:bg-red-500/30 cursor-pointer'
              : 'bg-slate-800/30 border-slate-700/30 text-slate-600 cursor-not-allowed'
            }
          `}
          title="删除选中"
        >
          <Trash2 size={20} />
          <span className="absolute left-14 whitespace-nowrap px-2 py-1 bg-slate-900 text-xs text-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            删除选中对象
          </span>
        </button>
      </div>

      <div className="mt-3 p-3 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-2">图例</div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.source }} />
            <span className="text-slate-300">声源</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.receiver }} />
            <span className="text-slate-300">接收点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5" style={{ backgroundColor: COLORS.ray }} />
            <span className="text-slate-300">声线</span>
          </div>
        </div>
      </div>
    </div>
  );
}
