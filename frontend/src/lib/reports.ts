import type { TelemetrySnapshot } from '@climence/shared';

export interface ReportPayload {
  snapshot: TelemetrySnapshot;
  cityAqi: number;
  cityBandLabel: string;
  activeThreshold: number;
  onlineSensors: number;
  totalSensors: number;
  hotspots: Array<{ name: string; coord: string; aqi: number; trend: number }>;
  sources: Array<{ name: string; pct: number }>;
  forecast: Array<{ hr: string; val: number }>;
  trendLabel: string;
  generatedBy: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function timestampSlug() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function csvEscape(value: string | number) {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function exportSnapshotCsv(payload: ReportPayload) {
  const { snapshot } = payload;
  const rows: string[] = [];

  rows.push('# Climence pollution snapshot');
  rows.push(`# Generated,${new Date().toISOString()}`);
  rows.push(`# Operator,${payload.generatedBy}`);
  rows.push(`# City AQI,${payload.cityAqi}`);
  rows.push(`# City band,${payload.cityBandLabel}`);
  rows.push(`# Trend,${payload.trendLabel}`);
  rows.push(`# Alert threshold PM2.5 (ug/m3),${payload.activeThreshold}`);
  rows.push(`# Sensors online,${payload.onlineSensors}/${payload.totalSensors}`);
  rows.push('');
  rows.push('section,uuid,state,battery,lat,lng,pm25,co2,no2,temperature,humidity,rssi,timestamp');
  for (const drone of snapshot.drones) {
    rows.push(
      [
        'sensor',
        drone.uuid,
        drone.state,
        drone.batteryLevel,
        drone.lat,
        drone.lng,
        drone.pm25,
        drone.co2,
        drone.no2,
        drone.temperature,
        drone.humidity,
        drone.rssi,
        drone.server_timestamp,
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  rows.push('');
  rows.push('section,uuid,pm25,lat,lng,timestamp');
  for (const alert of snapshot.alerts) {
    rows.push(
      ['alert', alert.uuid, alert.pm25, alert.lat, alert.lng, alert.server_timestamp]
        .map(csvEscape)
        .join(','),
    );
  }
  rows.push('');
  rows.push('section,lat_zone,lng_zone,avg_pm25');
  for (const hotspot of snapshot.hotspots) {
    rows.push(
      ['hotspot', hotspot.lat_zone, hotspot.lng_zone, hotspot.avg_pm25]
        .map(csvEscape)
        .join(','),
    );
  }
  rows.push('');
  rows.push('section,minute_label,avg_pm25,avg_co2');
  for (const point of snapshot.cityTrend) {
    rows.push(
      ['city_trend', point.minute_label, point.avg_pm25, point.avg_co2].map(csvEscape).join(','),
    );
  }

  downloadBlob(
    new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `climence-snapshot-${timestampSlug()}.csv`,
  );
}

export function exportSnapshotJson(payload: ReportPayload) {
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `climence-snapshot-${timestampSlug()}.json`,
  );
}

/**
 * Open a print-ready HTML report in a new tab. The user picks "Save as PDF"
 * from the browser print dialog — gives us a functional PDF export
 * without bundling a PDF library.
 */
export function openPrintablePdf(payload: ReportPayload) {
  const win = window.open('', '_blank', 'noopener');
  if (!win) return;

  const when = new Date().toLocaleString();
  const hotspotRows = payload.hotspots
    .map(
      (h, i) =>
        `<tr><td>${i + 1}</td><td>${h.name}</td><td>${h.coord}</td><td>${h.aqi}</td><td>${h.trend >= 0 ? '+' : ''}${h.trend}%</td></tr>`,
    )
    .join('');
  const sourceRows = payload.sources
    .map(s => `<tr><td>${s.name}</td><td>${s.pct}%</td></tr>`)
    .join('');
  const forecastRows = payload.forecast
    .map(f => `<tr><td>${f.hr}</td><td>${f.val}</td></tr>`)
    .join('');

  win.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Climence Report — ${when}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, system-ui, sans-serif; margin: 40px; color: #1b1a19; }
  header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1b1a19; padding-bottom: 12px; }
  h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 34px; margin: 0; letter-spacing: -0.01em; }
  .sub { font-family: 'JetBrains Mono', monospace; text-transform: uppercase; font-size: 11px; letter-spacing: 0.14em; color: #6b6b6b; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 24px 0; }
  .kpi { border: 1px solid #dcd8d0; border-radius: 10px; padding: 14px; }
  .kpi .label { font-family: 'JetBrains Mono', monospace; text-transform: uppercase; font-size: 10px; letter-spacing: 0.12em; color: #888; }
  .kpi .value { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; margin-top: 6px; line-height: 1; }
  section { margin-top: 28px; }
  section h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; margin: 0 0 10px; letter-spacing: -0.01em; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2ddd3; font-size: 13px; }
  th { font-family: 'JetBrains Mono', monospace; text-transform: uppercase; font-size: 10px; letter-spacing: 0.12em; color: #6b6b6b; background: #f7f3ec; }
  footer { margin-top: 40px; font-size: 11px; color: #8a8a8a; border-top: 1px solid #dcd8d0; padding-top: 12px; }
  @media print { body { margin: 20mm; } header { page-break-after: avoid; } section { page-break-inside: avoid; } }
</style>
</head>
<body>
<header>
  <div>
    <h1>Climence Pollution Report</h1>
    <div class="sub">Riyadh — Command Center Snapshot</div>
  </div>
  <div class="sub" style="text-align:right">
    <div>Generated ${when}</div>
    <div>Operator: ${payload.generatedBy}</div>
  </div>
</header>

<div class="kpi-grid">
  <div class="kpi"><div class="label">City AQI</div><div class="value">${payload.cityAqi}</div><div>${payload.cityBandLabel}</div></div>
  <div class="kpi"><div class="label">Trend</div><div class="value">${payload.trendLabel}</div></div>
  <div class="kpi"><div class="label">Active Alerts</div><div class="value">${payload.snapshot.alerts.length}</div><div>PM2.5 ≥ ${payload.activeThreshold} µg/m³</div></div>
  <div class="kpi"><div class="label">Sensors</div><div class="value">${payload.onlineSensors}/${payload.totalSensors}</div><div>online</div></div>
</div>

<section>
  <h2>Top Hotspots</h2>
  <table>
    <thead><tr><th>#</th><th>Name</th><th>Coord</th><th>AQI</th><th>Trend</th></tr></thead>
    <tbody>${hotspotRows || '<tr><td colspan="5">No hotspots in the last 5 minutes.</td></tr>'}</tbody>
  </table>
</section>

<section>
  <h2>Forecast · next hours</h2>
  <table>
    <thead><tr><th>Hour</th><th>Projected AQI</th></tr></thead>
    <tbody>${forecastRows}</tbody>
  </table>
</section>

<section>
  <h2>Source attribution (24h)</h2>
  <table>
    <thead><tr><th>Source</th><th>Contribution</th></tr></thead>
    <tbody>${sourceRows}</tbody>
  </table>
</section>

<footer>
  Generated by the Climence Command Center. Print to save as PDF. Data reflects the live WebSocket snapshot at the moment of export.
</footer>

<script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body>
</html>`);
  win.document.close();
}

// ---------- scheduled reports (FR-17, client-stub) ----------

export interface ScheduledReport {
  id: string;
  label: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  nextRun: string;
  format: 'pdf' | 'csv' | 'json';
}

const STORAGE_KEY = 'climence-scheduled-reports';

export function loadScheduledReports(): ScheduledReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledReport[];
  } catch {
    return [];
  }
}

export function saveScheduledReports(reports: ScheduledReport[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function nextRunIso(cadence: ScheduledReport['cadence']) {
  const d = new Date();
  if (cadence === 'daily') d.setDate(d.getDate() + 1);
  if (cadence === 'weekly') d.setDate(d.getDate() + 7);
  if (cadence === 'monthly') d.setMonth(d.getMonth() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}
