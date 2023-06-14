import {Map} from 'immutable';

/**
 * Update the sprite's position, direction and costume based on the information
 * stored in the logged sprite.
 *
 * @param {RenderedTarget} sprite - Sprite that needs to be updated.
 * @param {ScratchSprite} spriteLog - Logged sprite containing the new values.
 */
export const updateSpriteState = function (sprite, spriteLog) {
    sprite.setXY(spriteLog.x, spriteLog.y);
    sprite.setDirection(spriteLog.direction);
    sprite.setDraggable(spriteLog.draggable);
    sprite.setVisible(spriteLog.visible);
    sprite.setSize(spriteLog.size);
    sprite.setCostume(sprite.getCostumeIndexByName(spriteLog.costume));
    sprite.setRotationStyle(spriteLog.rotationStyle);

    for (const [effectName, value] of Object.entries(spriteLog.effects)) {
        sprite.setEffect(effectName, value);
    }
};

/**
 * Update the stage's state: the background (=costume),
 * stored in the logged stage.
 *
 * @param {RenderedTarget} stage - Stage object
 * @param {ScratchStage} spriteLog - Logged stage
 */
export const updateStageState = function (stage, stageLog) {
    // Get the costume by name so indices don't break it
    stage.setCostume(stage.getCostumeIndexByName(stageLog.costumes[stageLog.currentCostume].name));
};

/**
 * Restore the sprite's variables to the values stored in the log.
 *
 * @param {RenderedTarget} target - Sprite that needs to be updated.
 * @param {ScratchVariable[]} loggedVariables - Variables stored in the log.
 */
export const updateTargetVariables = function (target, loggedVariables) {
    for (const variableLog of loggedVariables) {
        const variable = target.lookupOrCreateVariable(variableLog.id, variableLog.name);
        variable.value = variableLog.value;
        // Update monitor if it exists
        target.runtime.requestUpdateMonitor(new Map([
            ['id', variableLog.id],
            ['value', variableLog.value]
        ]));
    }
};

/**
 * Restore the sprite's bubble to the state in the log.
 *
 * @param {RenderedTarget} sprite - Sprite that needs to be updated.
 * @param {BubbleState?} bubbleState - Bubble state stored in the log.
 */
export const updateSpriteBubble = function (sprite, bubbleState) {
    if (bubbleState) {
        sprite.runtime.emit('SAY', sprite, bubbleState.type, bubbleState.text);
    } else {
        sprite.runtime.emit('SAY', sprite, 'say', '');
    }
};

/**
 * Restore a monitor of a target to a logged value. The value is extracted from the logged target
 *
 * @param {Runtime} runtime - Runtime of which the monitor should change
 * @param {RenderedTarget} loggedTarget - Target to which the monitor corresponds
 * @param {string} monitorId - The monitor id
 */
export const updateTargetMonitor = function (runtime, loggedTarget, monitorId) {
    let value;
    switch (monitorId.substring(21)) {
    case 'xposition':
        value = loggedTarget.x;
        break;
    case 'yposition':
        value = loggedTarget.y;
        break;
    case 'direction':
        value = loggedTarget.direction;
        break;
    case 'costumenumbername_number':
        value = loggedTarget.currentCostume + 1;
        break;
    case 'size':
        value = loggedTarget.size;
        break;
    case 'volume':
        value = loggedTarget.volume;
        break;
    }
    if (value) {
        runtime.requestUpdateMonitor(new Map([
            ['id', monitorId],
            ['value', value]
        ]));
    }
};

/**
 * Restore a monitor to a logged value.
 *
 * @param {Runtime} runtime - Runtime of which the monitor should change
 * @param {Snapshot} logSnapshot - logged snapshot
 * @param {string} monitorId - The monitor id
 */
export const updateGeneralMonitor = function (runtime, logSnapshot, monitorId) {
    let value;
    switch (monitorId) {
    case 'timer':
        value = logSnapshot.time / 1000;
        break;
    case 'backdropnumbername_number':
        value = logSnapshot.stage.currentCostume + 1;
        break;
    }
    if (value) {
        runtime.requestUpdateMonitor(new Map([
            ['id', monitorId],
            ['value', value]
        ]));
    }
};

/**
 * Restore the answer monitor to a previous value.
 *
 * @param {Runtime} runtime - A pointer to the Runtime to update the monitor
 * @param {Event} answerEvents - all events of type 'answer' in the log
 * @param {number} timestamp - timestamp for the answer
 */
export const updateAnswerMonitor = function (runtime, answerEvents, timestamp) {
    let value = '';
    for (const answerEvent of answerEvents) {
        if (answerEvent.timestamp <= timestamp) {
            value = answerEvent.data.text;
        }
    }
    // Update always, also to an empty value for when no answer given (yet)
    runtime.requestUpdateMonitor(new Map([
        ['id', 'answer'],
        ['value', value]
    ]));
};
