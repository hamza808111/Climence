import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserRole, type AuthUser } from '@climence/shared';
import { createAuthToken, verifyAuthToken } from './token';

const SAMPLE_USER: AuthUser = {
  id: 'u-analyst',
  email: 'analyst@mewa.gov.sa',
  name: 'Riyadh Analyst',
  role: UserRole.ANALYST,
};

describe('auth token', () => {
  it('verifies a valid token', () => {
    const { token } = createAuthToken(SAMPLE_USER);
    const decoded = verifyAuthToken(token);
    assert.ok(decoded);
    assert.equal(decoded?.id, SAMPLE_USER.id);
    assert.equal(decoded?.email, SAMPLE_USER.email);
    assert.equal(decoded?.role, SAMPLE_USER.role);
  });

  it('rejects a tampered token', () => {
    const { token } = createAuthToken(SAMPLE_USER);
    const tampered = `${token}x`;
    const decoded = verifyAuthToken(tampered);
    assert.equal(decoded, null);
  });
});
