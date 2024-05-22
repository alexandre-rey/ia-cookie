import * as tf from '@tensorflow/tfjs-node';
import { existsSync, mkdirSync } from 'fs';
import { BrowserManager } from './BrowserManager';
import { GameController } from './GameController';
import { createModel, trainModel } from './model';
import { playGame, trainGameModel } from './Game';

// TensorFlow is imported here even if not used in this file to init the C backend

export const SAVE_PATH = './models/dqn';

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
        await playGame(new GameController(page));
    }


    const model = createModel(22, 20);
    const gamma = 0.6;
    const epsilon = 0.5;
    const episodeMax = 50;
    const stepMax = 100;

    const trainings = Promise.all([
        trainGameModel(1, browserManager, episodeMax, stepMax, model, gamma, epsilon),
        trainGameModel(2, browserManager, episodeMax, stepMax, model, gamma, epsilon),
        //trainGameModel(3, browserManager, episodeMax, stepMax, model, gamma, epsilon),
        //trainGameModel(4, browserManager, episodeMax, stepMax, model, gamma, epsilon),
    ]);

    await trainings;

    console.log('Training completed');

    if (browserManager) {
        await browserManager.closeBrowser();
    }


})();