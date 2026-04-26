import {
  PM25_ALERT_THRESHOLD,
  type AlertThresholdConfig,
  type CityTrendPoint,
  type Hotspot,
  type TelemetryInput,
  type TelemetryRecord,
  type TelemetrySnapshot,
} from '@climence/shared';
import db from './client';

const insertStmt = db.prepare(`
  INSERT INTO TelemetryLogs (
    uuid, state, batteryLevel, lat, lng,
    pm25, co2, no2, temperature, humidity, rssi, client_timestamp
  ) VALUES (
    @uuid, @state, @batteryLevel, @lat, @lng,
    @pm25, @co2, @no2, @temperature, @humidity, @rssi, @client_timestamp
  )
`);

export const insertFleet = db.transaction((drones: TelemetryInput[]) => {
  for (const drone of drones) {
    insertStmt.run({
      uuid: drone.uuid,
      state: drone.state,
      batteryLevel: drone.batteryLevel,
      lat: drone.location.lat,
      lng: drone.location.lng,
      pm25: drone.airQuality.pm25,
      co2: drone.airQuality.co2,
      no2: drone.airQuality.no2,
      temperature: drone.airQuality.temperature,
      humidity: drone.airQuality.humidity,
      rssi: drone.rssi,
      client_timestamp: drone.timestamp,
    });
  }
});

const latestStmt = db.prepare(`
  SELECT * FROM TelemetryLogs
  WHERE id IN (
    SELECT MAX(id) FROM TelemetryLogs
    WHERE server_timestamp >= datetime('now', '-5 minutes')
    GROUP BY uuid
  )
`);

export const getLatest = (): TelemetryRecord[] => latestStmt.all() as TelemetryRecord[];

const historyStmt = db.prepare(`
  SELECT * FROM (
    SELECT * FROM TelemetryLogs
    WHERE uuid = ?
    ORDER BY server_timestamp DESC
    LIMIT 60
  ) ordered_desc
  ORDER BY server_timestamp ASC
`);

export const getHistory = (droneId: string): TelemetryRecord[] =>
  historyStmt.all(droneId) as TelemetryRecord[];

const cityTrendStmt = db.prepare(`
  SELECT
    strftime('%H:%M', server_timestamp) as minute_label,
    AVG(pm25) as avg_pm25,
    AVG(co2) as avg_co2
  FROM TelemetryLogs
  WHERE server_timestamp >= datetime('now', '-30 minutes')
  GROUP BY strftime('%Y-%m-%d %H:%M', server_timestamp)
  ORDER BY server_timestamp ASC
`);

export const getCityTrend = (): CityTrendPoint[] => cityTrendStmt.all() as CityTrendPoint[];

const hotspotsStmt = db.prepare(`
  SELECT
    ROUND(lat, 2) as lat_zone,
    ROUND(lng, 2) as lng_zone,
    AVG(pm25) as avg_pm25
  FROM TelemetryLogs
  WHERE server_timestamp >= datetime('now', '-5 minutes')
  GROUP BY ROUND(lat, 2), ROUND(lng, 2)
  ORDER BY avg_pm25 DESC
  LIMIT 3
`);

export const getHotspots = (): Hotspot[] => hotspotsStmt.all() as Hotspot[];

const activeAlertsStmt = db.prepare(`
  SELECT * FROM TelemetryLogs
  WHERE id IN (
    SELECT MAX(id) FROM TelemetryLogs
    WHERE server_timestamp >= datetime('now', '-5 minutes')
    GROUP BY uuid
  )
  AND pm25 > ?
`);

export const getActiveAlerts = (pm25Threshold: number): TelemetryRecord[] =>
  activeAlertsStmt.all(pm25Threshold) as TelemetryRecord[];

const ensureAlertConfigStmt = db.prepare(`
  INSERT OR IGNORE INTO AlertConfig (id, pm25_threshold)
  VALUES (1, ?)
`);

const alertConfigStmt = db.prepare(`
  SELECT pm25_threshold, updated_at
  FROM AlertConfig
  WHERE id = 1
`);

const updateAlertConfigStmt = db.prepare(`
  UPDATE AlertConfig
  SET pm25_threshold = @pm25_threshold,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`);

export function getAlertThresholdConfig(): AlertThresholdConfig {
  ensureAlertConfigStmt.run(PM25_ALERT_THRESHOLD);
  return alertConfigStmt.get() as AlertThresholdConfig;
}

export function getAlertThresholdPm25(): number {
  return getAlertThresholdConfig().pm25_threshold;
}

export function setAlertThresholdPm25(pm25Threshold: number): AlertThresholdConfig {
  ensureAlertConfigStmt.run(PM25_ALERT_THRESHOLD);
  updateAlertConfigStmt.run({ pm25_threshold: pm25Threshold });
  return getAlertThresholdConfig();
}

export function computeSnapshot(): TelemetrySnapshot {
  const alertThresholdPm25 = getAlertThresholdPm25();
  return {
    drones: getLatest(),
    alerts: getActiveAlerts(alertThresholdPm25),
    cityTrend: getCityTrend(),
    hotspots: getHotspots(),
    alertThresholdPm25,
    emittedAt: new Date().toISOString(),
  };
}
