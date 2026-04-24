import type { LoginRequest } from '@climence/shared';

export type LoginValidation =
  | { ok: true; payload: LoginRequest }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateLoginInput(input: unknown): LoginValidation {
  if (!isObject(input)) {
    return { ok: false, error: 'Invalid payload. Expected an object body.' };
  }

  const { email, password } = input;
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return { ok: false, error: 'Invalid payload. "email" and "password" are required.' };
  }

  return {
    ok: true,
    payload: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}
