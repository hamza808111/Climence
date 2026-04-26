# `@climence/api` — Backend

Ingestion API, analytics projections, auth, and the real-time WebSocket snapshot broadcaster.

Runs on **port 3000**. Persists to `../data/telemetry.db` (SQLite, via `better-sqlite3`).

## Run

From the **repo root**:

```bash
npm run dev:api     # just the backend
npm run dev         # backend + simulator + frontend together
```

From this folder:

```bash
npm run dev         # tsx watch src/index.ts
npm run typecheck
npm run test
```

## HTTP surface (base `/api`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Email+password → JWT |
| POST | `/telemetry` | public (device channel) | Simulator ingestion — upserts into `TelemetryLogs` and broadcasts snapshot |
| GET  | `/telemetry/latest` | ✓ | Most recent row per drone (last 5m) |
| GET  | `/telemetry/history/:droneId` | ✓ | Last 60 points for a drone, ASC |
| GET  | `/analytics/city-trend` | ✓ | 30-minute rolling averages |
| GET  | `/analytics/hotspots` | ✓ | Top 3 polluted 0.01° zones (5m window) |
| GET  | `/alerts/active` | ✓ | Drones over the configured PM2.5 threshold |
| GET  | `/alerts/config` | ✓ | Current threshold |
| PUT  | `/alerts/config` | admin | Update threshold + rebroadcast snapshot |

## WebSocket

- `ws://localhost:3000/ws/telemetry?token=<jwt>` — one frame on connect, one per `POST /telemetry`.
- Payload: `{ type: 'snapshot', data: TelemetrySnapshot }` — see [../shared/src/messages.ts](../shared/src/messages.ts).

## Layered layout

```
src/
├── index.ts                  # Express bootstrap + WebSocket attach
├── ws.ts                     # WebSocketServer + broadcastSnapshot()
├── routes/                   # TRANSPORT (req/res only)
│   ├── auth.ts
│   ├── telemetry.ts
│   ├── analytics.ts
│   └── alerts.ts
├── features/                 # USE CASES (pure, no Express)
│   ├── auth/                 # token signing, user directory
│   ├── alerts/               # threshold policy
│   └── telemetry/            # payload validation
├── db/                       # PERSISTENCE (SQLite + SQL)
│   ├── client.ts
│   ├── schema.sql
│   └── queries.ts            # prepared statements + computeSnapshot()
└── lib/                      # FRAMEWORK-AGNOSTIC HELPERS
    ├── auth.ts               # requireAuth, requireRole middleware
    └── http.ts               # sendBadRequest, sendNotFound, sendInternalError
```

Dependency rule: `routes → features → db`. `lib` is free to import from anything reasonable (framework-agnostic). See [../ARCHITECTURE.md](../ARCHITECTURE.md) for the full layer table.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `CLIMENCE_DB_PATH` — override for the SQLite file location (default: `<repo>/data/telemetry.db`).
- `CLIMENCE_JWT_SECRET` — secret used to sign auth tokens (required in production, has a dev default in code).
- `CLIMENCE_JWT_EXPIRES_IN` — token TTL, e.g. `12h`.

In development the defaults are baked into [src/features/auth/token.ts](src/features/auth/token.ts) so you don't need a local `.env` to run.

## Where to extend

- **New endpoint** → add a file in `routes/`, a validator in `features/<module>/`, and any SQL in `db/queries.ts`. Never inline SQL in a route.
- **New broadcast trigger** → call `broadcastSnapshot()` from the relevant route handler.
- **New persisted config** → add a table to `db/schema.sql`, a prepared statement in `db/queries.ts`, and expose it through a route + the snapshot.

## Test

```bash
npm run test                      # unit tests (features/*, shared)
npm run test:integration:api      # spins up Express against a temp DB
```
