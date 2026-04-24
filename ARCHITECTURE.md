# Climence — Architecture

## Why this architecture

Climence is three cooperating services (a device simulator, an ingestion API, a live dashboard) sharing a single domain contract (the telemetry model). Three facts drove the design:

1. **Real-time is in the data path, not in the UI.** The dashboard must reflect fleet state within ~5 seconds (NFR-01). That forces push-style delivery (WebSocket snapshot broadcast) and a server-side projection layer — not pure REST-pulling from React.
2. **The contract is the product.** Simulator, API, and dashboard each interpret `TelemetryInput` / `TelemetryRecord` / `TelemetrySnapshot`. A shared package owns that contract so renaming a field breaks at compile time for every consumer at once.
3. **Team of 5 needs parallel lanes.** Auth, analytics, maps, reports, and platform/plumbing each have to advance without blocking each other. Feature folders inside each service make ownership explicit.

Given those forces, Climence uses a **Layered Architecture per service + a thin Shared Kernel**, with pragmatic Clean-Architecture-lite borrowings (domain logic isolated from transport) inside the backend. We deliberately did **not** go full Clean Architecture (use cases, entities, gateways as formal layers) because the domain is narrow — telemetry ingestion + projection queries + config — and the ceremony would slow the team down.

- **Rejected: Flat frontend/backend split.** Loses the simulator as a peer service and collapses the shared contract.
- **Rejected: Full Clean Architecture.** Over-kill for a CRUD + streaming app; students spend time translating between layers instead of shipping features.
- **Rejected: Feature-Sliced Design (FSD) end-to-end.** Backend transport vs. business-logic isn't naturally feature-sliced; layering fits it better. FSD-flavored organization *is* used inside `backend/src/features/*`.

## System diagram

```
                ┌──────────────────────┐
                │  frontend (React)    │
                │  - Command Center    │
                │  - Map + KPIs        │
                │  - Reports / i18n    │
                └──────────┬───────────┘
                           │ HTTP (REST)  +  WebSocket (snapshot stream)
                           ▼
┌──────────────────────────────────────────────────────┐
│  backend (Express)                                    │
│                                                       │
│  routes/   ────────▶  features/   ────────▶  db/     │
│  (transport)         (use-case logic)        (SQLite) │
│                                                       │
│     ▲                      ▲                          │
│     │                      │                          │
│     │ lib/auth, lib/http   │ shared (@climence/shared)│
│     │                      │                          │
│  ws.ts ◀──── broadcastSnapshot() on every ingest      │
└──────────────────────────▲───────────────────────────┘
                           │ HTTP POST /api/telemetry
                           │
                ┌──────────┴───────────┐
                │  simulator           │
                │  - DroneDevice (×25) │
                │  - FleetManager      │
                └──────────────────────┘
```

All four packages compile against a shared type contract:

```
shared (telemetry.ts, messages.ts, aqi.ts, auth.ts, constants.ts)
   ▲              ▲              ▲
   │              │              │
 simulator    backend         frontend
```

Dependency rule: **everything depends on `shared`; nothing depends on another service.**

## Folder structure

```
/ (repo root)
├── ARCHITECTURE.md           # this file
├── README.md                 # quick start + project map
├── package.json              # npm workspaces: [shared, simulator, backend, frontend]
├── tsconfig.base.json        # strict TS config every package extends
├── data/
│   └── telemetry.db          # SQLite runtime file (gitignored)
│
├── shared/                   # @climence/shared — domain contracts
│   └── src/
│       ├── telemetry.ts      # TelemetryInput (POST body) / TelemetryRecord (DB row)
│       ├── messages.ts       # WebSocket ServerMessage, TelemetrySnapshot
│       ├── aqi.ts            # PM2.5 → AQI, band classification
│       ├── auth.ts           # UserRole, LoginRequest/Response
│       └── constants.ts      # RIYADH_BOUNDS, ENVIRONMENT_MAP, thresholds
│
├── simulator/                # @climence/simulator — synthetic telemetry producer
│   └── src/
│       ├── index.ts          # composition root
│       ├── FleetManager.ts   # tick loop, posts to backend
│       ├── DroneDevice.ts    # per-device state machine
│       └── domain/           # pure helpers (geo math, IDW)
│
├── backend/                  # @climence/api — REST + WebSocket
│   └── src/
│       ├── index.ts          # express + http.Server bootstrap, WS attach
│       ├── ws.ts             # WebSocketServer, broadcastSnapshot()
│       ├── routes/           # transport layer — ONE FILE PER RESOURCE
│       │   ├── auth.ts
│       │   ├── telemetry.ts
│       │   ├── analytics.ts
│       │   └── alerts.ts
│       ├── features/         # use-case logic (validation, policies, mappers)
│       │   ├── auth/         # token signing, user directory
│       │   ├── alerts/       # threshold validation
│       │   ├── telemetry/    # payload validation
│       │   └── forecast/     # (planned) ML-backed forecast
│       ├── db/               # persistence
│       │   ├── client.ts     # better-sqlite3 singleton
│       │   ├── schema.sql    # TelemetryLogs + AlertConfig
│       │   └── queries.ts    # prepared statements + computeSnapshot()
│       └── lib/              # framework-agnostic utilities
│           ├── auth.ts       # requireAuth / requireRole middleware
│           └── http.ts       # sendBadRequest / sendInternalError
│
├── frontend/                 # @climence/dashboard — React 19 + Vite
│   └── src/
│       ├── App.tsx           # shell + data composition
│       ├── main.tsx          # Vite entry
│       ├── index.css         # design system (OKLCH tokens, layout)
│       ├── hooks/
│       │   └── useLiveTelemetry.ts   # WS subscription + reconnect
│       ├── api/
│       │   └── client.ts             # REST wrappers (history, alert config)
│       ├── components/
│       │   ├── map/                  # Google map + AQI heat layer
│       │   ├── panels/               # side-rail cards
│       │   └── ReportModal.tsx       # FR-15/16 reports
│       ├── lib/
│       │   ├── analytics.ts          # trend detection, forecast, wind, sources
│       │   ├── reports.ts            # CSV / PDF / JSON export
│       │   ├── i18n.ts               # EN/AR dictionary
│       │   └── auth-session.ts       # localStorage token handling
│       └── assets/                   # logo, images
│
├── team/                     # per-student task ownership
│   ├── OVERVIEW.md           # ownership matrix + build order + conventions
│   └── student-{N}-{Name}/TASKS.md
│
└── docs/
    ├── DEVELOPMENT.md
    ├── SWE496_SPECIFICATIONS.md
    ├── SWE496_REQUIREMENTS_TRACEABILITY.md
    └── SWE496_IMPLEMENTATION_PLAN.md
```

