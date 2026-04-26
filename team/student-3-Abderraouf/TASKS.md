# Student 3 — Abderraouf
## Role: Backend · Analytics, Hotspots, Forecast

You own **the math**. Every numeric badge, colored zone, and trend line on the dashboard ultimately traces back to code you own. Three planned items sit here: proper hotspot detection (FR-10), the forecast backend (FR-11), and source attribution (FR-12).

### Summary

- Analytics endpoints (`/api/analytics/*`) and the SQL behind them.
- Hotspot detection algorithm per spec §8 (center-of-gravity + radius).
- Trend detection with slope classification (§8).
- Forecast service (start simple, upgrade to ML later).
- Source attribution (rule-based now, expose the seam for a model later).
- The shared AQI math in [shared/src/aqi.ts](../../shared/src/aqi.ts).

### Files you own

- [backend/src/routes/analytics.ts](../../backend/src/routes/analytics.ts)
- Analytics SQL inside [backend/src/db/queries.ts](../../backend/src/db/queries.ts) — specifically: `getCityTrend`, `getHotspots`, anything new you add (`getHistoricalTrend`, `getForecastWindow`, etc.)
- New folder: [backend/src/features/analytics/](../../backend/src/features/analytics/) — forecast, hotspot center-of-gravity, trend classification, source attribution
- [shared/src/aqi.ts](../../shared/src/aqi.ts)

### Requirements

- **FR-05** Zoom/pan regions
- **FR-06** Pollutant switching
- **FR-07** AQI by region
- **FR-08** Filter by time / pollutant / location
- **FR-09** Historical trends (daily/weekly/monthly)
- **FR-10** Hotspot detection
- **FR-11** Forecast
- **FR-12** Source attribution
- **UC1** Real-time map (regional aggregation)
- **UC2** Historical trends
- **UC3** Forecast
- **UC-A1** Filter data
- **UC-A2** Identify hotspots

---

## Prioritized tasks

### P0 — Proper hotspot detection (spec §8)

**Files:** [backend/src/features/analytics/hotspots.ts](../../backend/src/features/analytics/hotspots.ts) (new), [backend/src/db/queries.ts](../../backend/src/db/queries.ts)

**What to do:**
- Today `getHotspots` rounds to 0.01° grid cells. That's a bucket, not a hotspot.
- Implement the spec's algorithm:
  1. Filter points where `pm25 > threshold` (use the configurable threshold from alerts config — coordinate with Hamza).
  2. Spatial cluster (DBSCAN-lite: join points within ~1 km of each other).
  3. Per cluster compute weighted centroid by PM2.5 value.
  4. Estimate radius = max distance from centroid to any cluster member.
- Return an array of `HotspotCluster { centroidLat, centroidLng, radiusKm, peakPm25, memberUuids, score }`.
- Add the shape to [shared/src/telemetry.ts](../../shared/src/telemetry.ts) (coordinate with Haithem).
- Include it in `TelemetrySnapshot` so the dashboard can draw a filled circle for each hotspot, not just a dot.

**Acceptance:**
- Unit test: 5 synthetic points clustered within 500m return one hotspot; 2 far-apart points return 2.
- Oussama's map draws filled circles with correct radii.

**Dependencies:** Haithem (snapshot shape), Hamza (threshold config source).

---

### P1 — Trend slope as a first-class server-side signal (spec §8)

**Files:** [backend/src/features/analytics/trend.ts](../../backend/src/features/analytics/trend.ts) (new), [backend/src/routes/analytics.ts](../../backend/src/routes/analytics.ts)

**What to do:**
- Today the slope classification lives client-side in [frontend/src/lib/analytics.ts](../../frontend/src/lib/analytics.ts). Move it server-side so it's available everywhere (reports, webhooks, future mobile client).
- Expose `GET /api/analytics/trend?window=30m|1h|24h` returning `{ slope, direction: 'worsening'|'stable'|'improving', confidence }`.
- Include it in `TelemetrySnapshot.trend` so Oussama's pill reads directly from the WS feed.
- Store 24h of hourly averages so the 24h range is queryable against real history, not synthesized.

**Acceptance:**
- Dashboard's trend pill is still accurate but now driven by a server-side value.
- `/api/analytics/trend?window=24h` returns plausible slopes on real telemetry.

