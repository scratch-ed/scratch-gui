/**
 * Helper function to check if 2 positions are equal.
 *
 * @param {[number, number]} position1 - Base position.
 * @param {[number, number]} position2 - Position to compare with.
 * @returns {boolean} - True if positions are equal, else false
 */
export const positionsAreEqual = function (position1, position2) {
    if (!position1 || !position2 || position1.length !== 2 || position2.length !== 2) {
        return false;
    }

    const [x1, y1] = position1;
    const [x2, y2] = position2;

    return x1 === x2 && y1 === y2;
};

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
 * Restore the sprite's variables to the values stored in the log.
 *
 * @param {RenderedTarget} sprite - Sprite that needs to be updated.
 * @param {ScratchVariable[]} loggedVariables - Variables stored in the log.
 */
export const updateSpriteVariables = function (sprite, loggedVariables) {
    for (const variableLog of loggedVariables) {
        const variable = sprite.lookupOrCreateVariable(variableLog.id, variableLog.name);
        variable.value = variableLog.value;
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
