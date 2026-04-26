import type { CityTrendPoint, Hotspot } from '@climence/shared';
import type { ConnectionStatus } from '../../hooks/useLiveTelemetry';
import type { ViewMode } from '../map/DroneMap';
import { CityTrendChart } from './CityTrendChart';
import { HotspotsList } from './HotspotsList';
import { ViewModeToggle } from './ViewModeToggle';
import climenceLogo from '../../assets/climence-logo.png';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  cityTrend: CityTrendPoint[];
  hotspots: Hotspot[];
  connectionStatus: ConnectionStatus;
}

const STATUS_META: Record<ConnectionStatus, { label: string; dot: string }> = {
  open: { label: 'Live', dot: 'bg-emerald-400 shadow-emerald-500/50' },
  connecting: { label: 'Connecting', dot: 'bg-amber-400 shadow-amber-500/50' },
  reconnecting: { label: 'Reconnecting', dot: 'bg-amber-400 shadow-amber-500/50' },
};

export function CommandCenter({
  viewMode,
  onViewModeChange,
  cityTrend,
  hotspots,
  connectionStatus,
}: Props) {
  const statusMeta = STATUS_META[connectionStatus];

  return (
    <div className="w-[450px] h-full bg-[#f7f4ee] border-r border-[#ddd4c7] flex flex-col z-20 shadow-xl shrink-0">
      <div className="p-6 border-b border-[#ddd4c7] bg-[#f7f4ee]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white border border-[#ddd4c7] p-1 shadow-md overflow-hidden">
              <img src={climenceLogo} alt="Climence logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#302b24]">Climence</h1>
              <p className="text-xs text-[#5a7d69] font-bold tracking-widest uppercase">Command Center</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-[#ddd4c7] rounded-full px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full shadow ${statusMeta.dot} ${connectionStatus === 'open' ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266]">
              {statusMeta.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
        <CityTrendChart data={cityTrend} />
        <HotspotsList hotspots={hotspots} />
      </div>
    </div>
  );
}
