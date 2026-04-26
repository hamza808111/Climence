import { Layers } from 'lucide-react';
import type { ViewMode } from '../map/DroneMap';

interface Props {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onChange }: Props) {
  return (
    <div className="bg-gray-800/80 p-1 rounded-lg flex shadow-inner border border-gray-700/50">
      <button
        onClick={() => onChange('markers')}
        className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all ${
          viewMode === 'markers' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
        }`}
      >
        Hardware Grid
      </button>
      <button
        onClick={() => onChange('heatmap')}
        className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all flex items-center justify-center space-x-1 ${
          viewMode === 'heatmap' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Layers className="w-3 h-3 mr-1" /> AQI Heatmap
      </button>
    </div>
  );
}
