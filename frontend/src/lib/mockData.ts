/**
 * mockData.ts — static demo dataset for the Live ↔ Demo toggle.
 *
 * Returns a TelemetrySnapshot that is structurally identical to what the
 * WebSocket stream delivers, so the entire dashboard renders without any
 * backend connection.
 */
import type { TelemetrySnapshot, TelemetryRecord, CityTrendPoint, Hotspot } from '@climence/shared';

/* ─────────────────────────── helpers ─────────────────────────── */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genSeries(seed: number, n = 40, base = 130, amp = 30): number[] {
  const r = mulberry32(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * amp * 0.4;
    v = Math.max(base - amp, Math.min(base + amp, v));
    if (r() > 0.95) v += (r() - 0.3) * amp * 1.5;
    out.push(Math.max(10, v));
  }
  return out;
}

/* ─────────────────────────── drones (25 sensors) ─────────────────────────── */

interface DroneInit {
  uuid: string;
  lat: number;
  lng: number;
  pm25: number;
  co2: number;
  no2: number;
  temperature: number;
  humidity: number;
  batteryLevel: number;
  rssi: number;
  state: TelemetryRecord['state'];
}

const DRONE_INITS: DroneInit[] = [
  { uuid: 'demo-0001', lat: 24.751, lng: 46.851, pm25: 185, co2: 780, no2: 68, temperature: 38, humidity: 18, batteryLevel: 72, rssi: -58, state: 'INVESTIGATING_HAZARD' },
  { uuid: 'demo-0002', lat: 24.712, lng: 46.689, pm25: 152, co2: 690, no2: 54, temperature: 37, humidity: 20, batteryLevel: 85, rssi: -62, state: 'GATHERING_DATA' },
  { uuid: 'demo-0003', lat: 24.735, lng: 46.578, pm25: 134, co2: 640, no2: 43, temperature: 36, humidity: 22, batteryLevel: 91, rssi: -55, state: 'GATHERING_DATA' },
  { uuid: 'demo-0004', lat: 24.961, lng: 46.700, pm25: 118, co2: 570, no2: 36, temperature: 35, humidity: 24, batteryLevel: 63, rssi: -70, state: 'EN_ROUTE' },
  { uuid: 'demo-0005', lat: 24.691, lng: 46.686, pm25: 108, co2: 540, no2: 31, temperature: 37, humidity: 21, batteryLevel: 78, rssi: -60, state: 'GATHERING_DATA' },
  { uuid: 'demo-0006', lat: 24.668, lng: 46.624, pm25: 79,  co2: 430, no2: 22, temperature: 36, humidity: 25, batteryLevel: 88, rssi: -52, state: 'GATHERING_DATA' },
  { uuid: 'demo-0007', lat: 24.602, lng: 46.555, pm25: 38,  co2: 380, no2: 14, temperature: 34, humidity: 28, batteryLevel: 95, rssi: -48, state: 'IDLE' },
  { uuid: 'demo-0008', lat: 24.680, lng: 46.720, pm25: 148, co2: 670, no2: 51, temperature: 37, humidity: 19, batteryLevel: 67, rssi: -65, state: 'GATHERING_DATA' },
  { uuid: 'demo-0009', lat: 24.645, lng: 46.600, pm25: 92,  co2: 480, no2: 27, temperature: 36, humidity: 23, batteryLevel: 82, rssi: -57, state: 'GATHERING_DATA' },
  { uuid: 'demo-0010', lat: 24.720, lng: 46.800, pm25: 161, co2: 710, no2: 58, temperature: 38, humidity: 17, batteryLevel: 54, rssi: -72, state: 'GATHERING_DATA' },
  { uuid: 'demo-0011', lat: 24.630, lng: 46.570, pm25: 55,  co2: 400, no2: 18, temperature: 34, humidity: 27, batteryLevel: 89, rssi: -50, state: 'IDLE' },
  { uuid: 'demo-0012', lat: 24.700, lng: 46.750, pm25: 125, co2: 600, no2: 40, temperature: 37, humidity: 20, batteryLevel: 76, rssi: -63, state: 'GATHERING_DATA' },
  { uuid: 'demo-0013', lat: 24.690, lng: 46.660, pm25: 139, co2: 645, no2: 46, temperature: 37, humidity: 21, batteryLevel: 81, rssi: -59, state: 'GATHERING_DATA' },
  { uuid: 'demo-0014', lat: 24.655, lng: 46.620, pm25: 67,  co2: 420, no2: 20, temperature: 35, humidity: 26, batteryLevel: 93, rssi: -53, state: 'GATHERING_DATA' },
  { uuid: 'demo-0015', lat: 24.740, lng: 46.700, pm25: 170, co2: 730, no2: 62, temperature: 39, humidity: 16, batteryLevel: 60, rssi: -68, state: 'INVESTIGATING_HAZARD' },
  { uuid: 'demo-0016', lat: 24.670, lng: 46.630, pm25: 85,  co2: 460, no2: 25, temperature: 36, humidity: 24, batteryLevel: 0,  rssi: -90, state: 'OFFLINE' },
  { uuid: 'demo-0017', lat: 24.620, lng: 46.660, pm25: 62,  co2: 415, no2: 17, temperature: 35, humidity: 27, batteryLevel: 87, rssi: -54, state: 'IDLE' },
  { uuid: 'demo-0018', lat: 24.600, lng: 46.545, pm25: 44,  co2: 385, no2: 15, temperature: 33, humidity: 29, batteryLevel: 97, rssi: -46, state: 'IDLE' },
  { uuid: 'demo-0019', lat: 24.760, lng: 46.840, pm25: 178, co2: 760, no2: 65, temperature: 38, humidity: 17, batteryLevel: 70, rssi: -61, state: 'GATHERING_DATA' },
  { uuid: 'demo-0020', lat: 24.725, lng: 46.770, pm25: 143, co2: 660, no2: 49, temperature: 37, humidity: 20, batteryLevel: 74, rssi: -64, state: 'GATHERING_DATA' },
  { uuid: 'demo-0021', lat: 24.660, lng: 46.700, pm25: 99,  co2: 510, no2: 30, temperature: 36, humidity: 22, batteryLevel: 83, rssi: -56, state: 'GATHERING_DATA' },
  { uuid: 'demo-0022', lat: 24.710, lng: 46.640, pm25: 116, co2: 560, no2: 37, temperature: 36, humidity: 22, batteryLevel: 79, rssi: -60, state: 'GATHERING_DATA' },
  { uuid: 'demo-0023', lat: 24.680, lng: 46.590, pm25: 73,  co2: 440, no2: 21, temperature: 35, humidity: 25, batteryLevel: 90, rssi: -51, state: 'IDLE' },
  { uuid: 'demo-0024', lat: 24.770, lng: 46.760, pm25: 157, co2: 700, no2: 56, temperature: 38, humidity: 18, batteryLevel: 65, rssi: -67, state: 'GATHERING_DATA' },
  { uuid: 'demo-0025', lat: 24.640, lng: 46.680, pm25: 82,  co2: 450, no2: 24, temperature: 35, humidity: 26, batteryLevel: 86, rssi: -53, state: 'GATHERING_DATA' },
];

