import type { AuthUser } from '@climence/shared';
import { UserRole } from '@climence/shared';

interface AuthUserRecord extends AuthUser {
  password: string;
}

const DEMO_USERS: AuthUserRecord[] = [
  {
    id: 'u-admin',
    name: 'Riyadh Admin',
    email: 'admin@mewa.gov.sa',
    role: UserRole.ADMINISTRATOR,
    password: 'Admin123!',
  },
  {
    id: 'u-analyst',
    name: 'Riyadh Analyst',
    email: 'analyst@mewa.gov.sa',
    role: UserRole.ANALYST,
    password: 'Analyst123!',
  },
  {
    id: 'u-viewer',
    name: 'Riyadh Viewer',
    email: 'viewer@mewa.gov.sa',
    role: UserRole.VIEWER,
    password: 'Viewer123!',
  },
];

export function authenticateUser(email: string, password: string): AuthUser | null {
  const user = DEMO_USERS.find(item => item.email === email.trim().toLowerCase());
  if (!user || user.password !== password) return null;

  const { password: _password, ...safeUser } = user;
  return safeUser;
}
