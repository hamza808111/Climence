import { Router } from 'express';
import { authenticateUser } from '../features/auth/users';
import { createAuthToken } from '../features/auth/token';
import { validateLoginInput } from '../features/auth/validation';
import { requireAuth } from '../lib/auth';
import { sendBadRequest, sendUnauthorized } from '../lib/http';

const router = Router();

router.post('/login', (req, res) => {
  const validation = validateLoginInput(req.body);
  if (!validation.ok) {
    sendBadRequest(res, validation.error);
    return;
  }

  const user = authenticateUser(validation.payload.email, validation.payload.password);
  if (!user) {
    sendUnauthorized(res, 'Incorrect email or password.');
    return;
  }

  const { token, expiresAt } = createAuthToken(user);
  res.status(200).json({
    token,
    user,
    expiresAt,
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.authUser });
});

export default router;
