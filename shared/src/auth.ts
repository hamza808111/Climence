export const UserRole = {
  ADMINISTRATOR: 'administrator',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  expiresAt: string;
}
