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
 * TODO: Much more properties need to be set, e.g. sprite size, costume size...
 *
 * Update the sprite's position, direction and costume based on the information
 * stored in the logged sprite.
 *
 * @param {RenderedTarget} sprite - Sprite that needs to be updated.
 * @param {LoggedSprite} spriteLog - Logged sprite containing the new values.
 */
export const updateSprite = function (sprite, spriteLog) {
    sprite.setXY(spriteLog.x, spriteLog.y);
    sprite.setDirection(spriteLog.direction);
    sprite.setCostume(sprite.getCostumeIndexByName(spriteLog.costume));
};

/**
 * Finds the logged sprite in the log frame corresponding to the given sprite id.
 *
 * @param {LogFrame} frame - frame in the log
 * @param {string} spriteId - id of the sprite
 * @return {LoggedSprite | null} - logged sprite corresponding to given id
 */
export const findSpriteLog = function (frame, spriteId) {
    for (const spriteLog of frame.sprites) {
        if (spriteLog.id === spriteId) {
            return spriteLog;
        }
    }

    return null;
};
