import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PM25_THRESHOLD, MIN_PM25_THRESHOLD, validateAlertThresholdInput } from './config';

describe('validateAlertThresholdInput', () => {
  it('rejects non-object payloads', () => {
    const result = validateAlertThresholdInput(null);
    assert.equal(result.ok, false);
  });

  it('rejects missing threshold field', () => {
    const result = validateAlertThresholdInput({});
    assert.equal(result.ok, false);
  });

  it('rejects out-of-range thresholds', () => {
    const tooLow = validateAlertThresholdInput({ pm25Threshold: MIN_PM25_THRESHOLD - 1 });
    const tooHigh = validateAlertThresholdInput({ pm25Threshold: MAX_PM25_THRESHOLD + 1 });

    assert.equal(tooLow.ok, false);
    assert.equal(tooHigh.ok, false);
  });

  it('accepts and normalizes valid thresholds', () => {
    const result = validateAlertThresholdInput({ pm25Threshold: 149.56 });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.pm25Threshold, 149.6);
    }
  });
});
