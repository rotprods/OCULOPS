const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE EXCEPTION:', err.toString());
  });

  try {
    console.log('Navigating to Vercel...');
    await page.goto('https://antigravity-os-theta.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 10000 });

    console.log('Waiting 3s for React to attempt rendering...');
    await new Promise(r => setTimeout(r, 3000));

    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NO ROOT ELEMENT');
    console.log('Root Element HTML length:', rootHtml.length);
    console.log('Root Element snippet:', rootHtml.substring(0, 100));

  } catch (e) {
    console.error('PUPPETEER ERROR:', e);
  } finally {
    await browser.close();
  }
})();
