import axios from 'axios';
import type { TelemetryPayload } from '@climence/shared';
import { DroneDevice } from './DroneDevice';

export class FleetManager {
  private drones: DroneDevice[] = [];
  private endpoint: string;

  constructor(droneCount: number, endpoint: string) {
    this.endpoint = endpoint;
    for (let i = 0; i < droneCount; i++) {
      this.drones.push(new DroneDevice(i));
    }
  }

  public startSimulation(intervalMs: number) {
    console.log(`Starting fleet simulation with ${this.drones.length} drones.`);
    setInterval(() => this.tick(), intervalMs);
  }

  private tick() {
    const payload: TelemetryPayload = {
      fleet: this.drones.map(drone => {
        drone.tick();
        return drone.getTelemetry();
      }),
    };

    axios
      .post(this.endpoint, payload)
      .then(() => {
        console.log(
          `[${new Date().toISOString()}] Broadcasted telemetry for ${this.drones.length} drones to ${this.endpoint}`,
        );
      })
      .catch(err => {
        console.error(`[${new Date().toISOString()}] Failed to broadcast telemetry. Error: ${err.message}`);
        console.log('Sample Payload:', JSON.stringify(payload.fleet[0], null, 2));
      });
  }
}
