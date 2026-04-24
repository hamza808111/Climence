import { DroneState, ENVIRONMENT_MAP, RIYADH_BOUNDS, type TelemetryInput } from '@climence/shared';
import { haversineKm } from './domain/geo';

export class DroneDevice {
  public uuid: string;
  public state: DroneState = DroneState.IDLE;
  public batteryLevel: number = 100;

  private currentLat: number;
  private currentLng: number;
  private targetLat: number;
  private targetLng: number;

  constructor(idIndex: number) {
    // Deterministic hardware ID prevents ghost drones piling up on reboots
    this.uuid = `DRONE-UNIT-${idIndex.toString().padStart(3, '0')}`;
    this.currentLat = this.getRandomInRange(RIYADH_BOUNDS.minLat, RIYADH_BOUNDS.maxLat);
    this.currentLng = this.getRandomInRange(RIYADH_BOUNDS.minLng, RIYADH_BOUNDS.maxLng);
    this.targetLat = this.currentLat;
    this.targetLng = this.currentLng;
    this.setNewTarget();
  }

  private getRandomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private setNewTarget() {
    this.targetLat = this.getRandomInRange(RIYADH_BOUNDS.minLat, RIYADH_BOUNDS.maxLat);
    this.targetLng = this.getRandomInRange(RIYADH_BOUNDS.minLng, RIYADH_BOUNDS.maxLng);
    if (this.state !== DroneState.LOW_BATTERY && this.state !== DroneState.OFFLINE) {
      this.state = DroneState.EN_ROUTE;
    }
  }

  public tick() {
    if (this.state === DroneState.OFFLINE) return;

    let drainRate = 0.5;
    if (this.state === DroneState.GATHERING_DATA) drainRate = 0.2;
    else if (this.state === DroneState.IDLE) drainRate = 0.1;
    else if (this.state === DroneState.LOW_BATTERY) drainRate = 0.4;

    this.batteryLevel -= drainRate;
    if (this.batteryLevel <= 0) {
      this.batteryLevel = 0;
      this.state = DroneState.OFFLINE;
      return;
    } else if (this.batteryLevel < 15) {
      this.state = DroneState.LOW_BATTERY;
    }

    if (this.state === DroneState.EN_ROUTE || this.state === DroneState.LOW_BATTERY) {
      const step = 0.005; // ~500m per tick
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

  // Inverse Distance Weighting for spatial AQI calibration
  private calculateSpatialAQI() {
    let wSumPm25 = 0;
    let wSumCo2 = 0;
    let weightSum = 0;

    for (const spot of ENVIRONMENT_MAP) {
      const dist = haversineKm(this.currentLat, this.currentLng, spot.lat, spot.lng);
      const d = Math.max(dist, 0.5); // epsilon prevents divide-by-zero at the hotspot center
      const weight = 1 / Math.pow(d, 2);

      wSumPm25 += spot.peakPm25 * weight;
      wSumCo2 += spot.peakCo2 * weight;
      weightSum += weight;
    }

    // Clean ambient base so far-edge zones don't just average the dirty hotspots
    const baseWeight = 1 / Math.pow(20, 2);
    wSumPm25 += 10 * baseWeight;
    wSumCo2 += 400 * baseWeight;
    weightSum += baseWeight;

    return {
      pm25: wSumPm25 / weightSum,
      co2: wSumCo2 / weightSum,
    };
  }

  public getTelemetry(): TelemetryInput {
    const spatialData = this.calculateSpatialAQI();

    return {
      uuid: this.uuid,
      state: this.state,
      batteryLevel: parseFloat(this.batteryLevel.toFixed(2)),
      rssi: Math.floor(Math.random() * 61) - 90, // -90 to -30
      location: {
        lat: parseFloat(this.currentLat.toFixed(5)),
        lng: parseFloat(this.currentLng.toFixed(5)),
      },
      airQuality: {
        pm25: parseFloat(spatialData.pm25.toFixed(2)),
        co2: parseFloat(spatialData.co2.toFixed(2)),
        no2: parseFloat((Math.random() * 20 + 5).toFixed(2)),
        temperature: parseFloat((Math.random() * 15 + 20).toFixed(2)),
        humidity: parseFloat((Math.random() * 40 + 20).toFixed(2)),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
