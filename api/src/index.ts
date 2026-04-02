import express from 'express';
import cors from 'cors';
import db from './database';

const app = express();
app.use(cors());
app.use(express.json());

function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Prepare our insertion statement once for performance
const insertStmt = db.prepare(`
  INSERT INTO TelemetryLogs (
    uuid, state, batteryLevel, lat, lng,
    pm25, co2, no2, temperature, humidity, rssi, client_timestamp
  ) VALUES (
    @uuid, @state, @batteryLevel, @lat, @lng,
    @pm25, @co2, @no2, @temperature, @humidity, @rssi, @client_timestamp
  )
`);

app.post('/api/telemetry', (req, res) => {
    const data = req.body;
    
    if (!data.fleet || !Array.isArray(data.fleet)) {
        res.status(400).json({ error: 'Invalid payload. Expected { fleet: [...] }' });
        return;
    }

    try {
        const fetchActiveAlerts = db.prepare("SELECT * FROM HazardAlerts WHERE status = 'Active'");
        const updateAlert = db.prepare("UPDATE HazardAlerts SET updated_at = CURRENT_TIMESTAMP, pm25 = ? WHERE id = ?");
        const updateAlertTime = db.prepare("UPDATE HazardAlerts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        const createAlert = db.prepare("INSERT INTO HazardAlerts (lat, lng, pm25) VALUES (?, ?, ?)");

        // Wrap inserts in a transaction for speed and atomicity
        const insertMany = db.transaction((drones: any[]) => {
            const activeAlerts = fetchActiveAlerts.all() as any[];
            for (const drone of drones) {
                insertStmt.run({
                    uuid: drone.uuid, state: drone.state, batteryLevel: drone.batteryLevel,
                    lat: drone.location.lat, lng: drone.location.lng, pm25: drone.airQuality.pm25,
                    co2: drone.airQuality.co2, no2: drone.airQuality.no2, temperature: drone.airQuality.temperature,
                    humidity: drone.airQuality.humidity, rssi: drone.rssi, client_timestamp: drone.timestamp
                });

                if (drone.airQuality.pm25 > 150) {
                    let collisionFound = false;
                    for (const alert of activeAlerts) {
                        if (getDistanceKM(drone.location.lat, drone.location.lng, alert.lat, alert.lng) <= 5.0) {
                            collisionFound = true;
                            if (drone.airQuality.pm25 > alert.pm25) {
                                updateAlert.run(drone.airQuality.pm25, alert.id);
                                alert.pm25 = drone.airQuality.pm25; // mutate locally to prevent refetching immediately
                            } else {
                                updateAlertTime.run(alert.id);
                            }
                            break;
                        }
                    }
                    if (!collisionFound) {
                        const newAlert = createAlert.run(drone.location.lat, drone.location.lng, drone.airQuality.pm25);
                        activeAlerts.push({ id: newAlert.lastInsertRowid, lat: drone.location.lat, lng: drone.location.lng, pm25: drone.airQuality.pm25, status: 'Active' });
                    }
                }
            }
        });
        
        insertMany(data.fleet);
        console.log(`[${new Date().toISOString()}] Successfully ingested telemetry for ${data.fleet.length} drones.`);
        res.status(200).json({ status: 'success', count: data.fleet.length });
    } catch (err) {
        console.error('Database insertion error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/telemetry/latest', (req, res) => {
    try {
        // Query to get the latest row per UUID (Restricted only to actively broadcasting drones online within the last 5 minutes)
        const latestQuery = `
            SELECT * FROM TelemetryLogs 
            WHERE id IN (
                SELECT MAX(id) FROM TelemetryLogs 
                WHERE server_timestamp >= datetime('now', '-5 minutes')
                GROUP BY uuid
            )
        `;
        const results = db.prepare(latestQuery).all();
        res.status(200).json(results);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/telemetry/history/:droneId', (req, res) => {
    const droneId = req.params.droneId;
    try {
        const query = `
            SELECT * FROM (
                SELECT * FROM TelemetryLogs
                WHERE uuid = ?
                ORDER BY server_timestamp DESC
                LIMIT 60
            ) ordered_desc
            ORDER BY server_timestamp ASC;
        `;
        // Use better-sqlite3 parameterized queries (.all) to prevent SQL injection safely natively
        const results = db.prepare(query).all(droneId);
        
        if (!results || results.length === 0) {
            res.status(404).json({ error: 'Drone ID not found or has no generated history.' });
            return;
        }
        
        res.status(200).json(results);
    } catch (err) {
        console.error('Database history query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/analytics/city-trend', (req, res) => {
    try {
        const query = `
            SELECT 
                strftime('%H:%M', server_timestamp) as minute_label, 
                AVG(pm25) as avg_pm25, 
                AVG(co2) as avg_co2 
            FROM TelemetryLogs 
            WHERE server_timestamp >= datetime('now', '-30 minutes')
            GROUP BY strftime('%Y-%m-%d %H:%M', server_timestamp)
            ORDER BY server_timestamp ASC;
        `;
        const results = db.prepare(query).all();
        res.status(200).json(results);
    } catch (err) {
        console.error('Database city-trend query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/analytics/hotspots', (req, res) => {
    try {
        const query = `
            SELECT 
                ROUND(lat, 2) as lat_zone, 
                ROUND(lng, 2) as lng_zone, 
                AVG(pm25) as avg_pm25 
            FROM TelemetryLogs 
            WHERE server_timestamp >= datetime('now', '-5 minutes')
            GROUP BY ROUND(lat, 2), ROUND(lng, 2)
            ORDER BY avg_pm25 DESC 
            LIMIT 3;
        `;
        const results = db.prepare(query).all();
        res.status(200).json(results);
    } catch (err) {
        console.error('Database hotspots query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/alerts/active', (req, res) => {
    try {
        // Auto-close stale alerts that haven't received a drone pulse within 5 minutes
        db.prepare("UPDATE HazardAlerts SET status = 'Resolved' WHERE status = 'Active' AND updated_at < datetime('now', '-5 minutes')").run();
        
        // The frontend App.tsx AlertLayer expects a 'uuid' field for the react key, so we alias 'id'
        const query = "SELECT id as uuid, lat, lng, pm25 FROM HazardAlerts WHERE status = 'Active'";
        const results = db.prepare(query).all();
        res.status(200).json(results);
    } catch (err) {
        console.error('Database active alerts query error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Central Ingestion API listening on http://localhost:${PORT}`);
});
