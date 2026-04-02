import { FleetManager } from './FleetManager';

const API_ENDPOINT = 'http://localhost:3000/api/telemetry';
console.log(`Starting Drone Simulator... Targeting Central Ingestion API at ${API_ENDPOINT}`);

// Start the Fleet Manager
const fleet = new FleetManager(25, API_ENDPOINT);
fleet.startSimulation(5000); // 5 seconds interval
