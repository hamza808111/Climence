# Student 1 — Hamza
## Role: Team Lead · Platform & Telemetry Pipeline

You own the **plumbing that everyone else stands on**: the shared type contract, the drone simulator, the ingestion + WebSocket path, and the SQLite schema. If the snapshot shape changes, the whole app changes; that's why this slice is yours first.

### Summary

- Guarantee the telemetry round-trip: **simulator → POST `/api/telemetry` → SQLite → `broadcastSnapshot()` → dashboard** continues to work end-to-end at ≤ 5s latency (NFR-01).
- Own `@climence/shared` — the contract that prevents drift between the three services.
- Operate the database: schema migrations, retention policy, backup story.

### Files you own

- [simulator/](../../simulator/) — whole package
- [backend/src/index.ts](../../backend/src/index.ts) — bootstrap
- [backend/src/ws.ts](../../backend/src/ws.ts) — WebSocket server
- [backend/src/db/client.ts](../../backend/src/db/client.ts), [schema.sql](../../backend/src/db/schema.sql), [queries.ts](../../backend/src/db/queries.ts) (insert + snapshot paths; Abderraouf owns the analytics queries inside the same file — coordinate)
- [backend/src/routes/telemetry.ts](../../backend/src/routes/telemetry.ts)
- [shared/](../../shared/) — whole package (contract)
- [data/](../../data/) — runtime artifact policy
- Root [package.json](../../package.json), [tsconfig.base.json](../../tsconfig.base.json), concurrently orchestration, CI scripts

### Requirements (traceability IDs)

- **FR-01** Collect pollution data from IoT, drones, external APIs (simulator channel)
- **FR-04** Real-time pollution map (transport layer)
- **NFR-01** 5-second end-to-end latency
- **NFR-02** Scales with users/data
- **NFR-10** Admin logging + error monitoring

---

## Prioritized tasks

> ✅ **DONE — 2026-04-25 (partial P3 completion).** Restored the previous-project hazard orchestration behavior in the simulator: [simulator/src/FleetManager.ts](../../simulator/src/FleetManager.ts) now polls active alerts and dispatches up to 3 nearest drones per hazard, while [simulator/src/DroneDevice.ts](../../simulator/src/DroneDevice.ts) now supports `INVESTIGATING_HAZARD` with a 30-second scrubber cycle that reduces hotspot pollution and then returns to patrol mode. Shared contract/environment updates landed in [shared/src/telemetry.ts](../../shared/src/telemetry.ts) and [shared/src/constants.ts](../../shared/src/constants.ts). Added tests in [simulator/src/device/DroneDevice.test.ts](../../simulator/src/device/DroneDevice.test.ts). **Still open in P3:** explicit rush-hour multiplier and POST retry queue/backoff.

### P0 — Harden the ingestion + broadcast round-trip

**Files:** [backend/src/routes/telemetry.ts](../../backend/src/routes/telemetry.ts), [backend/src/ws.ts](../../backend/src/ws.ts)

**What to do:**
- Add payload-size guard on `POST /api/telemetry` (reject > 200KB with 413) to protect the ingest path.
- Replace the current ad-hoc `console.log` in the ingest handler with a lightweight structured logger (JSON lines on stdout is fine — no framework needed).
- Add WebSocket heartbeat: server sends a ping every 30s; close sockets that miss 2 in a row. Prevents dead connections from holding snapshot fan-out.
- Emit an `insertDurationMs` metric in the log line so NFR-01 is observable.

**Acceptance:**
- `curl` posting a 1MB payload returns 413.
- Dashboard left idle for 15+ minutes continues to receive snapshots.
- Logs contain `{"event":"ingest","count":25,"insertMs":…,"broadcastMs":…}`.

**Dependencies:** none.

---

### P1 — Retention + downsampling job

**Files:** new `backend/src/features/retention/job.ts`, [backend/src/db/schema.sql](../../backend/src/db/schema.sql)

