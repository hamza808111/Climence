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
    
    // Recovery thresholds
    maxPm25: number;
    maxCo2: number;
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
export const HOTSPOTS: PollutionHotspot[] = [
    { lat: 24.55, lng: 46.75, peakPm25: 180, maxPm25: 180, peakCo2: 800, maxCo2: 800, peakNo2: 45, peakTemp: 38, peakHumidity: 25, radiusKm: 3.0 },
    { lat: 24.68, lng: 46.68, peakPm25: 130, maxPm25: 130, peakCo2: 600, maxCo2: 600, peakNo2: 35, peakTemp: 36, peakHumidity: 30, radiusKm: 2.5 },
    { lat: 24.80, lng: 46.60, peakPm25: 110, maxPm25: 110, peakCo2: 550, maxCo2: 550, peakNo2: 28, peakTemp: 34, peakHumidity: 35, radiusKm: 2.0 },
    { lat: 24.63, lng: 46.55, peakPm25: 95,  maxPm25: 95,  peakCo2: 500, maxCo2: 500, peakNo2: 22, peakTemp: 33, peakHumidity: 40, radiusKm: 1.8 },
    { lat: 24.75, lng: 46.80, peakPm25: 140, maxPm25: 140, peakCo2: 650, maxCo2: 650, peakNo2: 38, peakTemp: 37, peakHumidity: 28, radiusKm: 2.2 },
];

// Baseline "clean air" values
const BASELINE = {
    pm25: 8,
    co2: 400,
    no2: 5,
    temperature: 28,
    humidity: 22,
};

// Continuous global pollution generation (builds up the factories slowly back to MAX over time if not naturally cleaned by drones)
setInterval(() => {
    for (const spot of HOTSPOTS) {
        if (spot.peakPm25 < spot.maxPm25) spot.peakPm25 = Math.min(spot.maxPm25, spot.peakPm25 + 0.5);
        if (spot.peakCo2 < spot.maxCo2) spot.peakCo2 = Math.min(spot.maxCo2, spot.peakCo2 + 2.0);
    }
}, 5000);

export function neutralisePollution(lat: number, lng: number) {
    for (const spot of HOTSPOTS) {
        const dist = haversineKm(lat, lng, spot.lat, spot.lng);
        // If a drone is hovering inside the physical boundary, it drops chemical air-scrubbers organically cleaning the environment mapped directly!
        if (dist <= 1.0) {
            spot.peakPm25 = Math.max(BASELINE.pm25, spot.peakPm25 - 4.0);
            spot.peakCo2 = Math.max(BASELINE.co2, spot.peakCo2 - 10.0);
        }
    }
}

export function getReadingsAt(lat: number, lng: number): EnvironmentReading {
    let wSumPm25 = 0; let wSumCo2 = 0; let wSumNo2 = 0; let wSumTemp = 0; let wSumHum = 0;
    let weightSum = 0;

    // 1. Inverse Distance Weighting against all hotspots
    for (const spot of HOTSPOTS) {
        const dist = haversineKm(lat, lng, spot.lat, spot.lng);
        const d = Math.max(dist, 0.5); 
        const weight = 1 / Math.pow(d, 2); 
        
        wSumPm25 += spot.peakPm25 * weight;
        wSumCo2 += spot.peakCo2 * weight;
        wSumNo2 += spot.peakNo2 * weight;
        wSumTemp += spot.peakTemp * weight;
        wSumHum += spot.peakHumidity * weight;
        weightSum += weight;
    }

    // 2. Add Baseline ambient weight
    const baseWeight = 1 / Math.pow(15, 2); 
    wSumPm25 += BASELINE.pm25 * baseWeight;
    wSumCo2 += BASELINE.co2 * baseWeight;
    wSumNo2 += BASELINE.no2 * baseWeight;
    wSumTemp += BASELINE.temperature * baseWeight;
    wSumHum += BASELINE.humidity * baseWeight;
    weightSum += baseWeight;

    // 3. Final mathematical weighted average
    const pm25 = wSumPm25 / weightSum;
    const co2 = wSumCo2 / weightSum;
    const no2 = wSumNo2 / weightSum;
    const temperature = wSumTemp / weightSum;
    const humidity = wSumHum / weightSum;

    return {
        pm25: parseFloat(pm25.toFixed(2)),
        co2: parseFloat(co2.toFixed(2)),
        no2: parseFloat(no2.toFixed(2)),
        temperature: parseFloat(temperature.toFixed(2)),
        humidity: parseFloat(humidity.toFixed(2)),
    };
}

export interface EnvironmentReading {
    pm25: number;
    co2: number;
    no2: number;
    temperature: number;
    humidity: number;
}
