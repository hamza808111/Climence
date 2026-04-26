import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { useMap } from 'react-leaflet';
import type { TelemetryRecord } from '@climence/shared';

interface HeatLayerApi {
  heatLayer: (points: [number, number, number][], opts: unknown) => L.Layer;
}

export function HeatmapLayer({ drones }: { drones: TelemetryRecord[] }) {
  const map = useMap();

  useEffect(() => {
    if (!drones || drones.length === 0) return;
    const heatData: [number, number, number][] = drones.map(d => [d.lat, d.lng, d.pm25]);
    const heatLayer = (L as unknown as HeatLayerApi)
      .heatLayer(heatData, {
        radius: 70,
        blur: 60,
        max: 200,
        maxZoom: 13,
        gradient: { 0.2: '#10b981', 0.5: '#f59e0b', 1.0: '#ef4444' },
      })
      .addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, drones]);

  return null;
}
