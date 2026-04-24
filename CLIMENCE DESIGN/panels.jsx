// Sidebar panels + charts

const { useState: useS2 } = React;

// ———— Sparkline ————
function Sparkline({ data, color = "var(--ink-1)", height = 26, width = 120, fill = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const area = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width: "100%"}}>
      {fill && <polygon points={area} fill={color} opacity="0.12" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ———— KPI strip ————
function KpiStrip({ onlineSensors, totalSensors }) {
  const citySeries = genSeries(1, 40, 142, 25);
  return (
    <div className="kpi-strip">
      <div className="kpi">
        <div className="kpi-label eyebrow"><Icon.Activity size={11} /> City AQI · Now</div>
        <div className="kpi-row">
          <div className="kpi-value" style={{color: "var(--aqi-unh)"}}>168</div>
          <span className="band"><span className="dot" style={{background: "var(--aqi-unh)"}}/>Unhealthy</span>
          <span className="kpi-delta up"><Icon.ArrowUp size={11} strokeWidth={2.5}/>+14 vs. 1h</span>
        </div>
        <div className="kpi-spark">
          <Sparkline data={citySeries} color="oklch(0.68 0.20 28)" height={26} width={240} />
        </div>
      </div>

      <div className="kpi">
        <div className="kpi-label eyebrow"><Icon.Flame size={11} /> Dominant Pollutant</div>
        <div className="kpi-row">
          <div className="kpi-value">PM<span style={{fontSize: 22}}>2.5</span></div>
          <span className="kpi-unit">87 µg/m³</span>
        </div>
        <div className="kpi-meta tnum">2.5× WHO 24h guideline (35)</div>
      </div>

      <div className="kpi">
        <div className="kpi-label eyebrow"><Icon.Siren size={11} /> Active Alerts</div>
        <div className="kpi-row">
          <div className="kpi-value" style={{color: "var(--aqi-unh)"}}>7</div>
          <span className="kpi-unit">3 crit · 4 warn</span>
        </div>
        <div className="kpi-meta">↑ 2 in last hour · <a style={{color: "var(--ink-1)", textDecoration: "underline", textDecorationColor: "var(--ink-3)"}}>View feed</a></div>
      </div>

      <div className="kpi">
        <div className="kpi-label eyebrow"><Icon.Radio size={11} /> Sensors Online</div>
        <div className="kpi-row">
          <div className="kpi-value">{onlineSensors}<span style={{color: "var(--ink-3)", fontSize: 22}}>/{totalSensors}</span></div>
          <span className="kpi-delta down"><Icon.ArrowDown size={11} strokeWidth={2.5}/>1 offline</span>
        </div>
        <div className="kpi-meta">Uptime 99.2% · 24h</div>
      </div>

      <div className="kpi">
        <div className="kpi-label eyebrow"><Icon.Wind size={11} /> Wind · Humidity</div>
        <div className="kpi-row">
          <div className="kpi-value">14<span className="kpi-unit" style={{fontSize: 14, marginLeft: 4}}>km/h</span></div>
          <span className="band" style={{paddingTop: 3}}><span className="dot" style={{background: "var(--brand)"}}/>NW → SE</span>
        </div>
        <div className="kpi-meta">Humidity 22% · Temp 34°C</div>
      </div>
    </div>
  );
}

// ———— Main chart ————
function CityTrendChart({ range, pollutantKey }) {
  const seed = { "1h": 3, "24h": 7, "7d": 11, "30d": 19 }[range] || 7;
  const n = { "1h": 20, "24h": 48, "7d": 84, "30d": 120 }[range] || 48;
  const pm25 = genSeries(seed, n, 90, 35);
  const pm10 = genSeries(seed + 1, n, 140, 40);
  const no2  = genSeries(seed + 2, n, 45, 20);

  const W = 340, H = 180, pad = { l: 28, r: 30, t: 8, b: 22 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = 200;
  const xAt = (i) => pad.l + (i / (n - 1)) * innerW;
  const yAt = (v) => pad.t + innerH - (v / max) * innerH;
  const path = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`).join(" ");

  const ticks = [0, 50, 100, 150, 200];
  const timeTicks = range === "1h"
    ? ["14:00","14:15","14:30","14:45","15:00"]
    : range === "24h"
    ? ["00","06","12","18","24"]
    : range === "7d"
    ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    : ["W1","W2","W3","W4"];

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{height: 200}}>
      <defs>
        <linearGradient id="area-pm25" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.68 0.20 28)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="oklch(0.68 0.20 28)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* AQI band backgrounds */}
      <rect x={pad.l} y={yAt(50)}  width={innerW} height={yAt(0)-yAt(50)}   fill="oklch(0.78 0.14 155 / 0.04)"/>
      <rect x={pad.l} y={yAt(100)} width={innerW} height={yAt(50)-yAt(100)} fill="oklch(0.85 0.16 95 / 0.04)"/>
      <rect x={pad.l} y={yAt(150)} width={innerW} height={yAt(100)-yAt(150)} fill="oklch(0.78 0.17 60 / 0.05)"/>
      <rect x={pad.l} y={yAt(200)} width={innerW} height={yAt(150)-yAt(200)} fill="oklch(0.68 0.20 28 / 0.05)"/>

      {/* Grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line className="chart-grid" x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} />
          <text className="chart-label" x={pad.l - 6} y={yAt(t) + 3} textAnchor="end">{t}</text>
        </g>
      ))}
      {timeTicks.map((t, i) => {
        const x = pad.l + (i / (timeTicks.length - 1)) * innerW;
        return <text key={i} className="chart-label" x={x} y={H - 6} textAnchor="middle">{t}</text>;
      })}

      {/* WHO guideline line */}
      <line x1={pad.l} x2={W - pad.r} y1={yAt(35)} y2={yAt(35)} stroke="oklch(0.68 0.16 285)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>
      <text className="chart-label" x={W - pad.r - 3} y={yAt(35) - 3} textAnchor="end" fill="var(--brand)">WHO 35</text>

      {/* Area + series */}
      <path d={`${path(pm25)} L ${xAt(n-1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`} fill="url(#area-pm25)"/>
      <path d={path(no2)}  fill="none" stroke="oklch(0.85 0.16 95)"  strokeWidth="1.5" opacity="0.85"/>
      <path d={path(pm10)} fill="none" stroke="oklch(0.78 0.17 60)"  strokeWidth="1.5" opacity="0.85"/>
      <path d={path(pm25)} fill="none" stroke="oklch(0.68 0.20 28)"  strokeWidth="1.8"/>

      {/* Now dot */}
      <circle cx={xAt(n-1)} cy={yAt(pm25[n-1])} r="3.5" fill="oklch(0.68 0.20 28)" stroke="var(--bg-0)" strokeWidth="1.5"/>
    </svg>
  );
}

// ———— City trend panel ————
function CityTrendPanel({ range, setRange, pollutantKey }) {
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">Trend · {pollutantKey.toUpperCase()}</div>
          <div className="side-title">City-wide</div>
        </div>
        <div className="range-picker">
          {["1h","24h","7d","30d"].map(r => (
            <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="chart-wrap">
        <CityTrendChart range={range} pollutantKey={pollutantKey} />
      </div>
      <div className="row-between" style={{marginTop: 8, fontSize: 11.5, color: "var(--ink-2)"}}>
        <div className="row-flex gap-tight">
          <span className="row-flex gap-tight"><span style={{width: 10, height: 2, background: "oklch(0.68 0.20 28)"}}/> PM2.5</span>
          <span className="row-flex gap-tight" style={{marginLeft: 8}}><span style={{width: 10, height: 2, background: "oklch(0.78 0.17 60)"}}/> PM10</span>
          <span className="row-flex gap-tight" style={{marginLeft: 8}}><span style={{width: 10, height: 2, background: "oklch(0.85 0.16 95)"}}/> NO₂</span>
        </div>
        <span className="mono tnum" style={{color: "var(--ink-3)", fontSize: 10.5}}>updated 12s ago</span>
      </div>
    </div>
  );
}

// ———— Pollutant breakdown ————
function PollutantPanel({ activeKey, setActiveKey }) {
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">Breakdown · now</div>
          <div className="side-title">Pollutants</div>
        </div>
        <button className="btn" style={{padding: "5px 10px", fontSize: 11}}><Icon.Filter size={11}/> All</button>
      </div>
      <div className="pollutant-grid">
        {POLLUTANTS.map(p => {
          const pctColor = p.pct > 70 ? "var(--aqi-unh)" : p.pct > 50 ? "var(--aqi-usg)" : p.pct > 30 ? "var(--aqi-mod)" : "var(--aqi-good)";
          return (
            <div key={p.key} className={"pcard " + (activeKey === p.key ? "active" : "")} onClick={() => setActiveKey(p.key)}>
              <div className="pcard-head">
                <div className="pcard-name">{p.name} <span className="sub">{p.sub}</span></div>
                <span className={"pcard-delta " + (p.delta > 0 ? "up" : "down")}>{p.delta > 0 ? "+" : ""}{p.delta}</span>
              </div>
              <div className="pcard-val tnum">{p.value}<span className="pcard-unit">{p.sub}</span></div>
              <div className="pcard-bar"><div className="fill" style={{ width: `${p.pct}%`, background: pctColor }}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ———— Hotspots ————
function HotspotsPanel({ selectedId, onSelect }) {
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">Last 5 min · ranked</div>
          <div className="side-title">Hotspots <span className="cnt">07</span></div>
        </div>
        <button className="btn" style={{padding: "5px 10px", fontSize: 11}}><Icon.MapPin size={11}/> On map</button>
      </div>
      <ul>
        {HOTSPOTS.map((h, i) => (
          <li key={h.id}
              className={"hotspot " + (selectedId === h.id ? "selected" : "")}
              onClick={() => onSelect(h)}>
            <div className="hotspot-rank">#{String(i+1).padStart(2,"0")}</div>
            <div>
              <div className="hotspot-name">{h.name}</div>
              <div className="hotspot-coord">{h.coord} · dom. {h.pollutant}</div>
            </div>
            <div className={"hotspot-val " + h.band}>
              <div className="n tnum">{h.aqi}</div>
              <div className="u">AQI · {h.trend > 0 ? "+" : ""}{h.trend}%</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ———— Weather ————
function WeatherPanel() {
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">Meteorology</div>
          <div className="side-title">Weather</div>
        </div>
        <span className="mono tnum" style={{fontSize: 10.5, color: "var(--ink-3)"}}>Riyadh · 14:42</span>
      </div>
      <div className="weather-row">
        <div className="weather-cell">
          <div className="l">Temperature</div>
          <div className="v tnum">34°<span className="u"> C</span></div>
        </div>
        <div className="weather-cell">
          <div className="l">Humidity</div>
          <div className="v tnum">22<span className="u"> %</span></div>
        </div>
        <div className="weather-cell">
          <div className="l">Pressure</div>
          <div className="v tnum">1013<span className="u"> hPa</span></div>
        </div>
      </div>
      <div className="wind-compass">
        <div className="compass">
          <div className="compass-arrow" style={{transform: "rotate(135deg)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 L6 21 L12 17 L18 21 Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div className="wind-meta">
          <div className="hd">Wind · carrying pollution SE</div>
          <div className="dir">14 <span style={{fontSize: 13, color: "var(--ink-3)"}}>km/h · NW</span></div>
          <div className="sub">Gusts to 22 · dust advisory</div>
        </div>
      </div>
    </div>
  );
}

// ———— Forecast ————
function ForecastPanel() {
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">AQI · next 14 hours</div>
          <div className="side-title">Forecast</div>
        </div>
        <span className="band"><Icon.Sparkles size={10}/> ML v2.1</span>
      </div>
      <div className="forecast">
        {FORECAST.map((f, i) => (
          <div key={i} className="f-cell">
            <div className="f-hr">{f.hr}</div>
            <div className="f-val tnum">{f.val}</div>
            <div className="f-dot" style={{background: `var(--aqi-${f.band})`}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ———— Source attribution ————
function SourcePanel() {
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">Attribution · 24h</div>
          <div className="side-title">Sources</div>
        </div>
      </div>
      <div className="src-bar">
        {SOURCES.map(s => (
          <div key={s.key} style={{ flex: s.pct, background: s.color }}>{s.pct}%</div>
        ))}
      </div>
      <div className="src-legend">
        {SOURCES.map(s => (
          <div key={s.key} className="src-row">
            <span className="sw" style={{background: s.color}}/>
            <span>{s.name}</span>
            <span className="pct tnum">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ———— Alerts feed ————
function AlertsPanel() {
  const iconFor = (sev) => sev === "crit" ? <Icon.AlertTriangle size={12}/>
    : sev === "warn" ? <Icon.AlertTriangle size={12}/>
    : sev === "ok" ? <Icon.Activity size={12}/>
    : <Icon.Bell size={12}/>;
  return (
    <div className="side-group">
      <div className="side-head">
        <div>
          <div className="eyebrow">Events · live</div>
          <div className="side-title">Feed</div>
        </div>
        <button className="btn" style={{padding: "5px 10px", fontSize: 11}}>All</button>
      </div>
      <ul>
        {ALERTS.map((a, i) => (
          <li key={i} className="alert">
            <div className={"alert-icon " + a.sev}>{iconFor(a.sev)}</div>
            <div className="alert-body">
              <div className="t"><b>{a.title}</b></div>
              <div className="m">{a.where}</div>
            </div>
            <div className="alert-time">{a.time}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

Object.assign(window, {
  Sparkline, KpiStrip, CityTrendPanel, PollutantPanel, HotspotsPanel,
  WeatherPanel, ForecastPanel, SourcePanel, AlertsPanel, CityTrendChart,
});
