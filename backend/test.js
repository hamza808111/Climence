setTimeout(async () => {
    try {
        const latestRes = await fetch('http://localhost:3000/api/telemetry/latest');
        const latest = await latestRes.json();
        const uuid = latest[0].uuid;
        
        console.log(`\n--- Testing Valid UUID: ${uuid} ---`);
        const historyRes = await fetch(`http://localhost:3000/api/telemetry/history/${uuid}`);
        const history = await historyRes.json();
        console.log(`Successfully fetched array of length: ${history.length}`);
        
        if (history.length > 0) {
            console.log(`First record (Oldest): ${history[0].server_timestamp}`);
            console.log(`Last record (Newest):  ${history[history.length - 1].server_timestamp}`);
            console.log(`Ascending verification passed: ${new Date(history[0].server_timestamp) <= new Date(history[history.length - 1].server_timestamp)}`);
        }
        
        console.log(`\n--- Testing Invalid UUID: fake-id-123 ---`);
        const fakeRes = await fetch(`http://localhost:3000/api/telemetry/history/fake-id-123`);
        console.log(`HTTP Status code: ${fakeRes.status}`);
        console.log(`Response Payload:`, await fakeRes.json());
        
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}, 7000); // Wait 7 seconds for the simulator to push a couple of ticks into SQLite
