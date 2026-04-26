// Main CLIMENCE Command Center app
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfy",
  "accent": "violet",
  "mapStyle": "dark",
  "showHeatmap": true,
  "colorblindSafe": true
}/*EDITMODE-END*/;

function Drawer({ hotspot, onClose }) {
  if (!hotspot) return null;
  const b = bandFor(hotspot.aqi);
  const series = genSeries(hotspot.id * 7, 48, hotspot.aqi * 0.7, 50);
  return (
    <div className={"drawer " + (hotspot ? "open" : "")}>
      <div className="drawer-head">
        <div>
          <div className="eyebrow" style={{marginBottom: 6}}>Hotspot · rank #0{hotspot.id}</div>
          <h3>{hotspot.name}</h3>
          <div className="coord">{hotspot.coord}</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.X size={14}/></button>
      </div>
      <div className="drawer-body">
        <div style={{display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12}}>
          <div className="serif tnum" style={{fontSize: 72, lineHeight: 0.9, color: `var(--aqi-${hotspot.band})`, letterSpacing: "-0.02em"}}>{hotspot.aqi}</div>
          <div>
            <span className="band"><span className="dot" style={{background: `var(--aqi-${hotspot.band})`}}/>{b.label}</span>
            <div className="mono" style={{fontSize: 11, color: "var(--ink-3)", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase"}}>AQI · dominant {hotspot.pollutant}</div>
          </div>
        </div>

        <div style={{margin: "14px 0 6px"}} className="eyebrow">48h trend</div>
        <div style={{height: 60}}>
          <Sparkline data={series} color={`var(--aqi-${hotspot.band})`} width={380} height={60}/>
        </div>

        <div style={{marginTop: 18}} className="eyebrow">Pollutant readings</div>
        <div className="pollutant-grid" style={{marginTop: 8}}>
          {POLLUTANTS.slice(0, 4).map(p => (
            <div key={p.key} className="pcard" style={{cursor: "default"}}>
              <div className="pcard-head">
                <div className="pcard-name">{p.name} <span className="sub">{p.sub}</span></div>
              </div>
              <div className="pcard-val tnum" style={{fontSize: 22}}>{p.value}<span className="pcard-unit">{p.sub}</span></div>
            </div>
          ))}
        </div>

        <div style={{marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8}}>
          <button className="btn primary" style={{justifyContent: "center"}}><Icon.Siren size={13}/>Dispatch team</button>
          <button className="btn" style={{justifyContent: "center"}}><Icon.FileText size={13}/>Full report</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("heatmap"); // hardware | heatmap
  const [pollutant, setPollutant] = useState("pm25");
  const [range, setRange] = useState("24h");
  const [selected, setSelected] = useState(null);
  const [rtl, setRtl] = useState(false);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", rtl ? "ar" : "en");
  }, [rtl]);

  const online = SENSORS.filter(s => s.status === "online").length;

  // AQI pollutant pill values (mock distribution)
  const pillVals = { pm25: 87, pm10: 142, no2: 34, o3: 62, so2: 12, co: 1.4 };
  const pollutantList = [
    { key: "pm25", label: "PM2.5" },
    { key: "pm10", label: "PM10" },
    { key: "no2",  label: "NO₂" },
    { key: "o3",   label: "O₃" },
    { key: "so2",  label: "SO₂" },
    { key: "co",   label: "CO" },
  ];

  return (
    <div className="app">
      {/* Nav */}
      <nav className="nav">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">Climence</div>
            <div className="brand-sub">Command Center</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Monitor</div>
          <button className="nav-item active"><Icon.Home size={16}/>Overview</button>
          <button className="nav-item"><Icon.Map size={16}/>Live Map</button>
          <button className="nav-item"><Icon.BarChart size={16}/>Analytics</button>
          <button className="nav-item"><Icon.Siren size={16}/>Alerts <span className="count tnum">7</span></button>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Operate</div>
          <button className="nav-item"><Icon.Cpu size={16}/>Sensors <span className="count tnum">{online}/{SENSORS.length}</span></button>
          <button className="nav-item"><Icon.Users size={16}/>Dispatch</button>
          <button className="nav-item"><Icon.FileText size={16}/>Reports</button>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">System</div>
          <button className="nav-item"><Icon.Layers size={16}/>Integrations</button>
          <button className="nav-item"><Icon.Settings size={16}/>Settings</button>
        </div>

        <div className="nav-footer">
          <div className="user-chip">
            <div className="avatar">RA</div>
            <div style={{flex: 1, minWidth: 0}}>
              <div className="user-name">R. Al-Saif</div>
              <div className="user-role">Ops lead · Riyadh</div>
            </div>
            <Icon.ChevronRight size={14}/>
          </div>
        </div>
      </nav>

      {/* Topbar */}
      <header className="topbar">
        <div className="crumb">
          <span>Monitor</span>
          <span className="crumb-sep"> / </span>
          <span className="crumb-cur">Overview</span>
        </div>

        <span className="live"><span className="pulse"/>Live · 12s</span>

        <div className="seg" style={{marginLeft: 8}}>
          <button className={"seg-btn " + (mode === "hardware" ? "active" : "")} onClick={() => setMode("hardware")}>
            <Icon.Grid/> Hardware Grid
          </button>
          <button className={"seg-btn " + (mode === "heatmap" ? "active" : "")} onClick={() => setMode("heatmap")}>
            <Icon.Layers/> AQI Heatmap
          </button>
        </div>

        <div className="topbar-spacer"/>

        <div className="search">
          <Icon.Search/>
          <input placeholder={rtl ? "البحث عن أجهزة الاستشعار، المناطق…" : "Search sensors, zones, incidents…"}/>
          <span className="kbd">⌘K</span>
        </div>

        <button className="icon-btn" onClick={() => setRtl(!rtl)} title="Toggle language / direction">
          <Icon.Languages/>
        </button>
        <button className="icon-btn"><Icon.Calendar/></button>
        <button className="icon-btn">
          <Icon.Bell/>
          <span className="badge tnum">7</span>
        </button>
        <button className="btn primary"><Icon.Download/>Export report</button>
      </header>

      {/* Main */}
      <main className="main">
        <KpiStrip onlineSensors={online} totalSensors={SENSORS.length}/>

        <div className="stage">
          <MapView mode={mode} pollutantKey={pollutant} onPickSensor={(s) => {
            const h = HOTSPOTS.find(h => h.name.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])) || HOTSPOTS[0];
            setSelected({ ...h, name: s.name, coord: `${(24 + s.y * 0.4).toFixed(3)}, ${(46.5 + s.x * 0.5).toFixed(3)}`, aqi: s.aqi, band: bandFor(s.aqi).key });
          }} density={SENSORS.length}/>

          {/* Top-left: pollutant switcher */}
          <div className="map-panel-tl">
            <div className="pollutants">
              {pollutantList.map(p => (
                <button key={p.key} className={"pollutant-pill " + (pollutant === p.key ? "active" : "")} onClick={() => setPollutant(p.key)}>
                  {p.label}
                  <span className="val tnum">{pillVals[p.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Top-right: map tools */}
          <div className="map-panel-tr glass">
            <div className="map-tools">
              <button className="map-tool" title="Zoom in"><Icon.Plus/></button>
              <button className="map-tool" title="Zoom out"><Icon.Minus/></button>
              <div className="map-tool-sep"/>
              <button className="map-tool active" title="Layers"><Icon.Layers/></button>
              <button className="map-tool" title="Fullscreen"><Icon.Maximize/></button>
            </div>
          </div>

          {/* Bottom-left: legend */}
          <div className="map-panel-bl glass legend">
            <div className="legend-title">
              <span className="eyebrow">AQI · US EPA</span>
              <span className="mono" style={{fontSize: 10, color: "var(--ink-3)"}}>{pollutant.toUpperCase()}</span>
            </div>
            <div className="legend-ramp">
              {AQI_BANDS.map(b => <div key={b.key} style={{background: `var(--aqi-${b.key})`}}/>)}
            </div>
            <div className="legend-scale tnum">
              <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300+</span>
            </div>
            <div className="legend-bands">
              {AQI_BANDS.slice(0, 4).map(b => (
                <div key={b.key} className="legend-row">
                  <span className="sw" style={{background: `var(--aqi-${b.key})`}}/>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom-right: sensor stat */}
          <div className="map-panel-br glass" style={{padding: "10px 14px", minWidth: 220}}>
            <div className="row-between">
              <div>
                <div className="eyebrow">Viewing</div>
                <div style={{fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink-0)", letterSpacing: "-0.01em"}}>{SENSORS.length} sensors</div>
              </div>
              <div style={{textAlign: "right"}}>
                <div className="eyebrow">Zoom</div>
                <div className="mono tnum" style={{fontSize: 13, color: "var(--ink-1)"}}>11.4</div>
              </div>
            </div>
            <div className="divider" style={{margin: "10px 0"}}/>
            <div className="row-between" style={{fontSize: 11.5}}>
              <span className="row-flex gap-tight"><span style={{width: 8, height: 8, borderRadius: "50%", background: "var(--ok)"}}/>{online} online</span>
              <span className="row-flex gap-tight"><span style={{width: 8, height: 8, borderRadius: "50%", background: "var(--ink-3)", opacity: 0.6}}/>{SENSORS.length - online} offline</span>
            </div>
          </div>

          {/* Status bar */}
          <div className="statusbar">
            <span className="item"><span className="d"/>Stream · stable</span>
            <span className="item">Model v2.1.4</span>
            <span className="item">Lat. 42ms</span>
            <span className="spacer"/>
            <span className="item">Riyadh · UTC+3</span>
            <span className="item">24.7136°, 46.6753°</span>
          </div>

          <Drawer hotspot={selected} onClose={() => setSelected(null)}/>
        </div>
      </main>

      {/* Side rail */}
      <aside className="side">
        {/* Event banner */}
        <div className="banner">
          <div className="banner-icon"><Icon.AlertTriangle size={14}/></div>
          <div style={{minWidth: 0, flex: 1}}>
            <div className="banner-title">PM2.5 exceeds WHO guideline by 2.5×</div>
            <div className="banner-sub">Industrial Corridor · advisory active</div>
          </div>
          <button className="banner-cta">Dispatch</button>
        </div>

        <CityTrendPanel range={range} setRange={setRange} pollutantKey={pollutant}/>
        <HotspotsPanel selectedId={selected?.id} onSelect={(h) => setSelected(h)}/>
        <PollutantPanel activeKey={pollutant} setActiveKey={setPollutant}/>
        <WeatherPanel/>
        <ForecastPanel/>
        <SourcePanel/>
        <AlertsPanel/>
      </aside>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Layout">
          <TweakRadio label="Density" value={tweaks.density}
            options={[{label: "Comfy", value: "comfy"}, {label: "Compact", value: "compact"}]}
            onChange={(v) => { setTweak("density", v); document.documentElement.style.setProperty("--kpi-pad", v === "compact" ? "10px 14px" : "14px 18px"); }}/>
        </TweakSection>
        <TweakSection title="Map">
          <TweakToggle label="Show heatmap" value={tweaks.showHeatmap} onChange={(v) => setTweak("showHeatmap", v)}/>
          <TweakSelect label="Map style" value={tweaks.mapStyle}
            options={[{label: "Dark", value: "dark"}, {label: "Satellite", value: "sat"}, {label: "Terrain", value: "ter"}]}
            onChange={(v) => setTweak("mapStyle", v)}/>
        </TweakSection>
        <TweakSection title="Palette">
          <TweakToggle label="Colorblind-safe AQI" value={tweaks.colorblindSafe} onChange={(v) => setTweak("colorblindSafe", v)}/>
          <TweakRadio label="Accent" value={tweaks.accent}
            options={[{label: "Violet", value: "violet"}, {label: "Teal", value: "teal"}, {label: "Amber", value: "amber"}]}
            onChange={(v) => {
              setTweak("accent", v);
              const map = { violet: "oklch(0.68 0.16 285)", teal: "oklch(0.72 0.12 195)", amber: "oklch(0.80 0.16 70)" };
              document.documentElement.style.setProperty("--brand", map[v]);
            }}/>
        </TweakSection>
        <TweakSection title="Locale">
          <TweakToggle label="Right-to-left (AR)" value={rtl} onChange={setRtl}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