**What to do:**
- 25 drones × one row per 5 s ≈ **432k rows/day**. Add a background interval (every 10 min) that:
  1. Aggregates rows older than 24 h into 1-minute buckets per UUID, writes them to a new `TelemetryArchive` table, then deletes the raw rows.
  2. Logs the row delta.
- Wire it from [backend/src/index.ts](../../backend/src/index.ts) behind an env flag `CLIMENCE_RETENTION_ENABLED=true` (default off in dev).

**Acceptance:**
- Running the API with the flag for >24h keeps `TelemetryLogs` under ~500k rows.
- Unit test on the aggregation SQL in `:memory:` DB.

**Dependencies:** P0.

---

### P2 — `shared/` versioning + contract tests

**Files:** [shared/src/telemetry.ts](../../shared/src/telemetry.ts), [shared/src/messages.ts](../../shared/src/messages.ts), new `shared/src/telemetry.test.ts`

**What to do:**
- Write node-test cases that assert shape invariants (`TelemetryInput` → `TelemetryRecord` field parity for the nested→flat projection).
- Document the contract in a top-of-file comment block so anyone breaking it sees the header when they open the file.
- Never import from `node:` in `shared/` — that breaks the browser consumer (the frontend).

**Acceptance:**
- `npm run test -w @climence/shared` runs and passes.
- ESLint rule (Imad can add it under his polish slice) rejects node imports in `shared/`.

**Dependencies:** none.

---

### P3 — Simulator realism pass

**Files:** [simulator/src/DroneDevice.ts](../../simulator/src/DroneDevice.ts), [simulator/src/FleetManager.ts](../../simulator/src/FleetManager.ts)

**What to do:**
- Add time-of-day modulation to `ENVIRONMENT_MAP` peaks in [shared/src/constants.ts](../../shared/src/constants.ts): 1.3× at 07-09 and 17-19, 0.7× at 02-05. The dashboard will visibly "breathe" with traffic peaks — makes demos + FR-11 forecast evaluation meaningful.
- Speed tier: `LOW_BATTERY` drones move at 0.6× the `EN_ROUTE` speed and target the nearest hotspot (hinting at a return-to-base behavior).
- Retry-with-backoff: if the API POST fails, queue the last 3 payloads locally and retry on the next tick. No silent data loss.

**Acceptance:**
- Chart visibly shows a rush-hour PM2.5 peak when the clock rolls through 07:00 / 17:00.
- Killing the API for 20s then restarting it: no gap longer than 15s in the sensor timeline.

**Dependencies:** none.

---

### P4 — Dev ergonomics + CI

**Files:** root [package.json](../../package.json), new `.github/workflows/ci.yml`

**What to do:**
- `npm run reset` — deletes `data/telemetry.db`, reinstalls workspaces, restarts dev.
- GitHub Actions CI: `npm ci && npm run check` on every PR.
- Add `npm run typecheck:watch` (backend + frontend) for faster dev feedback.
- Document these in [docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md).

**Acceptance:**
- PRs show a green CI check before merge is allowed.

**Dependencies:** everyone else's `npm run test` targets exist (they do today — keep it that way).

---

## Tips

- **You are the arbiter of snapshot shape.** If Oussama or Imad want a new field, they go through you. Add to `TelemetrySnapshot` only after you've written the producing SQL with Abderraouf.
- **Keep `shared/` tiny.** If a helper is used by only one service, it doesn't belong there.
- **Never inline SQL.** Every statement goes through [backend/src/db/queries.ts](../../backend/src/db/queries.ts) as a prepared statement.
- Pattern to copy for new tables: the existing `AlertConfig` table + ensure/get/set trio in queries.ts.

## Definition of Done

Same as everyone's — see [team/OVERVIEW.md](../OVERVIEW.md). Additionally: any change you merge to `shared/` triggers a short Slack/Teams ping so the others pull immediately.
