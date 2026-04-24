import type { CityTrendPoint, Hotspot, TelemetryRecord } from './telemetry';

// Single snapshot of everything the dashboard renders.
// Server sends one on connect, then one per simulator tick.
export interface TelemetrySnapshot {
  drones: TelemetryRecord[];
  alerts: TelemetryRecord[];
  cityTrend: CityTrendPoint[];
  hotspots: Hotspot[];
  alertThresholdPm25: number;
  emittedAt: string;
}

export type ServerMessage = { type: 'snapshot'; data: TelemetrySnapshot };

export const WS_PATH = '/ws/telemetry';
