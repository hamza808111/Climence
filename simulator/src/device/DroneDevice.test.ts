import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { DroneState, ENVIRONMENT_MAP } from '@climence/shared';
import { DroneDevice } from '../DroneDevice';

describe('DroneDevice', () => {
  beforeEach(() => {
    DroneDevice.resetEnvironment();
  });

  it('enters INVESTIGATING_HAZARD when assigned to its current position', () => {
    const drone = new DroneDevice(1);
    const now = Date.now();
    const here = drone.getTelemetry().location;
    const assigned = drone.assignHazardTarget('hazard-local', here.lat, here.lng);
    assert.equal(assigned, true);

    drone.tick(now + 1_000);
    assert.equal(drone.state, DroneState.INVESTIGATING_HAZARD);
  });

  it('reduces hotspot pollution while investigating a hazard', () => {
    const drone = new DroneDevice(2);
    const hotspot = ENVIRONMENT_MAP[0];
    const assigned = drone.assignHazardTarget('hazard-hotspot', hotspot.lat, hotspot.lng);
    assert.equal(assigned, true);

    let now = Date.now();
    for (let i = 0; i < 120 && drone.state !== DroneState.INVESTIGATING_HAZARD; i += 1) {
      now += 5_000;
      drone.tick(now);
    }
    assert.equal(drone.state, DroneState.INVESTIGATING_HAZARD);

    const before = DroneDevice.getEnvironmentSnapshot().find(
      spot => spot.lat === hotspot.lat && spot.lng === hotspot.lng,
    );
    assert.ok(before);

    for (let i = 0; i < 6; i += 1) {
      now += 5_000;
      drone.tick(now);
    }

    const after = DroneDevice.getEnvironmentSnapshot().find(
      spot => spot.lat === hotspot.lat && spot.lng === hotspot.lng,
    );
    assert.ok(after);
    assert.ok(after.peakPm25 < before.peakPm25);
    assert.ok(after.peakCo2 < before.peakCo2);
  });
});
