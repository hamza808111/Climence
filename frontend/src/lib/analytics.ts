import { aqiBandFor, pm25ToAqi, type AqiBandKey } from '@climence/shared';

// ---------- linear trend detection (spec §8) ----------

export interface TrendResult {
  slope: number;
  direction: 'improving' | 'stable' | 'worsening';
  label: string;
}

/**
 * Ordinary-least-squares slope of the last `window` values vs. index.
 * Returns a classification per spec §8:
 *   slope > +epsilon => worsening (air getting dirtier)
 *   slope < -epsilon => improving
 *   |slope| <= epsilon => stable
 * Epsilon is expressed in AQI points per sample.
 */
export function detectTrend(series: number[], epsilon = 0.4): TrendResult {
  if (series.length < 4) return { slope: 0, direction: 'stable', label: 'Stable' };

  const window = series.slice(-Math.min(series.length, 24));
  const n = window.length;
  const xMean = (n - 1) / 2;
  const yMean = window.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - xMean;
    num += dx * (window[i] - yMean);
    den += dx * dx;
  }
  const slope = den === 0 ? 0 : num / den;

  if (slope > epsilon) return { slope, direction: 'worsening', label: 'Worsening' };
  if (slope < -epsilon) return { slope, direction: 'improving', label: 'Improving' };
  return { slope, direction: 'stable', label: 'Stable' };
}

// ---------- short-horizon AQI forecast (FR-11) ----------

export interface ForecastPoint {
  hr: string;
  val: number;
  band: AqiBandKey;
}

/**
 * Project the next `hours` steps of AQI by extrapolating the recent trend and
 * applying gentle mean reversion toward the overall baseline. Not an ML model —
 * a lightweight statistical forecast that is at least anchored to live data.
 */
export function computeForecast(
  aqiSeries: number[],
  hours = 6,
  startHour = new Date().getHours(),
): ForecastPoint[] {
  if (aqiSeries.length === 0) {
    return Array.from({ length: hours }, (_, i) => ({
      hr: `${String((startHour + i + 1) % 24).padStart(2, '0')}:00`,
      val: 0,
      band: 'good' as AqiBandKey,
    }));
  }

  const trend = detectTrend(aqiSeries);
  const baseline = aqiSeries.reduce((s, v) => s + v, 0) / aqiSeries.length;
  const last = aqiSeries[aqiSeries.length - 1];

  const out: ForecastPoint[] = [];
  let value = last;
  for (let i = 0; i < hours; i += 1) {
    // Trend carries forward, attenuating each hour.
    const trendComponent = trend.slope * (1 - i / (hours * 2));
    // Pull ~15% toward baseline each hour (natural dispersion).
    const revertComponent = (baseline - value) * 0.15;
    // Hourly noise so the chart doesn't look perfectly linear.
    const noise = (Math.sin((startHour + i) * 1.7) + Math.cos((startHour + i) * 0.8)) * 3;
    value = Math.max(5, Math.round(value + trendComponent * 3 + revertComponent + noise));
    const band = aqiBandFor(value).key;
    const hh = String((startHour + i + 1) % 24).padStart(2, '0');
    out.push({ hr: `${hh}:00`, val: value, band });
  }
  return out;
}

// ---------- pollution drift from the sensor grid ----------

