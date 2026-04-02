// EnvironmentMap.ts — Standalone Spatial Environment Field Module
// All pollution data is deterministic: drones simply "read" the field at their coordinates.

interface PollutionHotspot {
    lat: number;
    lng: number;
    peakPm25: number;
    peakCo2: number;
    peakNo2: number;
    peakTemp: number;
    peakHumidity: number;
    radiusKm: number;
}

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 5 static hotspots spread across the Riyadh bounding box
const HOTSPOTS: PollutionHotspot[] = [
    { lat: 24.55, lng: 46.75, peakPm25: 180, peakCo2: 800, peakNo2: 45, peakTemp: 38, peakHumidity: 25, radiusKm: 3.0 },  // Industrial Zone South
    { lat: 24.68, lng: 46.68, peakPm25: 130, peakCo2: 600, peakNo2: 35, peakTemp: 36, peakHumidity: 30, radiusKm: 2.5 },  // Highway Interchange
    { lat: 24.80, lng: 46.60, peakPm25: 110, peakCo2: 550, peakNo2: 28, peakTemp: 34, peakHumidity: 35, radiusKm: 2.0 },  // North Construction
    { lat: 24.63, lng: 46.55, peakPm25: 95,  peakCo2: 500, peakNo2: 22, peakTemp: 33, peakHumidity: 40, radiusKm: 1.8 },  // West Commercial District
    { lat: 24.75, lng: 46.80, peakPm25: 140, peakCo2: 650, peakNo2: 38, peakTemp: 37, peakHumidity: 28, radiusKm: 2.2 },  // East Refinery Corridor
];

// Baseline "clean air" values (used when a drone is outside all hotspot radii)
const BASELINE = {
    pm25: 8,
    co2: 400,
    no2: 5,
    temperature: 28,
    humidity: 22,
};

export interface EnvironmentReading {
    pm25: number;
    co2: number;
    no2: number;
    temperature: number;
    humidity: number;
}

/**
 * Returns deterministic environmental readings at a given GPS coordinate.
 * Uses distance-decay: peak at center, smooth decay to baseline at radius edge.
 * Overlapping hotspots are additive above baseline.
 */
export function getReadingsAt(lat: number, lng: number): EnvironmentReading {
    let pm25 = BASELINE.pm25;
    let co2 = BASELINE.co2;
    let no2 = BASELINE.no2;
    let temperature = BASELINE.temperature;
    let humidity = BASELINE.humidity;

    for (const spot of HOTSPOTS) {
        const dist = haversineKm(lat, lng, spot.lat, spot.lng);

        if (dist >= spot.radiusKm) continue; // Outside this hotspot's influence

        // Linear decay: 1.0 at center → 0.0 at radius edge
        const strength = 1.0 - (dist / spot.radiusKm);

        pm25 += (spot.peakPm25 - BASELINE.pm25) * strength;
        co2 += (spot.peakCo2 - BASELINE.co2) * strength;
        no2 += (spot.peakNo2 - BASELINE.no2) * strength;
        temperature += (spot.peakTemp - BASELINE.temperature) * strength;
        humidity += (spot.peakHumidity - BASELINE.humidity) * strength;
    }

    return {
        pm25: parseFloat(pm25.toFixed(2)),
        co2: parseFloat(co2.toFixed(2)),
        no2: parseFloat(no2.toFixed(2)),
        temperature: parseFloat(temperature.toFixed(2)),
        humidity: parseFloat(humidity.toFixed(2)),
    };
}
