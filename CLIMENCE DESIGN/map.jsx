// Map with heatmap overlay and sensor markers
const { useState, useRef, useEffect, useMemo } = React;

function MapView({ mode, pollutantKey, onPickSensor, density }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);

  // AQI color getter
  const aqiColor = (v) => {
    const b = bandFor(v);
    return `var(--aqi-${b.key})`;
  };

  return (
    <div className="map" ref={ref}>
      {/* Stylized road network */}
      <svg className="map-svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="glow-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.68 0.20 28)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="oklch(0.85 0.16 85)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="oklch(0.85 0.16 85)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-o" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.78 0.17 60)" stopOpacity="0.45" />
            <stop offset="70%" stopColor="oklch(0.78 0.17 60)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.78 0.14 155)" stopOpacity="0.45" />
            <stop offset="70%" stopColor="oklch(0.78 0.14 155)" stopOpacity="0" />
          </radialGradient>
          <pattern id="contours" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="18" fill="none" stroke="oklch(0.30 0.012 270 / 0.25)" strokeWidth="0.5"/>
            <circle cx="30" cy="30" r="8" fill="none" stroke="oklch(0.30 0.012 270 / 0.2)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* River / wadi */}
        <path d="M 80 680 C 160 560, 180 480, 260 420 S 360 320, 420 280 S 520 220, 600 160 S 760 80, 920 40"
              fill="none" stroke="oklch(0.30 0.04 230 / 0.35)" strokeWidth="18" strokeLinecap="round" />
        <path d="M 80 680 C 160 560, 180 480, 260 420 S 360 320, 420 280 S 520 220, 600 160 S 760 80, 920 40"
              fill="none" stroke="oklch(0.38 0.05 230 / 0.5)" strokeWidth="1" strokeLinecap="round" />

        {/* Ring roads */}
        <circle cx="500" cy="380" r="220" fill="none" stroke="oklch(0.36 0.012 270 / 0.5)" strokeWidth="1.5" strokeDasharray="0" />
        <circle cx="500" cy="380" r="150" fill="none" stroke="oklch(0.36 0.012 270 / 0.4)" strokeWidth="1" />

        {/* Highways */}
        <path d="M 0 380 L 1000 380" stroke="oklch(0.38 0.012 270 / 0.45)" strokeWidth="1.5" />
        <path d="M 500 0 L 500 700" stroke="oklch(0.38 0.012 270 / 0.45)" strokeWidth="1.5" />
        <path d="M 120 0 L 880 700" stroke="oklch(0.34 0.012 270 / 0.35)" strokeWidth="1" />
        <path d="M 880 0 L 120 700" stroke="oklch(0.34 0.012 270 / 0.35)" strokeWidth="1" />

        {/* Heatmap blobs — only when mode === heatmap */}
        {mode === "heatmap" && (
          <g style={{mixBlendMode: "screen"}}>
            <circle cx="720" cy="250" r="180" fill="url(#glow-r)" />
            <circle cx="680" cy="340" r="150" fill="url(#glow-r)" />
            <circle cx="580" cy="200" r="130" fill="url(#glow-o)" />
            <circle cx="440" cy="350" r="140" fill="url(#glow-o)" />
            <circle cx="520" cy="400" r="110" fill="url(#glow-o)" />
            <circle cx="320" cy="480" r="160" fill="url(#glow-g)" />
            <circle cx="260" cy="210" r="120" fill="url(#glow-g)" />
          </g>
        )}
      </svg>

      {/* District labels */}
      <div className="map-label major" style={{top: "48%", left: "52%"}}>RIYADH</div>
      <div className="map-label" style={{top: "30%", left: "62%"}}>Al Jubaylah</div>
      <div className="map-label" style={{top: "50%", left: "44%"}}>Ad Dir'iyah</div>
      <div className="map-label" style={{top: "26%", left: "70%"}}>Al Janadriyah</div>
      <div className="map-label" style={{top: "68%", left: "36%"}}>Wadi Hanifah</div>
      <div className="map-label" style={{top: "60%", left: "70%"}}>Al Malaz</div>
      <div className="map-label" style={{top: "72%", left: "56%"}}>Al Batha</div>

      {/* Sensor markers */}
      {SENSORS.slice(0, density).map((s) => {
        const c = `var(--aqi-${bandFor(s.aqi).key})`;
        const isCritical = s.aqi >= 150;
        return (
          <div
            key={s.id}
            className={"sensor " + (isCritical ? "pulse-ring" : "")}
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, "--_c": c, opacity: s.status === "offline" ? 0.35 : 1 }}
            onMouseEnter={(e) => setHover({ s, x: s.x, y: s.y })}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPickSensor && onPickSensor(s)}
          />
        );
      })}

      {/* Tooltip */}
      {hover && (
        <div className="tooltip" style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }}>
          <div className="tooltip-title">
            <span className="tooltip-name">{hover.s.name}</span>
            <span className="mono" style={{ color: "var(--ink-3)", fontSize: 10 }}>{hover.s.id}</span>
          </div>
          <div className="tooltip-row"><span>AQI</span><span className="v" style={{color: `var(--aqi-${bandFor(hover.s.aqi).key})`}}>{hover.s.aqi}</span></div>
          <div className="tooltip-row"><span>Dominant</span><span className="v">{pollutantKey.toUpperCase().replace(/(\d)/, '$1')}</span></div>
          <div className="tooltip-row"><span>Status</span><span className="v">{hover.s.status}</span></div>
        </div>
      )}
    </div>
  );
}

window.MapView = MapView;
