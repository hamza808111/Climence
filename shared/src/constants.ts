export const RIYADH_BOUNDS = {
  minLat: 24.5,
  maxLat: 24.9,
  minLng: 46.5,
  maxLng: 46.9,
} as const;

export const RIYADH_CENTER = { lat: 24.7136, lng: 46.6753 } as const;

export interface PollutionHotspot {
  lat: number;
  lng: number;
  peakPm25: number;
  peakCo2: number;
}

export const ENVIRONMENT_MAP: readonly PollutionHotspot[] = [
  { lat: 24.55, lng: 46.75, peakPm25: 180, peakCo2: 800 }, // Industrial Zone
  { lat: 24.68, lng: 46.68, peakPm25: 130, peakCo2: 600 }, // High Traffic Intersection
  { lat: 24.80, lng: 46.60, peakPm25: 110, peakCo2: 550 }, // North Development
];

export const PM25_ALERT_THRESHOLD = 140;
export const TELEMETRY_INTERVAL_MS = 5000;
export const DRONE_FLEET_SIZE = 25;
export const API_PORT = 3000;
export const API_BASE_URL = `http://localhost:${API_PORT}`;
