/**
 * P3 — Forecast service (FR-11)
 *
 * Strategy: two-stage statistical baseline
 *   1. Seasonal baseline: hour-of-day mean over available history
 *      (captures daily pollution cycles — rush hours, night lows).
 *   2. AR(1) correction: last reading's residual (actual - baseline) × decay
 *      applied to near-horizon hours.
 *
 * Degrades gracefully:
 *   - < 6 hours of data → naive mean of available readings.
 *   - Missing hour-of-day baseline → global mean.
 *
 * The interface is structured so a future IForecastStrategy
 * (Python/ONNX inference, etc.) can drop in behind the same call.
 */

import { aqiBandFor, pm25ToAqi } from '@climence/shared';
import type { ForecastPoint } from '@climence/shared';

export interface HourlyReading {
  /** ISO datetime string for the start of the hour. */
  hourIso: string;
  avgPm25: number;
}

const AR1_DECAY = 0.7; // residual weight decays per horizon hour
const MIN_READINGS_FOR_SEASONAL = 6;

/**
 * Build a map of hour-of-day (0-23) → mean PM2.5 from historical readings.
 */
function buildHourOfDayBaseline(history: HourlyReading[]): Map<number, number> {
  const buckets = new Map<number, number[]>();

  for (const r of history) {
    const hour = new Date(r.hourIso).getUTCHours();
    if (!buckets.has(hour)) buckets.set(hour, []);
    buckets.get(hour)!.push(r.avgPm25);
  }

  const baseline = new Map<number, number>();
  for (const [h, vals] of buckets) {
    baseline.set(h, vals.reduce((s, v) => s + v, 0) / vals.length);
  }
  return baseline;
}

/**
 * Compute the mean PM2.5 of a set of readings.
 */
function mean(readings: HourlyReading[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((s, r) => s + r.avgPm25, 0) / readings.length;
}

/**
 * Forecast PM2.5 for the next `horizonHours` hours.
 *
 * @param history       All available hourly readings (oldest-first).
 * @param horizonHours  Number of hours to forecast (default 6).
 * @param nowOverride   Optional: override "now" for testing.
 */
export function computeForecast(
  history: HourlyReading[],
  horizonHours: number = 6,
  nowOverride?: Date,
): ForecastPoint[] {
  const now = nowOverride ?? new Date();

  if (history.length < MIN_READINGS_FOR_SEASONAL) {
    // Naive fallback: flat mean of available data
    const flatMean = history.length > 0 ? mean(history) : 50;
    return buildFlatForecast(flatMean, horizonHours, now);
  }

  const baseline = buildHourOfDayBaseline(history);
  const globalMean = mean(history);

  // Last known reading for AR(1) residual
  const lastReading = history[history.length - 1];
  const lastHour = new Date(lastReading.hourIso).getUTCHours();
  const lastBaseline = baseline.get(lastHour) ?? globalMean;
  let residual = lastReading.avgPm25 - lastBaseline;

  const forecast: ForecastPoint[] = [];

  for (let h = 1; h <= horizonHours; h++) {
    const forecastTime = new Date(now.getTime() + h * 60 * 60 * 1000);
    const forecastHour = forecastTime.getUTCHours();
    const hourBaseline = baseline.get(forecastHour) ?? globalMean;

    // AR(1): decay the residual each step
    residual *= AR1_DECAY;
    const predictedPm25 = Math.max(0, hourBaseline + residual);

    const aqi = pm25ToAqi(predictedPm25);
    const band = aqiBandFor(aqi).key;

    // Confidence decreases with horizon
    const confidence = parseFloat(Math.max(0.1, 1 - (h - 1) * 0.12).toFixed(2));

    forecast.push({
      hourIso: forecastTime.toISOString(),
      aqi,
      band,
      confidence,
    });
  }

  return forecast;
}

/** Build a flat forecast for when there's insufficient data. */
function buildFlatForecast(
  flatPm25: number,
  horizonHours: number,
  now: Date,
): ForecastPoint[] {
  const aqi = pm25ToAqi(flatPm25);
  const band = aqiBandFor(aqi).key;

  return Array.from({ length: horizonHours }, (_, i) => ({
    hourIso: new Date(now.getTime() + (i + 1) * 60 * 60 * 1000).toISOString(),
    aqi,
    band,
    confidence: 0.3,
  }));
}
