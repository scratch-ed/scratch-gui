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
 * @param {LoggedSprite} spriteLog - Logged sprite containing the new values.
 */
export const updateSprite = function (sprite, spriteLog) {
    sprite.setXY(spriteLog.x, spriteLog.y);
    sprite.setDirection(spriteLog.direction);
    sprite.setCostume(sprite.getCostumeIndexByName(spriteLog.costume));
};

/**
 * Initialize the interval that will call _step periodically.
 * @param {Runtime} runtime - Runtime whose step interval to set.
 */
export const setStepInterval = function (runtime) {
    if (runtime._steppingInterval === -1) {
        // Interval values copied from the Scratch Runtime:
        // https://github.com/LLK/scratch-vm/blob/develop/src/engine/runtime.js#L709
        const interval = runtime.compatibilityMode ?
            1000 / 30 :
            1000 / 60;

        runtime._steppingInterval = setInterval(() => {
            runtime._step();
        }, interval);
    }
};

/**
 * Clear the interval that calls _step periodically.
 * @param {Runtime} runtime - Runtime whose step interval to clear.
 */
export const clearStepInterval = function (runtime) {
    if (runtime._steppingInterval !== -1) {
        clearInterval(runtime._steppingInterval);
        runtime._steppingInterval = -1;
    }
};
