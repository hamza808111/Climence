import type { LoginResponse } from '@climence/shared';

const STORAGE_KEY = 'climence.auth.session';

export type AuthSession = LoginResponse;

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.expiresAt !== 'string' ||
      !parsed.user ||
      typeof parsed.user.id !== 'string'
    ) {
      return null;
    }
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isSessionExpired(session: AuthSession) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}
