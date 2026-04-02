import { getReadingsAt } from './EnvironmentMap';

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

    // Deterministic RSSI based on drone index (simulates fixed hardware antenna strength)
    private baseRssi: number;

    constructor(idIndex: number) {
        this.uuid = `DRONE-UNIT-${idIndex.toString().padStart(3, '0')}`;
        this.currentLat = this.getRandomInRange(this.minLat, this.maxLat);
        this.currentLng = this.getRandomInRange(this.minLng, this.maxLng);
        this.targetLat = this.currentLat;
        this.targetLng = this.currentLng;
        // Deterministic signal strength per drone hardware unit (-85 to -35 dBm)
        this.baseRssi = -85 + (idIndex * 2);
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
        let drainRate = 0.5;
        if (this.state === DroneState.GATHERING_DATA) drainRate = 0.2;
        else if (this.state === DroneState.IDLE) drainRate = 0.1;
        else if (this.state === DroneState.LOW_BATTERY) drainRate = 0.4;
        else if (this.state === DroneState.INVESTIGATING_HAZARD) drainRate = 0.6;

        this.batteryLevel -= drainRate;
        if (this.batteryLevel <= 0) {
            this.batteryLevel = 0;
            this.state = DroneState.OFFLINE;
            return;
        } else if (this.batteryLevel < 15) {
            this.state = DroneState.LOW_BATTERY;
        }

        // Move towards target
        if (this.state === DroneState.EN_ROUTE || this.state === DroneState.LOW_BATTERY || this.state === DroneState.INVESTIGATING_HAZARD) {
            const step = 0.005;
            const latDiff = this.targetLat - this.currentLat;
            const lngDiff = this.targetLng - this.currentLng;
            const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

            if (dist < step) {
                this.currentLat = this.targetLat;
                this.currentLng = this.targetLng;

                if (this.state !== DroneState.LOW_BATTERY) {
                    this.state = DroneState.GATHERING_DATA;
                    setTimeout(() => {
                        if (this.state !== DroneState.OFFLINE && this.state !== DroneState.LOW_BATTERY) {
                            this.setNewTarget();
                        }
                    }, 15000);
                } else {
                    this.setNewTarget();
                }
            } else {
                this.currentLat += (latDiff / dist) * step;
                this.currentLng += (lngDiff / dist) * step;
            }
        }
    }

    public getTelemetry(): TelemetryData {
        // ALL air quality data is now 100% deterministic from the EnvironmentMap module
        const reading = getReadingsAt(this.currentLat, this.currentLng);

        return {
            uuid: this.uuid,
            state: this.state,
            batteryLevel: parseFloat(this.batteryLevel.toFixed(2)),
            rssi: this.baseRssi,
            location: {
                lat: parseFloat(this.currentLat.toFixed(5)),
                lng: parseFloat(this.currentLng.toFixed(5))
            },
            airQuality: {
                pm25: reading.pm25,
                co2: reading.co2,
                no2: reading.no2,
                temperature: reading.temperature,
                humidity: reading.humidity,
            },
            timestamp: new Date().toISOString()
        };
    }
}
