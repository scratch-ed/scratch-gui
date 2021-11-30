const SET_DEBUG_MODE = 'scratch-gui/debugger/SET_DEBUG_MODE';
const TOGGLE_DEBUG_MODE = 'scratch-gui/debugger/TOGGLE_DEBUG_MODE';
const ENABLE_ANIMATION = 'scratch-gui/debugger/ENABLE_ANIMATION';
const DISABLE_ANIMATION = 'scratch-gui/debugger/DISABLE_ANIMATION';
const SET_TRAIL_SKIN_ID = 'scratch-gui/debugger/SET_TRAIL_SKIN_ID';
const SET_ANIMATION_SKIN_ID = 'scratch-gui/debugger/SET_ANIMATION_SKIN_ID';
const SET_CONTEXT = 'scratch-gui/debugger/SET_CONTEXT';
const SET_TIME_FRAME = 'scratch-gui/debugger/SET_TIME_FRAME';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/debugger/SET_NUMBER_OF_FRAMES';
const SET_TRAIL_LENGTH = 'scratch-gui/debugger/SET_TRAIL_LENGTH';

export class Waiter {
    constructor () {
        // eslint-disable-next-line no-unused-vars
        this.prom = new Promise((resolve, _) => {
            this.res = resolve;
        });
    }
}

const initialState = {
    // State related to the trail animation.
    animate: false,
    animationSkinId: -1,
    trailSkinId: -1,
    // State related to the debugger GUI.
    context: null,
    debugMode: false,
    numberOfFrames: 0,
    timeFrame: -1,
    trailLength: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_DEBUG_MODE:
        return Object.assign({}, state, {
            debugMode: action.debugMode
        });
    case TOGGLE_DEBUG_MODE:
        return Object.assign({}, state, {
            debugMode: !state.debugMode
        });
    case ENABLE_ANIMATION:
        return Object.assign({}, state, {
            animate: true
        });
    case DISABLE_ANIMATION:
        return Object.assign({}, state, {
            animate: false
        });
    case SET_TRAIL_SKIN_ID:
        return Object.assign({}, state, {
            trailSkinId: action.trailSkinId
        });
    case SET_ANIMATION_SKIN_ID:
        return Object.assign({}, state, {
            animationSkinId: action.animationSkinId
        });
    case SET_CONTEXT:
        return Object.assign({}, state, {
            context: action.context
        });
    case SET_TIME_FRAME:
        return Object.assign({}, state, {
            timeFrame: action.timeFrame
        });
    case SET_NUMBER_OF_FRAMES:
        return Object.assign({}, state, {
            numberOfFrames: action.numberOfFrames
        });
    case SET_TRAIL_LENGTH:
        return Object.assign({}, state, {
            trailLength: action.trailLength
        });
    default:
        return state;
    }
};

const setDebugMode = function (debugMode) {
    return {
        type: SET_DEBUG_MODE,
        debugMode: debugMode
    };
};

const toggleDebugMode = function () {
    return {type: TOGGLE_DEBUG_MODE};
};

const enableAnimation = function () {
    return {type: ENABLE_ANIMATION};
};

const disableAnimation = function () {
    return {type: DISABLE_ANIMATION};
};

const setTrailSkinId = function (trailSkinId) {
    return {
        type: SET_TRAIL_SKIN_ID,
        trailSkinId: trailSkinId
    };
};

const setAnimationSkinId = function (animationSkinId) {
    return {
        type: SET_ANIMATION_SKIN_ID,
        animationSkinId: animationSkinId
    };
};

const setContext = function (context) {
    return {
        type: SET_CONTEXT,
        context: context
    };
};

const setTimeFrame = function (timeFrame) {
    return {
        type: SET_TIME_FRAME,
        timeFrame: timeFrame
    };
};

const setNumberOfFrames = function (numberOfFrames) {
    return {
        type: SET_NUMBER_OF_FRAMES,
        numberOfFrames: numberOfFrames
    };
};

const setTrailLength = function (trailLength) {
    return {
        type: SET_TRAIL_LENGTH,
        trailLength: trailLength
    };
};

export {
    reducer as default,
    initialState as debuggerInitialState,
    setDebugMode,
    toggleDebugMode,
    enableAnimation,
    disableAnimation,
    setTrailSkinId,
    setAnimationSkinId,
    setContext,
    setTimeFrame,
    setNumberOfFrames,
    setTrailLength
};
