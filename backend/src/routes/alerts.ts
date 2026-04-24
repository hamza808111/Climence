import { Router } from 'express';
import { UserRole } from '@climence/shared';
import {
  getActiveAlerts,
  getAlertThresholdConfig,
  setAlertThresholdPm25,
} from '../db/queries';
import { validateAlertThresholdInput } from '../features/alerts/config';
import { requireAuth, requireRole } from '../lib/auth';
import { sendBadRequest, sendInternalError } from '../lib/http';
import { broadcastSnapshot } from '../ws';

const router = Router();

router.get('/active', requireAuth, (_req, res) => {
  try {
    const config = getAlertThresholdConfig();
    res.status(200).json(getActiveAlerts(config.pm25_threshold));
  } catch (err) {
    sendInternalError(res, 'Database active alerts query error', err);
  }
});

router.get('/config', requireAuth, (_req, res) => {
  try {
    const config = getAlertThresholdConfig();
    res.status(200).json({
      pm25Threshold: config.pm25_threshold,
      updatedAt: config.updated_at,
    });
  } catch (err) {
    sendInternalError(res, 'Database alert config query error', err);
  }
});

router.put('/config', requireAuth, requireRole(UserRole.ADMINISTRATOR), (req, res) => {
  const validation = validateAlertThresholdInput(req.body);
  if (!validation.ok) {
    sendBadRequest(res, validation.error);
    return;
  }

  try {
    const updated = setAlertThresholdPm25(validation.pm25Threshold);
    // Push fresh snapshot so connected dashboards apply the new threshold instantly.
    broadcastSnapshot();
    res.status(200).json({
      pm25Threshold: updated.pm25_threshold,
      updatedAt: updated.updated_at,
    });
  } catch (err) {
    sendInternalError(res, 'Database alert config update error', err);
  }
});

export default router;
