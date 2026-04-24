import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateLoginInput } from './validation';

describe('validateLoginInput', () => {
  it('rejects non-object payload', () => {
    const result = validateLoginInput(null);
    assert.equal(result.ok, false);
  });

  it('rejects missing fields', () => {
    const result = validateLoginInput({ email: 'admin@mewa.gov.sa' });
    assert.equal(result.ok, false);
  });

  it('normalizes valid payload', () => {
    const result = validateLoginInput({
      email: '  ADMIN@MEWA.GOV.SA ',
      password: 'Admin123!',
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payload.email, 'admin@mewa.gov.sa');
      assert.equal(result.payload.password, 'Admin123!');
    }
  });
});
