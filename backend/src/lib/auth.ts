import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@climence/shared';
import { verifyAuthToken } from '../features/auth/token';
import { sendForbidden, sendUnauthorized } from './http';

function extractBearerToken(req: Request) {
  const authHeader = req.header('authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    sendUnauthorized(res, 'Authentication required.');
    return;
  }

  const user = verifyAuthToken(token);
  if (!user) {
    sendUnauthorized(res, 'Invalid or expired token.');
    return;
  }

  req.authUser = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      sendUnauthorized(res, 'Authentication required.');
      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      sendForbidden(res, 'Insufficient permissions.');
      return;
    }

    next();
  };
}
