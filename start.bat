@echo off
echo Starting Climence System...

echo Starting Central Ingestion API...
start "Climence API Server" cmd /c "cd api && npx tsx src/index.ts"

echo Starting Drone Simulator...
start "Climence Drone Simulator (25 Units)" cmd /c "npx tsx src/index.ts"

echo Starting React Dashboard...
start "Climence React Dashboard" cmd /k "cd dashboard && npm run dev"

echo All systems have been launched in separate terminal windows!
echo Once the Vite server is ready, navigate to http://localhost:5173