## Layer responsibilities (backend)

Clear inward dependency direction: **routes → features → db**. `lib/` is the neutral base that anything can import.

| Layer | Concerns | Allowed imports | Forbidden |
|---|---|---|---|
| `routes/` | HTTP request/response, status codes, auth guards | `features/*`, `db/queries`, `lib/*`, `shared` | Direct DB writes, SQL strings |
| `features/` | Validation, business policy, pure transforms | `shared`, `lib/*` | Express types, SQL, `process.env` |
| `db/` | SQLite prepared statements, schema, snapshot projection | `better-sqlite3`, `shared`, `lib/*` | Express, request bodies |
| `ws.ts` | WebSocket auth + fan-out | `db/queries`, `features/auth`, `shared` | Route handlers |
| `lib/` | Framework-agnostic helpers | `shared` only | Everything else |
| `shared/` | Types + pure functions | (none) | Any service-specific code |

## Data flow — one telemetry tick

The golden path the whole stack is designed around:

```
simulator               backend                          frontend
─────────               ───────                          ────────
1. FleetManager.tick()
   │
   │ 25× DroneDevice.getTelemetry()
   │
   └─▶ axios POST /api/telemetry  {fleet: TelemetryInput[]}
                                        │
                                        ▼
                               2. routes/telemetry.ts
                                  ├─ features/telemetry/validation
                                  └─ db/queries.insertFleet()   (transactional)
                                        │
                                        ▼
                               3. ws.ts.broadcastSnapshot()
                                  └─ db/queries.computeSnapshot()  ← joins:
                                         • latest per drone
                                         • active alerts (threshold)
                                         • city trend (30m buckets)
                                         • hotspots (5m zones)
                                        │
                                        │ JSON {type:"snapshot", data:TelemetrySnapshot}
                                        ▼
                               4. every connected WebSocket client
                                                                   │
                                                                   ▼
                                                      5. useLiveTelemetry.onmessage
                                                         └─ setSnapshot(data)
                                                                   │
                                                                   ▼
                                                      6. App.tsx re-renders
                                                         ├─ KPI strip
                                                         ├─ Google map markers
                                                         ├─ city trend chart
                                                         └─ alert feed / hotspot panel
```

**SLO**: under ~50ms end-to-end on localhost, well inside the 5s spec target (NFR-01).

## Data flow — user action (setting alert threshold)

Round-trip demonstrates the permission + broadcast wiring:

```
frontend                         backend
────────                         ───────
1. Admin types 180 and clicks Save
   └─▶ PUT /api/alerts/config { pm25Threshold: 180 }  (Bearer token)
                                      │
                                      ▼
                             2. routes/alerts.ts
                                ├─ lib/auth.requireAuth
                                ├─ lib/auth.requireRole(ADMINISTRATOR)
                                ├─ features/alerts/config.validate
                                └─ db/queries.setAlertThresholdPm25()
                                      │
                                      ▼
                             3. ws.ts.broadcastSnapshot()
                                — every dashboard sees the new threshold
                                  and re-classifies active alerts
                                      │
                                      │ 200 { pm25Threshold, updatedAt }
                                      ▼
4. Dashboard confirms "Threshold saved and applied to live alerts"
```

## Testing strategy

- `shared`: pure functions tested with `node --test` in `src/**/*.test.ts`.
- `backend/features/*`: unit tests on validation + policy, no Express.
- `backend/db`: prefer in-memory `better-sqlite3(':memory:')` for query tests.
- `backend`: integration tests spin up the Express app against a temp DB.
- `frontend`: component tests for presentational pieces; the shell is tested via E2E.
- `simulator/domain`: pure unit tests.

`npm run check` = `typecheck` + `lint` + `test` (runs across all workspaces).

## Key architectural decisions log

- **2026-04 — Added WebSocket broadcast layer.** Replaced three 5s polling loops in the dashboard with one snapshot push channel; drops perceived latency from ~5s to ~50ms and cuts REST calls by ~97%.
- **2026-04 — Introduced `@climence/shared` contract package.** Eliminated duplicated `TelemetryData` interface across three places; a single rename now errors every consumer at compile time.
- **2026-04 — Extracted `features/` folder inside backend.** Gives each module (auth, alerts, telemetry, forecast) a local home for validation + policy without creating a heavy Clean Architecture use-case layer.
- **2026-04 — Moved `telemetry.db` out of the API folder into `/data`.** Runtime artifact is now separate from source; gitignored; path overridable via `CLIMENCE_DB_PATH`.
- **2026-04 — Client-side report generation (FR-15/16).** CSV + print-to-PDF via the browser; no PDF library in the bundle; schedules stored in `localStorage` as FR-17 stub.
