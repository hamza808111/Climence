import { MapPin } from 'lucide-react';
import type { Hotspot } from '@climence/shared';

export function HotspotsList({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
        <MapPin className="w-4 h-4 mr-2 text-rose-400" /> Active Pollution Hotspots (5m)
      </h3>
      <div className="space-y-3">
        {hotspots.map((spot, i) => (
          <div
            key={`${spot.lat_zone}-${spot.lng_zone}`}
            className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="text-xs font-bold text-gray-500 w-4">#{i + 1}</div>
              <div>
                <div className="text-sm font-semibold text-gray-200">Zone Grid</div>
                <div className="text-[10px] text-gray-500 font-mono tracking-tighter">
                  [{spot.lat_zone}, {spot.lng_zone}]
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-rose-500">{Math.round(spot.avg_pm25)}</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold">µg/m³</div>
            </div>
          </div>
        ))}
        {hotspots.length === 0 && (
          <div className="text-center text-xs text-indigo-400/50 py-4 font-mono uppercase tracking-widest animate-pulse">
            Aggregating Grid Data...
          </div>
        )}
      </div>
    </div>
  );
}
