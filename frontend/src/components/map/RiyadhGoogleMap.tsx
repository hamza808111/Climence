import { useEffect, useMemo, useRef, useState } from 'react';
import { RIYADH_CENTER, type AqiBandKey } from '@climence/shared';

export type RiyadhMapMode = 'hardware' | 'heatmap';

export interface RiyadhMapSensor {
  uuid: string;
  label: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  band: AqiBandKey;
  status: 'online' | 'offline';
}

interface Props {
  apiKey?: string;
  mode: RiyadhMapMode;
  sensors: RiyadhMapSensor[];
  onPickSensor: (sensor: RiyadhMapSensor) => void;
}

type GoogleMapInstance = object;

interface GoogleMarkerInstance {
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (eventName: 'click', handler: () => void) => void;
}

interface GoogleCircleInstance {
  setMap: (map: GoogleMapInstance | null) => void;
}

interface GoogleInfoWindowInstance {
  setContent: (content: string) => void;
  open: (options: { map: GoogleMapInstance; anchor: GoogleMarkerInstance }) => void;
}

interface GoogleMapsNamespace {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance;
  Circle: new (options: Record<string, unknown>) => GoogleCircleInstance;
  InfoWindow: new (options?: Record<string, unknown>) => GoogleInfoWindowInstance;
  SymbolPath: { CIRCLE: number };
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace;
    };
    __climenceGoogleMapsLoader?: Promise<void>;
  }
}

const EARTHY_MAP_STYLE: Array<Record<string, unknown>> = [
  { elementType: 'geometry', stylers: [{ color: '#efe9dd' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7f3eb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7f7565' }] },
  { elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text',
    stylers: [{ visibility: 'on' }, { color: '#625a4c' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text',
    stylers: [{ visibility: 'on' }, { color: '#7a7265' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'labels.text',
    stylers: [{ visibility: 'on' }, { color: '#8a8071' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d6cab7' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#ebe5d6' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#d8d0bf' }],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9d8d4' }],
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
];

const BAND_COLOR: Record<AqiBandKey, string> = {
  good: '#2f9f6b',
  mod: '#c8a93f',
  usg: '#d1873f',
  unh: '#cf5f4a',
  vunh: '#8b5ea5',
  haz: '#7f3c2f',
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve();
  if (window.__climenceGoogleMapsLoader) return window.__climenceGoogleMapsLoader;

  window.__climenceGoogleMapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('climence-google-maps');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'climence-google-maps';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=en&region=SA&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
    document.head.appendChild(script);
  });

  return window.__climenceGoogleMapsLoader;
}

export function RiyadhGoogleMap({ apiKey, mode, sensors, onPickSensor }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);
  const circlesRef = useRef<GoogleCircleInstance[]>([]);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const loadError =
    !apiKey ? 'Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY in .env.local.' : scriptError;

  useEffect(() => {
    if (!apiKey) return;
    if (!mapContainerRef.current) return;

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current || !window.google?.maps) return;

        setScriptError(null);

        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: RIYADH_CENTER.lat, lng: RIYADH_CENTER.lng },
            zoom: 11,
            minZoom: 10,
            maxZoom: 14,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false,
            clickableIcons: false,
            keyboardShortcuts: false,
            gestureHandling: 'greedy',
            styles: EARTHY_MAP_STYLE,
          });
        }

        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.google.maps.InfoWindow();
        }
      })
      .catch(err => {
        if (!cancelled) {
          setScriptError(err instanceof Error ? err.message : 'Google Maps failed to load.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const sortedSensors = useMemo(
    () =>
      [...sensors].sort(
        (a, b) => (b.aqi - aqiFallback(b)) - (a.aqi - aqiFallback(a)),
      ),
    [sensors],
  );

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    const activeMap = mapRef.current;

    markersRef.current.forEach(marker => marker.setMap(null));
    circlesRef.current.forEach(circle => circle.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    for (const sensor of sortedSensors) {
      const color = BAND_COLOR[sensor.band];

      const marker = new window.google.maps.Marker({
        map: activeMap,
        position: { lat: sensor.lat, lng: sensor.lng },
        title: sensor.label,
        zIndex: sensor.aqi,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: sensor.status === 'offline' ? 5.2 : 6.8,
          fillColor: color,
          fillOpacity: sensor.status === 'offline' ? 0.4 : 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 1.8,
        },
      });

      marker.addListener('click', () => {
        onPickSensor(sensor);
        if (!infoWindowRef.current) return;
        infoWindowRef.current.setContent(
          `<div style="font:500 12px Inter, sans-serif; color:#2f2a23;">
            <div style="font-weight:700; margin-bottom:4px;">${escapeHtml(sensor.label)}</div>
            <div>AQI ${Math.round(sensor.aqi)} · PM2.5 ${sensor.pm25.toFixed(1)}</div>
          </div>`,
        );
        infoWindowRef.current.open({ map: activeMap, anchor: marker });
      });

      markersRef.current.push(marker);

      if (mode === 'heatmap') {
        const circle = new window.google.maps.Circle({
          map: activeMap,
          center: { lat: sensor.lat, lng: sensor.lng },
          radius: Math.max(220, sensor.aqi * 12),
          fillColor: color,
          fillOpacity: sensor.status === 'offline' ? 0.04 : 0.16,
          strokeColor: color,
          strokeOpacity: 0.36,
          strokeWeight: 1,
        });
        circlesRef.current.push(circle);
      }
    }
  }, [mode, onPickSensor, sortedSensors]);

  return (
    <div className="map">
      <div className="map-canvas" ref={mapContainerRef} />
      {loadError && (
        <div className="map-fallback">
          <h3>Map setup required</h3>
          <p>{loadError}</p>
        </div>
      )}
    </div>
  );
}

function aqiFallback(sensor: RiyadhMapSensor) {
  return sensor.status === 'offline' ? 30 : 0;
}
