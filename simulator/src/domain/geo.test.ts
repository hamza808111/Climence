import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    assert.equal(haversineKm(24.7136, 46.6753, 24.7136, 46.6753), 0);
  });

  it('is symmetric and positive for different points', () => {
    const aToB = haversineKm(24.7136, 46.6753, 24.8, 46.6);
    const bToA = haversineKm(24.8, 46.6, 24.7136, 46.6753);
    assert.ok(aToB > 0);
    assert.ok(Math.abs(aToB - bToA) < 0.000001);
  });

  it('stays within expected magnitude inside Riyadh bounds', () => {
    const maxSpanKm = haversineKm(24.5, 46.5, 24.9, 46.9);
    assert.ok(maxSpanKm > 50);
    assert.ok(maxSpanKm < 70);
  });
});
