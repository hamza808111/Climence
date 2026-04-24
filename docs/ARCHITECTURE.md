# Climence Architecture

This repository is a npm workspaces monorepo with four bounded packages:

- `packages/shared`: Domain contracts and constants (types, AQI conversion, message shapes).
- `packages/simulator`: Synthetic telemetry producer (drone behavior + posting to API).
- `packages/api`: Ingestion + query service (REST + WebSocket snapshot stream).
- `packages/dashboard`: Operator UI (live map and command center panels).

## Dependency Rules

Keep dependencies flowing inward toward shared contracts:

- `shared` -> no internal package dependency.
- `simulator` -> can depend on `shared`.
- `api` -> can depend on `shared`.
- `dashboard` -> can depend on `shared`.
- `api` must not import from `simulator` or `dashboard`.
- `dashboard` must not import from `api` internals (only HTTP/WS contracts from `shared`).

## Package Structure

### `packages/shared`

- `src/aqi.ts`: AQI conversion and band mapping.
- `src/constants.ts`: cross-package runtime constants.
- `src/telemetry.ts`: domain telemetry model.
- `src/messages.ts`: WebSocket message contracts.

### `packages/simulator`

- `src/index.ts`: simulator composition root.
- `src/FleetManager.ts`: simulation loop and API publishing.
- `src/DroneDevice.ts`: per-device state machine.
- `src/domain/*.ts`: pure helpers used by simulation logic.

### `packages/api`

- `src/index.ts`: server composition root.
- `src/routes/*.ts`: HTTP transport layer (request/response only).
- `src/features/*`: feature-local pure logic (validation/mappers/policies).
- `src/db/*`: persistence layer.
- `src/lib/*`: framework-agnostic utilities.
- `src/ws.ts`: WebSocket transport and broadcast orchestration.

### `packages/dashboard`

- `src/App.tsx`: top-level shell and page composition.
- `src/components/*`: reusable UI elements.
- `src/hooks/*`: data subscriptions and side effects.
- `src/api/*`: HTTP clients.
- `src/lib/*`: UI utilities.

## Testing Strategy

- Unit test pure logic in `shared`, `simulator/domain`, and `api/features`.
- Keep transport tests focused on behavior (status codes, mapping, validation).
- Keep end-to-end smoke checks separate from unit tests (`test:integration:*`).

## Searchability Conventions

- Feature-first folders: `features/<feature-name>/...`.
- Transport code in `routes/` only.
- Reusable pure code in `domain/` or `lib/`.
- Use explicit suffixes:
  - `*.test.ts` for unit tests
  - `*.route.ts` (if/when route files expand)
  - `*.validation.ts` for input policies

## Operational Data Flow

1. `simulator` generates fleet telemetry and POSTs `/api/telemetry`.
2. `api` persists telemetry and computes snapshot projections.
3. `api` broadcasts snapshot over `ws://.../ws/telemetry`.
4. `dashboard` consumes snapshots and renders live state.
