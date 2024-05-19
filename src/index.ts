import * as tf from '@tensorflow/tfjs-node';
import { existsSync, mkdirSync } from 'fs';
import { BrowserManager } from './BrowserManager';
import { GameController } from './GameController';
import { createModel, trainModel } from './model';

const SAVE_PATH = './models/dqn';

(async () => {

    const browserManager = new BrowserManager();
    const isBrowserLaunched = await browserManager.initBrowser();

    if (isBrowserLaunched) {
        console.log('Browser launched successfully');
    } else {
        console.log('Error while launching the browser');
        return;
    }

    const page = await browserManager.getGame();

    if (page) {
        const gameController = new GameController(page);

        console.log('Game launched successfully');

        const model = createModel(22, 21);
        const gamma = 0.2;
        const epsilon = 0.8;

        for (let episode = 0; episode < 1000; episode++) {

            let state = await gameController.getGameState();

            for (let step = 0; step < 100; step++) {

                const actionIndex = Math.random() < epsilon ?
                    Math.floor(Math.random() * (state.availableObjects.length + 1)) :
                    1 + state.availableObjects.reduce((iMax, x, i, arr) => x.price > arr[iMax].price ? i : iMax, 0);

                    
                    process.stdout.write(`\rEpisode: ${episode}, Step: ${step}, Cookies: ${state.currentCookies.toFixed(2)}, CPS: ${state.cookiesPerSecond.toFixed(2)} Action: ${actionIndex}`);

                    if(actionIndex === 0){
                        await gameController.clickOnCookie();
                    } else {
                        await gameController.buyObject(actionIndex - 1);
                    }

                    const nextState = await gameController.getGameState();
                    let reward = nextState.cookiesPerSecond - state.cookiesPerSecond;

                    if(nextState.currentCookies > state.currentCookies && nextState.cookiesPerSecond === state.cookiesPerSecond){
                        reward = 1;
                    }


                    if(actionIndex > 0){
                        if(state.availableObjects[actionIndex - 1].isLocked){
                            reward = -10;
                        }
                    }

                    await trainModel(model, state, actionIndex, reward, nextState, false, gamma);
                    state = nextState;
            }
        }

        console.log('Training completed');
        
        if(!existsSync(SAVE_PATH)){
            mkdirSync(SAVE_PATH);
        }

        await model.save(`file://${SAVE_PATH}`);


        if(browserManager){
            await browserManager.closeBrowser();
        }
        
    }


})();