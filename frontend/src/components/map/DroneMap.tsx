import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { RIYADH_CENTER, type TelemetryRecord } from '@climence/shared';
import '../../lib/leaflet-icons';
import { AlertLayer } from './AlertLayer';
import { HeatmapLayer } from './HeatmapLayer';

export type ViewMode = 'markers' | 'heatmap';

interface Props {
  drones: TelemetryRecord[];
  alerts: TelemetryRecord[];
  viewMode: ViewMode;
  onSelectDrone: (uuid: string) => void;
}

export function DroneMap({ drones, alerts, viewMode, onSelectDrone }: Props) {
  return (
    <MapContainer
      center={[RIYADH_CENTER.lat, RIYADH_CENTER.lng]}
      zoom={11}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution="&copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <AlertLayer alerts={alerts} />
      {viewMode === 'markers' &&
        drones.map(drone => (
          <Marker
            key={drone.uuid}
            position={[drone.lat, drone.lng]}
            eventHandlers={{ click: () => onSelectDrone(drone.uuid) }}
          />
        ))}
      {viewMode === 'heatmap' && <HeatmapLayer drones={drones} />}
    </MapContainer>
  );
}
