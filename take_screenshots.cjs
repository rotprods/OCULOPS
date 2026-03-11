const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'dashboard_screenshots');

(async () => {
    fs.mkdirSync(outDir, { recursive: true });

    // Launch headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set 100-Year UX viewing dimensions
    await page.setViewport({ width: 1440, height: 900 });

    const routes = [
        { path: '/', name: '01_control_tower_hub' },
        { path: '/prospector', name: '02_prospector_recon' },
        { path: '/pipeline', name: '03_pipeline_matrix' },
        { path: '/creative-studio', name: '04_creative_studio_lab' },
        { path: '/agents', name: '05_agent_network' },
        { path: '/intelligence', name: '06_intelligence_radar' }
    ];

    console.log('Capturing OCULOPS Screenshots...');

    for (const route of routes) {
        try {
            await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
            // Small delay to ensure any initial glassmorphism/glow animations settle
            await new Promise(r => setTimeout(r, 2000));
            const dest = path.join(outDir, `${route.name}.png`);
            await page.screenshot({ path: dest });
            console.log(`[x] Captured: ${route.name}`);
        } catch (err) {
            console.log(`[!] Failed to capture ${route.name}: ${err.message}`);
        }
    }

    await browser.close();
    console.log('All screenshots saved to /dashboard_screenshots/');
})();
