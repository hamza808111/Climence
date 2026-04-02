import { v4 as uuidv4 } from 'uuid';

export enum DroneState {
    IDLE = 'IDLE',
    EN_ROUTE = 'EN_ROUTE',
    GATHERING_DATA = 'GATHERING_DATA',
    LOW_BATTERY = 'LOW_BATTERY',
    OFFLINE = 'OFFLINE',
    INVESTIGATING_HAZARD = 'INVESTIGATING_HAZARD'
}

export interface TelemetryData {
    uuid: string;
    state: DroneState;
    batteryLevel: number;
    rssi: number;
    location: { lat: number; lng: number };
    airQuality: {
        pm25: number;
        co2: number;
        no2: number;
        temperature: number;
        humidity: number;
    };
    timestamp: string;
}

// 1. Static Pollution Hotspots (Spatial Environment Model)
const EnvironmentMap = [
    { lat: 24.55, lng: 46.75, peakPm25: 180, peakCo2: 800 }, // Industrial Zone
    { lat: 24.68, lng: 46.68, peakPm25: 130, peakCo2: 600 }, // High Traffic Intersection
    { lat: 24.80, lng: 46.60, peakPm25: 110, peakCo2: 550 }  // North Development
];

// Helper to calculate Haversine distance in km
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

export class DroneDevice {
    public uuid: string;
    public state: DroneState = DroneState.IDLE;
    public batteryLevel: number = 100;
    
    // Riyadh bounds
    private minLat = 24.5;
    private maxLat = 24.9;
    private minLng = 46.5;
    private maxLng = 46.9;

    private currentLat: number;
    private currentLng: number;
    private targetLat: number;
    private targetLng: number;

    constructor(idIndex: number) {
        // Deterministic hardware ID to prevent ghost drone piling on system reboots
        this.uuid = `DRONE-UNIT-${idIndex.toString().padStart(3, '0')}`;
        // Initialize at random location within Riyadh
        this.currentLat = this.getRandomInRange(this.minLat, this.maxLat);
        this.currentLng = this.getRandomInRange(this.minLng, this.maxLng);
        this.targetLat = this.currentLat;
        this.targetLng = this.currentLng;
        this.setNewTarget();
    }

    private getRandomInRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    private setNewTarget() {
        this.targetLat = this.getRandomInRange(this.minLat, this.maxLat);
        this.targetLng = this.getRandomInRange(this.minLng, this.maxLng);
        if (this.state !== DroneState.LOW_BATTERY && this.state !== DroneState.OFFLINE) {
            this.state = DroneState.EN_ROUTE;
        }
    }

    public overrideWaypoint(targetLat: number, targetLng: number, newState: DroneState) {
        this.targetLat = targetLat;
        this.targetLng = targetLng;
        this.state = newState;
    }

    public tick() {
        if (this.state === DroneState.OFFLINE) return;

        // Drain battery
        let drainRate = 0.5; // default EN_ROUTE drain
        if (this.state === DroneState.GATHERING_DATA) {
            drainRate = 0.2;
        } else if (this.state === DroneState.IDLE) {
            drainRate = 0.1;
        } else if (this.state === DroneState.LOW_BATTERY) {
            drainRate = 0.4;
        }

        this.batteryLevel -= drainRate;
        if (this.batteryLevel <= 0) {
            this.batteryLevel = 0;
            this.state = DroneState.OFFLINE;
            return;
        } else if (this.batteryLevel < 15) {
            this.state = DroneState.LOW_BATTERY;
        }

        // Move towards target if EN_ROUTE, LOW_BATTERY, or INVESTIGATING_HAZARD
        if (this.state === DroneState.EN_ROUTE || this.state === DroneState.LOW_BATTERY || this.state === DroneState.INVESTIGATING_HAZARD) {
            const step = 0.005; // ~500m per tick
            const latDiff = this.targetLat - this.currentLat;
            const lngDiff = this.targetLng - this.currentLng;
            const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

            if (dist < step) {
                // Reached destination
                this.currentLat = this.targetLat;
                this.currentLng = this.targetLng;

                if (this.state !== DroneState.LOW_BATTERY) {
                    this.state = DroneState.GATHERING_DATA;
                    // Gather data for a few ticks, then set new target
                    setTimeout(() => {
                        if (this.state !== DroneState.OFFLINE && this.state !== DroneState.LOW_BATTERY) {
                            this.setNewTarget();
                        }
                    }, 15000); // 15s data gathering phase
                } else {
                    this.setNewTarget(); // keep moving randomly when low battery
                }
            } else {
                this.currentLat += (latDiff / dist) * step;
                this.currentLng += (lngDiff / dist) * step;
            }
        }
    }

    // Phase 4: Calculate IDW (Inverse Distance Weighting) for Spatial Data Calibration
    private calculateSpatialAQI() {
        let wSumPm25 = 0;
        let wSumCo2 = 0;
        let weightSum = 0;
        
        for (const spot of EnvironmentMap) {
            const dist = getDistance(this.currentLat, this.currentLng, spot.lat, spot.lng);
            const d = Math.max(dist, 0.5); // Add epsilon min distance so it doesn't divide by zero
            const weight = 1 / Math.pow(d, 2); // Weight rapidly decays by square distance
            
            wSumPm25 += spot.peakPm25 * weight;
            wSumCo2 += spot.peakCo2 * weight;
            weightSum += weight;
        }

        // Add a clean ambient base weight so far-edge zones don't strictly average the dirty hotspots
        const baseWeight = 1 / Math.pow(20, 2); 
        wSumPm25 += 10 * baseWeight; // 10 PM2.5 base clean air
        wSumCo2 += 400 * baseWeight; // 400 CO2 base clean air
        weightSum += baseWeight;

        return {
            pm25: wSumPm25 / weightSum,
            co2: wSumCo2 / weightSum
        };
    }

    public getTelemetry(): TelemetryData {
        const spatialData = this.calculateSpatialAQI();

        return {
            uuid: this.uuid,
            state: this.state,
            batteryLevel: parseFloat(this.batteryLevel.toFixed(2)),
            rssi: Math.floor(Math.random() * 61) - 90, // -90 to -30
            location: {
                lat: parseFloat(this.currentLat.toFixed(5)),
                lng: parseFloat(this.currentLng.toFixed(5))
            },
            airQuality: {
                pm25: parseFloat(spatialData.pm25.toFixed(2)),
                co2: parseFloat(spatialData.co2.toFixed(2)),
                no2: parseFloat((Math.random() * 20 + 5).toFixed(2)), // Non-weighted noise
                temperature: parseFloat((Math.random() * 15 + 20).toFixed(2)), // 20-35 C
                humidity: parseFloat((Math.random() * 40 + 20).toFixed(2)) // 20-60 %
            },
            timestamp: new Date().toISOString()
        };
    }
}
