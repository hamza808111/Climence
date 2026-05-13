import assert from 'node:assert/strict';
import test from 'node:test';
import { DroneState } from '@climence/shared';
import {
  clusterLiveMapSensors,
  filterLiveMapSensors,
  nextReplayHistory,
  parseSavedViewPresets,
  serializeSavedViewPresets,
  type ReplayFrame,
  type SavedViewPreset,
} from '../src/lib/liveMap';
import type { RiyadhMapSensor } from '../src/components/map/RiyadhGoogleMap';

const baseSensor = (overrides: Partial<RiyadhMapSensor> = {}): RiyadhMapSensor => ({
  uuid: 'dr-1',
  label: 'Sensor DR-1',
  lat: 24.7,
  lng: 46.7,
  aqi: 120,
  pm25: 58,
  battery: 72,
  band: 'usg',
  droneState: DroneState.GATHERING_DATA,
  status: 'online',
  serverTimestamp: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

test('filters by status, pm25, and low battery chips', () => {
  const sensors = [
    baseSensor({ uuid: 'a', status: 'online', pm25: 40, battery: 70 }),
    baseSensor({ uuid: 'b', status: 'offline', pm25: 95, battery: 28 }),
    baseSensor({ uuid: 'c', status: 'online', pm25: 110, battery: 22 }),
  ];

  const filtered = filterLiveMapSensors(sensors, {
    status: 'online',
    minPm25: 80,
    lowBatteryOnly: true,
    batteryThreshold: 30,
  });

  assert.deepEqual(filtered.map(sensor => sensor.uuid), ['c']);
});

test('clusters nearby sensors and excludes singletons', () => {
  const sensors = [
    baseSensor({ uuid: 'a', lat: 24.7001, lng: 46.7001, pm25: 60, battery: 80 }),
    baseSensor({ uuid: 'b', lat: 24.7002, lng: 46.7002, pm25: 68, battery: 54 }),
    baseSensor({ uuid: 'c', lat: 24.8000, lng: 46.8000, pm25: 40, battery: 90 }),
  ];

  const clusters = clusterLiveMapSensors(sensors, { zoom: 13, minClusterSize: 2 });

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]?.count, 2);
  assert.ok((clusters[0]?.avgPm25 ?? 0) >= 60);
  assert.equal(clusters[0]?.memberUuids.includes('a'), true);
  assert.equal(clusters[0]?.memberUuids.includes('b'), true);
});

test('replay history keeps chronological cap and drops duplicate timestamps', () => {
  const frame = (n: number): ReplayFrame => ({
    emittedAt: `2026-04-26T00:00:${String(n).padStart(2, '0')}.000Z`,
    sensors: [baseSensor({ uuid: `dr-${n}` })],
  });

  let history: ReplayFrame[] = [];
  history = nextReplayHistory(history, frame(1), 3);
  history = nextReplayHistory(history, frame(1), 3);
  history = nextReplayHistory(history, frame(2), 3);
  history = nextReplayHistory(history, frame(3), 3);
  history = nextReplayHistory(history, frame(4), 3);

  assert.equal(history.length, 3);
  assert.equal(history[0]?.emittedAt.endsWith('02.000Z'), true);
  assert.equal(history[2]?.emittedAt.endsWith('04.000Z'), true);
});

test('saved presets round-trip through JSON parser safely', () => {
  const presets: SavedViewPreset[] = [
    { id: 'p1', name: 'North', lat: 24.78, lng: 46.66, zoom: 12.5, createdAt: '2026-04-26T00:00:00.000Z' },
  ];

  const serialized = serializeSavedViewPresets(presets);
  assert.deepEqual(parseSavedViewPresets(serialized), presets);
  assert.deepEqual(parseSavedViewPresets('not-json'), []);
});
