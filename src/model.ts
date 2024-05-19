import * as tf from '@tensorflow/tfjs-node';
import { GameState } from './types/game.state';
import { CookieObject } from './types/game.type';

function createModel(inputShape: number, outputShape: number): tf.Sequential {

    const model = tf.sequential();
    model.add(tf.layers.dense({
        inputShape: [inputShape],
        units: 24,
        activation: 'relu'
    }));

    model.add(tf.layers.dense({
        units: 24,
        activation: 'relu'
    }));

    model.add(tf.layers.dense({
        units: outputShape,
        activation: 'linear'
    }));

    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
    });

    return model;
}


async function trainModel(model: tf.LayersModel, state: GameState, action: number, reward: number, nextState: GameState, done: boolean, gamma: number): Promise<void> {
    
    const stateArray = [state.currentCookies, state.cookiesPerSecond];
    stateArray.push(...state.availableObjects.map((o:CookieObject) => o.price));

    const nextStateArray = [nextState.currentCookies, nextState.cookiesPerSecond];
    nextStateArray.push(...nextState.availableObjects.map((o:CookieObject) => o.price));

    // Convert GameState objects to input tensors
    const stateTensor = tf.tensor2d(stateArray, [1, stateArray.length]);
    const nextStateTensor = tf.tensor2d(nextStateArray, [1, nextStateArray.length]);

    // Predict the future rewards with the nextStateTensor
    const predictions = model.predict(nextStateTensor) as tf.Tensor;
    const maxQ = tf.max(predictions).dataSync()[0];

    // Calculate the target reward
    const targetReward = reward + (done ? 0 : gamma * maxQ);
    
    // Get the current Q-values predictions for the current state to update only the action taken
    const currentState = model.predict(stateTensor) as tf.Tensor;
    const targetF = currentState.dataSync() as unknown as number[];
    targetF[action] = targetReward;

    // Fit the model with the updated Q-values
    await model.fit(stateTensor, tf.tensor2d([targetF]), { epochs: 1, verbose: 0 });
}

export { createModel, trainModel };
