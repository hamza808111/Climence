import { Router } from 'express';
import { getCityTrend, getHotspots } from '../db/queries';
import { requireAuth } from '../lib/auth';
import { sendInternalError } from '../lib/http';

const router = Router();

router.get('/city-trend', requireAuth, (_req, res) => {
  try {
    res.status(200).json(getCityTrend());
  } catch (err) {
    sendInternalError(res, 'Database city-trend query error', err);
  }
});

router.get('/hotspots', requireAuth, (_req, res) => {
  try {
    res.status(200).json(getHotspots());
  } catch (err) {
    sendInternalError(res, 'Database hotspots query error', err);
  }
});

export default router;