export interface WindVector {
  headingDeg: number; // direction pollution is flowing TO (0=N, 90=E, 180=S, 270=W)
  cardinal: string;
  speedKmh: number;
  description: string;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function cardinalFromHeading(deg: number) {
  const wrapped = ((deg % 360) + 360) % 360;
  return COMPASS[Math.round(wrapped / 45) % 8];
}

/**
 * Approximate a drift vector for pollution by taking the weighted centroid of
 * high-PM2.5 sensors and comparing it to the city center. The result is a
 * live analogue of "where the dirty air is headed" rather than an actual
 * weather wind reading.
 */
export function computeDriftVector(
  sensors: Array<{ lat: number; lng: number; pm25: number }>,
): WindVector {
  if (sensors.length === 0) {
    return { headingDeg: 135, cardinal: 'SE', speedKmh: 10, description: 'No sensor data' };
  }

  let sumLat = 0;
  let sumLng = 0;
  let sumW = 0;
  let sumPm25 = 0;

  for (const s of sensors) {
    // Only weight the top portion of readings so noise near the baseline
    // doesn't swamp the hotspot signal.
    const weight = Math.max(0, s.pm25 - 20);
    sumLat += s.lat * weight;
    sumLng += s.lng * weight;
    sumW += weight;
    sumPm25 += s.pm25;
  }

  const avgLat = sensors.reduce((s, v) => s + v.lat, 0) / sensors.length;
  const avgLng = sensors.reduce((s, v) => s + v.lng, 0) / sensors.length;

  const centroidLat = sumW > 0 ? sumLat / sumW : avgLat;
  const centroidLng = sumW > 0 ? sumLng / sumW : avgLng;

  // Vector from geographic center toward pollution centroid.
  const dLat = centroidLat - avgLat;
  const dLng = centroidLng - avgLng;

  // atan2(dLng, dLat) * 180/PI gives bearing from north, east positive.
  const headingDeg = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

  // Speed proxy: distance (km) times pollution intensity.
  const distKm = Math.hypot(dLat * 111, dLng * 111 * Math.cos((avgLat * Math.PI) / 180));
  const meanPm25 = sumPm25 / sensors.length;
  const speedKmh = Math.max(4, Math.min(32, Math.round(distKm * 2 + meanPm25 / 12)));

  const cardinal = cardinalFromHeading(headingDeg);
  const description =
    meanPm25 > 100
      ? 'Dust advisory · particulates aloft'
      : meanPm25 > 60
        ? 'Elevated pollutants · moderate drift'
        : 'Air flowing through city';

  return { headingDeg, cardinal, speedKmh, description };
}

// ---------- source attribution heuristic (FR-12 demo) ----------

export interface SourceAttribution {
  key: 'traffic' | 'industry' | 'dust' | 'other';
  name: string;
  pct: number;
  color: string;
}

/**
 * Heuristic source breakdown from live telemetry. Not ground-truth ML
 * attribution — this is a deterministic mapping so the panel reacts to
 * real sensor conditions instead of showing a frozen 38/28/22/12 split.
 */
export function computeSourceAttribution(sensors: Array<{
  pm25: number;
  co2: number;
  no2: number;
  humidity: number;
}>): SourceAttribution[] {
  if (sensors.length === 0) {
    return [
      { key: 'traffic', name: 'Traffic', pct: 38, color: 'oklch(0.68 0.20 28)' },
      { key: 'industry', name: 'Industry', pct: 28, color: 'oklch(0.55 0.20 340)' },
      { key: 'dust', name: 'Dust / storms', pct: 22, color: 'oklch(0.78 0.17 60)' },
      { key: 'other', name: 'Other', pct: 12, color: 'oklch(0.52 0.04 270)' },
    ];
  }

  const mean = <K extends 'pm25' | 'co2' | 'no2' | 'humidity'>(k: K) =>
    sensors.reduce((s, v) => s + v[k], 0) / sensors.length;

  const avgPm25 = mean('pm25');
  const avgCo2 = mean('co2');
  const avgNo2 = mean('no2');
  const avgHumidity = mean('humidity');

  // Traffic: correlated with NO2 and CO2.
  const trafficRaw = avgNo2 * 1.1 + Math.max(0, avgCo2 - 400) * 0.05;
  // Industry: heavy particulates with elevated CO2.
  const industryRaw = Math.max(0, avgPm25 - 40) * 0.8 + Math.max(0, avgCo2 - 500) * 0.04;
  // Dust: high PM with low humidity (Saudi context).
  const dustRaw = Math.max(0, avgPm25 - 25) * (avgHumidity < 30 ? 1.2 : 0.5);
  const otherRaw = 10;

  const total = trafficRaw + industryRaw + dustRaw + otherRaw;
  const pct = (raw: number) => Math.max(4, Math.round((raw / total) * 100));
  const tPct = pct(trafficRaw);
  const iPct = pct(industryRaw);
  const dPct = pct(dustRaw);
  // Force sum to 100 by absorbing rounding into the `other` bucket.
  const oPct = Math.max(4, 100 - tPct - iPct - dPct);

  return [
    { key: 'traffic', name: 'Traffic', pct: tPct, color: 'oklch(0.68 0.20 28)' },
    { key: 'industry', name: 'Industry', pct: iPct, color: 'oklch(0.55 0.20 340)' },
    { key: 'dust', name: 'Dust / storms', pct: dPct, color: 'oklch(0.78 0.17 60)' },
    { key: 'other', name: 'Other', pct: oPct, color: 'oklch(0.52 0.04 270)' },
  ];
}

export { aqiBandFor, pm25ToAqi };
