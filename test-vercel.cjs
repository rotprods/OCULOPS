const { JSDOM, ResourceLoader } = require('jsdom');

(async () => {
    try {
        const resourceLoader = new ResourceLoader({
            strictSSL: false,
            userAgent: "Mozilla/5.0",
        });

        const dom = await JSDOM.fromURL("https://antigravity-os-theta.vercel.app", {
            runScripts: "dangerously",
            resources: "usable",
            pretendToBeVisual: true,
            virtualConsole: new (require('jsdom')).VirtualConsole().sendTo(console)
        });

        console.log("Waiting 3s for JS to execute...");
        setTimeout(() => {
            console.log("HTML length:", dom.window.document.body.innerHTML.length);
            console.log("Root element content:", dom.window.document.getElementById('root')?.innerHTML.substring(0, 100));
            process.exit(0);
        }, 3000);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