**Dependencies:** Haithem (if the snapshot grows, it's a contract change).

---

### P2 — Historical API for real time-range selection

**Files:** [backend/src/routes/analytics.ts](../../backend/src/routes/analytics.ts), [backend/src/db/queries.ts](../../backend/src/db/queries.ts)

**What to do:**
- Add `GET /api/analytics/history?pollutant=pm25|co2|no2&range=1h|24h|7d|30d&zone=lat,lng,radiusKm`
- Returns a proper time series at an appropriate resolution (1m buckets for 1h, 1h for 24h, 1d for 7d/30d).
- Coordinate with Haithem's retention/aggregation job: if it's running, read from `TelemetryArchive` for ranges ≥ 7d.
- Support the `zone` filter (FR-08 location filtering) — bounding-box or radius SQL.

**Acceptance:**
- Dashboard time-range selector shows real data, not client-resampled stubs.
- 7d range returns ≤ 168 points (one per hour).
- Queries stay under 100ms on a 500k-row DB.

**Dependencies:** Haithem (retention + archive schema).

---

### P3 — Forecast service (FR-11)

**Files:** [backend/src/features/analytics/forecast.ts](../../backend/src/features/analytics/forecast.ts) (new), [backend/src/routes/analytics.ts](../../backend/src/routes/analytics.ts)

**What to do:**
- Move and improve the client-side `computeForecast` from [frontend/src/lib/analytics.ts](../../frontend/src/lib/analytics.ts).
- Start with a stronger statistical baseline than the current client heuristic:
  - Seasonal decomposition on 7d of hourly data (hour-of-day + day-of-week terms).
  - Short-horizon AR(1) on the residual.
- Expose `GET /api/analytics/forecast?hours=6|12|24` returning `{ hours: Array<{hourIso, aqi, band, confidence}> }`.
- Include `forecast` in `TelemetrySnapshot` so the dashboard's Forecast panel is server-driven.
- **Keep the ML hook in mind:** structure the module so a future Python/ONNX inference call can drop in behind the same interface (`IForecastStrategy`).

**Acceptance:**
- MAE < 20 AQI points over a held-out day (measured in a test).
- Forecast horizon label shows actual clock hours from the server, not the browser.
- Degrades gracefully with < 6h of data (fall back to naive mean).

**Dependencies:** P2 (historical data availability).

---

### P4 — Source attribution surface (FR-12)

**Files:** [backend/src/features/analytics/sources.ts](../../backend/src/features/analytics/sources.ts) (new), [backend/src/routes/analytics.ts](../../backend/src/routes/analytics.ts)

**What to do:**
- Today attribution is a heuristic on the dashboard. Move it server-side with a more principled rule set:
  - **Traffic** signal: NO2 dominance + weekday rush-hour clustering.
  - **Industry** signal: sustained PM2.5 at the Industrial A7 hotspot coordinates (coordinate with P0 cluster output).
  - **Dust** signal: spatial uniformity + low humidity + PM10:PM2.5 ratio > 2.
  - **Other**: residual.
- Expose `GET /api/analytics/sources?range=24h` returning `[{key, name, pct, confidence, drivers}]`.
- Include in the snapshot so the Sources bar updates live from the server's picture.
- Document in [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) the interface a future ML model would replace.

**Acceptance:**
- Simulator in rush-hour mode (Haithem's P3) demonstrably moves the traffic pct up ≥ 10 points.
- A test asserts the attribution on a deterministic seeded dataset.

**Dependencies:** P3 interface; Haithem's simulator realism helps validation.

---

## Tips

- **Keep SQL out of the routes.** All queries live in `db/queries.ts` as prepared statements. Your `features/analytics/*` modules call those helpers and do math on arrays.
- **Use SQLite's `strftime` aggressively.** It handles time bucketing cleanly — no need to do it in JS.
- **Write unit tests in `features/analytics/*.test.ts`** — pure functions over arrays are the easiest things to test. Make your tests deterministic (seeded input).
- When adding to `TelemetrySnapshot`, default missing fields to sensible empty values so old clients don't break during rollout.
- Reference the existing client-side implementation in [frontend/src/lib/analytics.ts](../../frontend/src/lib/analytics.ts) — you're formalizing what's already prototyped there.

## Definition of Done

See [team/OVERVIEW.md](../OVERVIEW.md). Additionally: any new endpoint is documented in [backend/README.md](../../backend/README.md) and has at least one happy-path + one boundary test.
