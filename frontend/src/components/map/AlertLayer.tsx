import { Circle, Popup } from 'react-leaflet';
import { AlertTriangle } from 'lucide-react';
import type { TelemetryRecord } from '@climence/shared';

export function AlertLayer({ alerts }: { alerts: TelemetryRecord[] }) {
  if (alerts.length === 0) return null;

  return (
    <>
      {alerts.map(alert => (
        <Circle
          key={`alert-${alert.uuid}`}
          center={[alert.lat, alert.lng]}
          radius={500}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#f87171',
            fillOpacity: 0.5,
            className: 'danger-pulse',
          }}
        >
          <Popup>
            <div className="p-2 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800 uppercase tracking-tight text-sm mb-1">
                ⚠️ Critical Hazard
              </h3>
              <p className="text-xs text-gray-600 leading-tight border-b border-gray-200 pb-2 mb-2">
                <strong className="text-rose-500 text-sm">{alert.pm25} µg/m³</strong> PM2.5 detected.
              </p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Residents are advised to stay indoors.
              </p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}
