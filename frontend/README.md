# `@climence/dashboard` — Frontend

React 19 + Vite operator UI. Consumes the backend's WebSocket snapshot stream plus a few REST endpoints (drone history, alert config).

Runs on **port 5173** via `vite`.

## Run

From the **repo root**:

```bash
npm run dev:ui     # just the frontend (expects backend already on :3000)
npm run dev        # backend + simulator + frontend together (recommended)
```

From this folder:

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Structure

```
src/
├── App.tsx                       # shell: nav + topbar + KPI strip + map + side rail
├── main.tsx                      # Vite entry
├── index.css                     # design system (OKLCH tokens, layout, animations)
├── hooks/
│   └── useLiveTelemetry.ts       # WS subscription + reconnect + snapshot state
├── api/
│   └── client.ts                 # REST wrappers (login, history, alert config)
├── components/
│   ├── map/                      # Google Map + AQI heatmap + sensor markers
│   ├── panels/                   # side-rail cards + Analytics + LiveMapView
│   └── ReportModal.tsx           # FR-15/16 — CSV/JSON/print-to-PDF export
└── lib/
    ├── analytics.ts              # trend detection, forecast, wind vector, source heuristic
    ├── liveMap.ts                # clustering/filter/playback/preset helpers
    ├── reports.ts                # export builders
    ├── i18n.ts                   # EN/AR dictionary + translate()
    └── auth-session.ts           # localStorage session management
```

## Live Map tab

The `Live Map` tab is a dedicated operations view built on top of the same
WebSocket snapshot feed used by overview:

- **Clustering**: nearby sensors are aggregated into dynamic map clusters.
- **Playback scrubber**: replay recent snapshot frames with play/pause controls.
- **Filter chips**: status (all/online/offline), PM2.5 threshold, and low-battery filter.
- **Saved presets**: persist named camera views (`lat/lng/zoom`) to local storage.
- **Legend overlay**: quick visual reference for AQI severity and cluster totals.

Primary files:

- `src/components/panels/LiveMapView.tsx`
- `src/lib/liveMap.ts`
- `src/components/map/RiyadhGoogleMap.tsx`
- `test/liveMap.test.ts`

## Data flow

1. User logs in via `api/client.login()` → JWT stored in `localStorage` (see `lib/auth-session.ts`).
2. `useLiveTelemetry(token)` opens `ws://<api>/ws/telemetry?token=...` and holds a `TelemetrySnapshot` in state.
3. On every server push the whole dashboard re-renders — KPIs, map markers, city trend, alerts, hotspots, sources, forecast.
4. On-demand:
   - Clicking a sensor or hotspot fetches `/api/telemetry/history/:droneId` via `api/client.fetchHistory`.
   - Admins editing the PM2.5 threshold call `PUT /api/alerts/config`.
   - Report export serializes the current snapshot (never re-fetches).

## Design system

- Tokens in [src/index.css](src/index.css) — OKLCH palette, AQI bands, glass surfaces, fonts.
- Fonts loaded via `<link>` in [index.html](index.html): Inter, Instrument Serif, JetBrains Mono, Noto Kufi Arabic.
- AQI band colors resolve via CSS variables (`--aqi-good`, `--aqi-mod`, `--aqi-usg`, `--aqi-unh`, `--aqi-vunh`, `--aqi-haz`). Use `bandKeyForPm25()` from `@climence/shared` to pick a band.

## Localization

- Dictionary in [src/lib/i18n.ts](src/lib/i18n.ts). `translate(key, locale)` returns the string.
- RTL toggle also flips `<html dir>` — layout CSS has `html[dir="rtl"]` branches where needed.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `VITE_CLIMENCE_API_URL` — optional backend URL override if the API is not running on the default local origin.

All Vite env vars must start with `VITE_`.

## Where to extend

- **New panel** → add to `components/panels/*`, render in `App.tsx` inside `<aside className="side">`, follow the `.side-group`/`.side-head`/`.side-title` pattern.
- **New live-map operation** → prefer pure helpers in `lib/liveMap.ts`, then wire UI in `components/panels/LiveMapView.tsx`.
- **New analytic** → add a pure function to `lib/analytics.ts`, memoize in `App.tsx`.
- **New translation** → add an entry to `DICT` in `lib/i18n.ts` (both `en` and `ar`).
- **New report format** → add an exporter to `lib/reports.ts` and a card to `components/ReportModal.tsx`.
