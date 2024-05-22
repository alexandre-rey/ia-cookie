import * as tf from '@tensorflow/tfjs-node';
import { SAVE_PATH } from '.';
import { GameController } from './GameController';
import { predictAction, trainModel } from './model';
import { BrowserManager } from './BrowserManager';
import { existsSync, mkdirSync } from 'fs';

export async function playGame(gameController: GameController): Promise<void> {
    const model = await tf.loadLayersModel('file://' + SAVE_PATH + '/model.json');

    let state = await gameController.getGameState();

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 200));

        const actionIndex = await predictAction(model, state);

        await gameController.buyObject(actionIndex);
        await gameController.clickOnCookie();

        state = await gameController.getGameState();
        process.stdout.write(`\rCookies: ${state.currentCookies.toFixed(2)}, CPS: ${state.cookiesPerSecond.toFixed(2)} Action: ${actionIndex}`);

    }
}

export async function trainGameModel(id: number, browserManager: BrowserManager, episodeMax: number, stepMax: number, model: tf.Sequential, gamma: number, epsilon: number): Promise<tf.Sequential> {

    const page = await browserManager.getGame();
    console.log('Game launched successfully');

    if (page) {
        const gameController = new GameController(page);

        for (let episode = 0; episode < episodeMax; episode++) {

            let state = await gameController.getGameState();

            for (let step = 0; step < stepMax; step++) {

                const actionIndex = Math.random() < epsilon ?
                    Math.floor(Math.random() * (state.availableObjects.length)) :
                    await predictAction(model, state);


                await gameController.buyObject(actionIndex);
                await gameController.clickOnCookie();


                const nextState = await gameController.getGameState();
                let reward = nextState.cookiesPerSecond - state.cookiesPerSecond;

                // Malus for trying to buy a locked object
                if (actionIndex > 0) {
                    if (state.availableObjects[actionIndex - 1].isLocked) {
                        reward = -2;
                    }
                }

                process.stdout.write(`\rID: ${id}, Episode: ${episode}, Step: ${step}, Reward: ${reward}, Cookies: ${state.currentCookies.toFixed(2)}, CPS: ${state.cookiesPerSecond.toFixed(2)} Action: ${actionIndex}`);


                await trainModel(model, state, actionIndex, reward, nextState, false, gamma);
                state = nextState;
            }

            if (!existsSync(SAVE_PATH)) {
                mkdirSync(SAVE_PATH);
            }

            await model.save(`file://${SAVE_PATH}`);
        }
    }

    return model;


}