const NOW = new Date().toISOString();

const MOCK_DRONES: TelemetryRecord[] = DRONE_INITS.map((d, i) => ({
  id: i + 1,
  uuid: d.uuid,
  state: d.state,
  batteryLevel: d.batteryLevel,
  lat: d.lat,
  lng: d.lng,
  pm25: d.pm25,
  co2: d.co2,
  no2: d.no2,
  temperature: d.temperature,
  humidity: d.humidity,
  rssi: d.rssi,
  client_timestamp: NOW,
  server_timestamp: NOW,
}));

/* ─────────────────────────── alerts ─────────────────────────── */

const MOCK_ALERTS: TelemetryRecord[] = MOCK_DRONES.filter(
  d => d.pm25 >= 140 && d.state !== 'OFFLINE',
).slice(0, 5);

/* ─────────────────────────── city trend (40 buckets) ─────────────────────────── */

const pm25BaseSeries = genSeries(42, 40, 120, 35);
const co2BaseSeries  = genSeries(99, 40, 580, 80);
const no2BaseSeries  = genSeries(17, 40, 45, 15);

const MOCK_CITY_TREND: CityTrendPoint[] = pm25BaseSeries.map((pm25, i) => {
  const dt = new Date(Date.now() - (40 - i) * 30 * 60 * 1000);
  return {
    minute_label: dt.toISOString(),
    avg_pm25: Math.round(pm25),
    avg_co2: Math.round(co2BaseSeries[i] ?? 580),
    avg_no2: Math.round(no2BaseSeries[i] ?? 45),
  };
});

/* ─────────────────────────── hotspots ─────────────────────────── */

const MOCK_HOTSPOTS: Hotspot[] = [
  { lat_zone: 24.750, lng_zone: 46.850, avg_pm25: 185 },
  { lat_zone: 24.710, lng_zone: 46.690, avg_pm25: 155 },
  { lat_zone: 24.735, lng_zone: 46.578, avg_pm25: 134 },
  { lat_zone: 24.720, lng_zone: 46.800, avg_pm25: 161 },
  { lat_zone: 24.740, lng_zone: 46.700, avg_pm25: 170 },
];

/* ─────────────────────────── SNAPSHOT export ─────────────────────────── */

/**
 * Returns a fresh mock snapshot each time (timestamps are recalculated).
 * Use this everywhere the live snapshot is used when dataSource === 'demo'.
 */
export function getMockSnapshot(): TelemetrySnapshot {
  const ts = new Date().toISOString();
  return {
    drones: MOCK_DRONES.map(d => ({ ...d, server_timestamp: ts, client_timestamp: ts })),
    alerts: MOCK_ALERTS.map(d => ({ ...d, server_timestamp: ts, client_timestamp: ts })),
    cityTrend: MOCK_CITY_TREND,
    hotspots: MOCK_HOTSPOTS,
    alertThresholdPm25: 140,
    emittedAt: ts,
  };
}

/** Stable singleton for initial render (avoids recreating on every re-render). */
export const MOCK_SNAPSHOT: TelemetrySnapshot = getMockSnapshot();
