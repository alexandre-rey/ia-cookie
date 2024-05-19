import puppeteer, { Browser, Page } from 'puppeteer';
import { GameState } from './types/game.state';
import { CookieObject } from './types/game.type';


export class GameController {

    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    public async clickOnCookie(): Promise<void> {
        if (this.page && !this.page.isClosed()) {
            await this.page.click('#bigCookie');
        } else {
            console.log('Error: no page available');
        }
    }

    public async buyObject(upgradeId: number): Promise<void> {
        if (this.page && !this.page.isClosed()) {
            try {
                await this.page.click(`#product${upgradeId}`);
            } catch (error) {
                //console.log('Tried to buy an object that is not available');
            }

        } else {
            console.log('Error: no page available');
        }
    }

    public async getGameState(): Promise<GameState> {

        if (this.page.isClosed()) {
            console.log('Error: page is closed');
            return {
                currentCookies: 0,
                cookiesPerSecond: 0,
                availableObjects: []
            };
        }

        const gameState = await this.page.evaluate(() => {
            // @ts-ignore
            console.log(Game);

            // @ts-ignore
            const currentCookies = Game.cookies;
            // @ts-ignore
            const cookiesPerSecond = Game.cookiesPs;


            const availableObjects: CookieObject[] = [];

            // @ts-ignore
            for (let key in Game.Objects) {
                // @ts-ignore
                const object = Game.Objects[key];
                availableObjects.push({
                    id: object.id,
                    name: object.displayName,
                    price: object.bulkPrice,
                    isLocked: object.locked
                });
            }

            return {
                currentCookies,
                cookiesPerSecond,
                availableObjects: availableObjects
            };
        });

        return gameState;

    }
}