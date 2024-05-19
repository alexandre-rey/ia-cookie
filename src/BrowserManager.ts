import puppeteer, { Browser, BrowserContext, Page } from 'puppeteer';


export class BrowserManager {

    private browser: Browser | null = null;
    private contexts: BrowserContext[] = [];

    constructor() {
    }

    public async initBrowser(): Promise<boolean> {

        try {
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized'],
            });
            return true;
        } catch (error) {
            console.log('Error while launching the browser', error);
            return false;
        }
    }

    public async getGame(): Promise<Page | null> {

        if (!this.browser) {
            console.log('Error: no browser available');
            return null;
        }

        try {
            const context = await this.browser.createBrowserContext();
            this.contexts.push(context);
            const page = await context.newPage();

            await page.goto('https://orteil.dashnet.org/cookieclicker/');

            await page.waitForSelector('#langSelect-FR');
            await page.click('#langSelect-FR');

            await page.waitForSelector('#bigCookie');
            await page.click('#bigCookie');

            await page.waitForSelector('#product0');

            return page;
        } catch (error) {
            console.log('Error while launching the game', error);

            if (this.browser) {
                await this.browser.close();
            }

            return null;
        }
    }

    public async closeBrowser(): Promise<void> {

        this.contexts.forEach(async (context) => {
            await context.close();
        });
        this.contexts = [];

        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}