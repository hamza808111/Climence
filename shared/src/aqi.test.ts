import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aqiBandFor, bandKeyForPm25, pm25ToAqi } from './aqi';

describe('aqi conversions', () => {
  it('maps PM2.5 to expected AQI ranges', () => {
    assert.equal(pm25ToAqi(10), 42);
    assert.equal(pm25ToAqi(35.4), 100);
    assert.equal(pm25ToAqi(55.4), 150);
    assert.equal(pm25ToAqi(500.4), 500);
  });

  it('returns expected AQI band keys', () => {
    assert.equal(bandKeyForPm25(8), 'good');
    assert.equal(bandKeyForPm25(25), 'mod');
    assert.equal(bandKeyForPm25(42), 'usg');
    assert.equal(bandKeyForPm25(180), 'vunh');
  });

  it('keeps hazardous as last fallback band', () => {
    assert.equal(aqiBandFor(99999).key, 'haz');
  });
});
