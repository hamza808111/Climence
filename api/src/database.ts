import Database from 'better-sqlite3';

const db = new Database('telemetry.db');

// Initialize the database table
db.exec(`
  CREATE TABLE IF NOT EXISTS TelemetryLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL,
    state TEXT NOT NULL,
    batteryLevel REAL NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    pm25 REAL NOT NULL,
    co2 REAL NOT NULL,
    no2 REAL NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    rssi INTEGER NOT NULL,
    client_timestamp TEXT NOT NULL,
    server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
// Phase 9: Stateful alerts table for spatial 5km tracking arrays
db.exec(`
  CREATE TABLE IF NOT EXISTS HazardAlerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    pm25 REAL NOT NULL,
    status TEXT DEFAULT 'Active',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
