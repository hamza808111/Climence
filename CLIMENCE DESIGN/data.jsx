// Mock data for CLIMENCE dashboard — Riyadh area

const AQI_BANDS = [
  { max: 50,  key: "good",  label: "Good",            color: "var(--aqi-good)" },
  { max: 100, key: "mod",   label: "Moderate",        color: "var(--aqi-mod)" },
  { max: 150, key: "usg",   label: "Sensitive Groups",color: "var(--aqi-usg)" },
  { max: 200, key: "unh",   label: "Unhealthy",       color: "var(--aqi-unh)" },
  { max: 300, key: "vunh",  label: "Very Unhealthy",  color: "var(--aqi-vunh)" },
  { max: 999, key: "haz",   label: "Hazardous",       color: "var(--aqi-haz)" },
];

function bandFor(v) {
  return AQI_BANDS.find(b => v <= b.max) || AQI_BANDS[AQI_BANDS.length - 1];
}

const POLLUTANTS = [
  { key: "pm25", name: "PM2.5", sub: "µg/m³",    value: 87,  delta: +12, ref: 35,  pct: 74 },
  { key: "pm10", name: "PM10",  sub: "µg/m³",    value: 142, delta: +8,  ref: 150, pct: 58 },
  { key: "no2",  name: "NO₂",   sub: "ppb",      value: 34,  delta: -4,  ref: 53,  pct: 42 },
  { key: "o3",   name: "O₃",    sub: "ppb",      value: 62,  delta: +18, ref: 70,  pct: 68 },
  { key: "so2",  name: "SO₂",   sub: "ppb",      value: 12,  delta: -1,  ref: 75,  pct: 18 },
  { key: "co",   name: "CO",    sub: "ppm",      value: 1.4, delta: +0.2,ref: 9,   pct: 28 },
];

const HOTSPOTS = [
  { id: 1, name: "Industrial Corridor — Zone A7",  coord: "24.751, 46.851", aqi: 218, band: "vunh", trend: +14, pollutant: "PM2.5" },
  { id: 2, name: "Ring Road Interchange 12",       coord: "24.712, 46.689", aqi: 186, band: "unh",  trend: +8,  pollutant: "NO₂" },
  { id: 3, name: "Al Dir'iyah Sector",             coord: "24.735, 46.578", aqi: 164, band: "unh",  trend: +3,  pollutant: "PM10" },
  { id: 4, name: "King Khalid Airport Perimeter",  coord: "24.961, 46.700", aqi: 148, band: "usg",  trend: -2,  pollutant: "PM2.5" },
  { id: 5, name: "Olaya Commercial District",      coord: "24.691, 46.686", aqi: 132, band: "usg",  trend: +5,  pollutant: "O₃" },
  { id: 6, name: "Diplomatic Quarter",             coord: "24.668, 46.624", aqi: 98,  band: "mod",  trend: -1,  pollutant: "PM2.5" },
  { id: 7, name: "Wadi Hanifah Reserve",           coord: "24.602, 46.555", aqi: 46,  band: "good", trend: -4,  pollutant: "PM2.5" },
];

const SENSORS = [
  // pseudo-coords mapped onto a 1000x700 SVG canvas
  { id: "S-001", x: 0.72, y: 0.35, aqi: 218, name: "Industrial A7",   status: "online" },
  { id: "S-002", x: 0.68, y: 0.48, aqi: 186, name: "Ring 12",         status: "online" },
  { id: "S-003", x: 0.44, y: 0.50, aqi: 164, name: "Al Dir'iyah",     status: "online" },
  { id: "S-004", x: 0.58, y: 0.28, aqi: 148, name: "Airport Perim.", status: "online" },
  { id: "S-005", x: 0.52, y: 0.56, aqi: 132, name: "Olaya",           status: "online" },
  { id: "S-006", x: 0.48, y: 0.62, aqi: 98,  name: "Diplomatic Q.",   status: "online" },
  { id: "S-007", x: 0.32, y: 0.68, aqi: 46,  name: "Wadi Hanifah",    status: "online" },
  { id: "S-008", x: 0.60, y: 0.42, aqi: 174, name: "Malaz North",     status: "online" },
  { id: "S-009", x: 0.40, y: 0.38, aqi: 112, name: "Irqah",           status: "online" },
  { id: "S-010", x: 0.78, y: 0.55, aqi: 156, name: "East Ind. 3",     status: "online" },
  { id: "S-011", x: 0.26, y: 0.48, aqi: 68,  name: "West Suburb",     status: "online" },
  { id: "S-012", x: 0.64, y: 0.64, aqi: 142, name: "Batha",           status: "online" },
  { id: "S-013", x: 0.54, y: 0.44, aqi: 168, name: "KACST",           status: "online" },
  { id: "S-014", x: 0.36, y: 0.58, aqi: 82,  name: "Hittin",          status: "online" },
  { id: "S-015", x: 0.70, y: 0.30, aqi: 192, name: "North Ind.",      status: "online" },
  { id: "S-016", x: 0.48, y: 0.36, aqi: 104, name: "Al Rabwah",       status: "offline" },
  { id: "S-017", x: 0.56, y: 0.72, aqi: 78,  name: "South Belt",      status: "online" },
  { id: "S-018", x: 0.22, y: 0.30, aqi: 54,  name: "Uyayna",          status: "online" },
];

const ALERTS = [
  { sev: "crit", title: "PM2.5 threshold exceeded",   where: "Industrial Corridor A7", time: "2m" },
  { sev: "warn", title: "NO₂ rising — traffic peak",  where: "Ring Road 12",           time: "11m" },
  { sev: "crit", title: "Sensor offline",              where: "S-016 Al Rabwah",        time: "34m" },
  { sev: "info", title: "Dispatch assigned",           where: "Team Bravo → Zone A7",   time: "42m" },
  { sev: "warn", title: "Forecast: dust event",        where: "Citywide, 18:00–22:00",  time: "1h" },
  { sev: "ok",   title: "PM10 returned to normal",     where: "Diplomatic Quarter",     time: "2h" },
  { sev: "info", title: "Report exported",              where: "Weekly — stakeholders", time: "3h" },
];

const SOURCES = [
  { key: "traffic",  name: "Traffic",      pct: 38, color: "oklch(0.68 0.20 28)" },
  { key: "industry", name: "Industry",     pct: 28, color: "oklch(0.55 0.20 340)" },
  { key: "dust",     name: "Dust / storms",pct: 22, color: "oklch(0.78 0.17 60)" },
  { key: "other",    name: "Other",        pct: 12, color: "oklch(0.52 0.04 270)" },
];

const FORECAST = [
  { hr: "17:00", val: 142, band: "usg" },
  { hr: "18:00", val: 156, band: "unh" },
  { hr: "20:00", val: 178, band: "unh" },
  { hr: "22:00", val: 168, band: "unh" },
  { hr: "00:00", val: 124, band: "usg" },
  { hr: "06:00", val: 88,  band: "mod" },
];

// Generate pseudo time series for charts
function genSeries(seed, n = 60, base = 130, amp = 30) {
  const r = mulberry32(seed);
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * amp * 0.4;
    v = Math.max(base - amp, Math.min(base + amp, v));
    // occasional spike
    if (r() > 0.95) v += (r() - 0.3) * amp * 1.5;
    out.push(Math.max(10, v));
  }
  return out;
}
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

Object.assign(window, {
  AQI_BANDS, bandFor, POLLUTANTS, HOTSPOTS, SENSORS, ALERTS, SOURCES, FORECAST, genSeries
});
