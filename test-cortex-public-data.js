async function main() {
    console.log("Reaching out to CORTEX to test the Public Catalog Router...");
    const url = 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-cortex';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emRhZnB0cXRjdnBzYnFrbWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjUwNjIsImV4cCI6MjA4ODM0MTA2Mn0.-Kg8u3DVUq5T8JiJNJMPknzPgDBJVJusRatk_WkTxyU';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            action: 'query_public_data',
            query: 'Get current price of bitcoin using coingecko API'
        })
    });

    const data = await res.json();
    console.log("\n=== CORTEX RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
