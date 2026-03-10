import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', req => console.log('PAGE REQ FAILED:', req.url()));

        console.log('Navigating to http://localhost:4175 ...');
        await page.goto('http://localhost:4175', { waitUntil: 'domcontentloaded', timeout: 10000 });

        console.log('Waiting 5 seconds for React to mount...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('Title:', await page.title());

        const html = await page.content();
        console.log('HTML length:', html.length);
        console.log('Inside #root:', await page.$eval('#root', el => el.innerHTML));

        await browser.close();
    } catch (e) {
        console.error('SCRIPT CATCH ERROR:', e);
        process.exit(1);
    }
})();
