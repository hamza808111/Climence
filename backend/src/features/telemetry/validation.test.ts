import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DroneState } from '@climence/shared';
import { validateTelemetryPayload } from './validation';

describe('validateTelemetryPayload', () => {
  it('rejects non-object payloads', () => {
    const result = validateTelemetryPayload(null);
    assert.equal(result.ok, false);
  });

  it('rejects payloads with missing fleet array', () => {
    const result = validateTelemetryPayload({ items: [] });
    assert.equal(result.ok, false);
  });

  it('rejects invalid fleet entries', () => {
    const result = validateTelemetryPayload({
      fleet: [{ uuid: 'D-1', state: DroneState.IDLE }],
    });
    assert.equal(result.ok, false);
  });

  it('accepts valid telemetry payload', () => {
    const result = validateTelemetryPayload({
      fleet: [
        {
          uuid: 'DRONE-UNIT-001',
          state: DroneState.EN_ROUTE,
          batteryLevel: 83.4,
          rssi: -66,
          location: { lat: 24.7136, lng: 46.6753 },
          airQuality: {
            pm25: 74.2,
            co2: 523.1,
            no2: 18.4,
            temperature: 33.2,
            humidity: 27.1,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payload.fleet.length, 1);
      assert.equal(result.payload.fleet[0].uuid, 'DRONE-UNIT-001');
    }
  });
});
