const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Use local dev server with auth bypass
const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, 'current-ivory');

const ROUTES = [
  { path: '/control-tower',  name: '01_control_tower' },
  { path: '/crm',            name: '02_crm' },
  { path: '/pipeline',       name: '03_pipeline' },
  { path: '/execution',      name: '04_execution' },
  { path: '/intelligence',   name: '05_intelligence' },
  { path: '/markets',        name: '06_markets' },
  { path: '/analytics',      name: '07_analytics' },
  { path: '/opportunities',  name: '08_opportunities' },
  { path: '/agents',         name: '09_agents' },
  { path: '/herald',         name: '10_herald' },
  { path: '/prospector',     name: '11_prospector' },
  { path: '/automation',     name: '12_automation' },
  { path: '/flight-deck',    name: '13_flight_deck' },
  { path: '/messaging',      name: '14_messaging' },
  { path: '/gtm',            name: '15_gtm' },
  { path: '/creative',       name: '16_creative' },
  { path: '/niches',         name: '17_niches' },
  { path: '/finance',        name: '18_finance' },
  { path: '/knowledge',      name: '19_knowledge' },
  { path: '/decisions',      name: '20_decisions' },
  { path: '/experiments',    name: '21_experiments' },
  { path: '/simulation',     name: '22_simulation' },
  { path: '/studies',        name: '23_studies' },
  { path: '/command-center', name: '24_command_center' },
  { path: '/watchtower',     name: '25_watchtower' },
  { path: '/world-monitor',  name: '26_world_monitor' },
  { path: '/portfolio',      name: '27_portfolio' },
  { path: '/lab',            name: '28_lab' },
  { path: '/reports',        name: '29_reports' },
  { path: '/billing',        name: '30_billing' },
  { path: '/team-settings',  name: '31_team_settings' },
  { path: '/settings',       name: '32_settings' },
  { path: '/pixel-office',   name: '33_pixel_office' },
  { path: '/marketplace',    name: '34_marketplace' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Set dev bypass auth flag BEFORE loading the app
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.evaluate(() => {
    localStorage.setItem('_dev_bypass_auth', '1');
    localStorage.setItem('oculops_onboarding_done', '1');
  });

  let captured = 0;
  let failed = [];

  for (const route of ROUTES) {
    const url = `${BASE}${route.path}`;
    const file = path.join(OUT, `${route.name}.png`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: file, fullPage: true });
      captured++;
      console.log(`OK  ${route.name} → ${route.path}`);
    } catch (err) {
      failed.push(route.name);
      console.log(`ERR ${route.name} → ${err.message.slice(0, 80)}`);
      try {
        await page.screenshot({ path: file, fullPage: true });
        console.log(`    (partial screenshot saved)`);
      } catch {}
    }
  }

  await browser.close();

  console.log(`\nDone: ${captured}/${ROUTES.length} captured`);
  if (failed.length) console.log(`Failed: ${failed.join(', ')}`);
})();
