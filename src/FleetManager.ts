import axios from 'axios';
import { DroneDevice, DroneState } from './DroneDevice';

function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

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
        
        // Phase 10: Swarm Convergence Polling Loop
        setInterval(() => this.pollAndConverge(), 10000);
    }

    private pollAndConverge() {
        axios.get('http://localhost:3000/api/alerts/active').then(res => {
            const alerts = res.data;
            if (!alerts || alerts.length === 0) return;
            
            for (const alert of alerts) {
                // Ensure we don't accidentally deploy the entire fleet over multiple 10s async cycles!
                const currentlyInvestigating = this.drones.filter(d => d.state === DroneState.INVESTIGATING_HAZARD);
                if (currentlyInvestigating.length >= 3) break;

                const availableDrones = this.drones.filter(d => d.state === DroneState.IDLE || d.state === DroneState.EN_ROUTE);
                
                // Sort by absolute geometric distance to find the closest units dynamically
                availableDrones.sort((a, b) => {
                    const locA = a.getTelemetry().location;
                    const locB = b.getTelemetry().location;
                    return getDistanceKM(locA.lat, locA.lng, alert.lat, alert.lng) - getDistanceKM(locB.lat, locB.lng, alert.lat, alert.lng);
                });
                
                // Intercept exactly enough drones to strictly fulfill the 3-drone cap limit
                const needed = 3 - currentlyInvestigating.length;
                const dispatchSquad = availableDrones.slice(0, needed);
                for (const d of dispatchSquad) {
                    d.overrideWaypoint(alert.lat, alert.lng, DroneState.INVESTIGATING_HAZARD);
                }
            }
        }).catch(err => { /* fail silently if API drops momentarily */ });
    }

    private tick() {
        const payload = [];
        for (const drone of this.drones) {
            drone.tick();
            payload.push(drone.getTelemetry());
        }

        // Broadcast to endpoint
        axios.post(this.endpoint, { fleet: payload })
            .then(res => {
                console.log(`[${new Date().toISOString()}] Successfully broadcasted telemetry for ${this.drones.length} drones to ${this.endpoint}`);
            })
            .catch(err => {
                console.error(`[${new Date().toISOString()}] Failed to broadcast telemetry. Error: ${err.message}`);
                console.log("Sample Payload:", JSON.stringify(payload[0], null, 2));
            });
    }
}
