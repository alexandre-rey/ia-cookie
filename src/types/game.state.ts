import { CookieObject } from './game.type';


export interface GameState {

    currentCookies: number;

    cookiesPerSecond: number;

    availableObjects: CookieObject[];

}
    