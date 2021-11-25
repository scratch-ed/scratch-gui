const TOGGLE_DEBUG_MODE = 'scratch-gui/debugger/TOGGLE_DEBUG_MODE';
const START_DEBUGGER = 'scratch-gui/debugger/START_DEBUGGER';
const STOP_DEBUGGER = 'scratch-gui/debugger/STOP_DEBUGGER';
const SET_TRAIL = 'scratch-gui/debugger/SET_TRAIL';
const ENABLE_ANIMATION = 'scratch-gui/debugger/ENABLE_ANIMATION';
const DISABLE_ANIMATION = 'scratch-gui/debugger/DISABLE_ANIMATION';
const SET_ANIMATE_INDEX = 'scratch-gui/debugger/SET_ANIMATE_INDEX';
const SET_INTERVAL_INDEX = 'scratch-gui/debugger/SET_INTERVAL_INDEX';
const SET_TRAIL_SKIN_ID = 'scratch-gui/debugger/SET_TRAIL_SKIN_ID';
const SET_ANIMATION_SKIN_ID = 'scratch-gui/debugger/SET_ANIMATION_SKIN_ID';
const SET_CONTEXT = 'scratch-gui/debugger/SET_CONTEXT';
const SET_TIME_FRAME = 'scratch-gui/debugger/SET_TIME_FRAME';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/debugger/SET_NUMBER_OF_FRAMES';
const ENABLE_TIME_SLIDER = 'scratch-gui/debugger/ENABLE_TIME_SLIDER';
const DISABLE_TIME_SLIDER = 'scratch-gui/debugger/DISABLE_TIME_SLIDER';
const RESET_TIME_SLIDER = 'scratch-gui/debugger/RESET_TIME_SLIDER';
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
    debugMode: false,
    isRunning: false,
    // State related to the trail animation.
    trail: [],
    animate: false,
    animateIndex: 0,
    intervalIndex: null,
    trailSkinId: null,
    animationSkinId: null,
    // State related to the debugger GUI.
    context: null,
    timeFrame: 0,
    numberOfFrames: 0,
    timeSliderDisabled: true,
    trailLength: 0,
    timeSliderKey: true
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case TOGGLE_DEBUG_MODE:
        return Object.assign({}, state, {
            debugMode: !state.debugMode
        });
    case START_DEBUGGER:
        return Object.assign({}, state, {
            isRunning: true
        });
    case STOP_DEBUGGER:
        return Object.assign({}, state, {
            isRunning: false
        });
    case SET_TRAIL:
        return Object.assign({}, state, {
            trail: action.trail
        });
    case ENABLE_ANIMATION:
        return Object.assign({}, state, {
            animate: true
        });
    case DISABLE_ANIMATION:
        return Object.assign({}, state, {
            animate: false
        });
    case SET_ANIMATE_INDEX:
        return Object.assign({}, state, {
            animateIndex: action.animateIndex
        });
    case SET_INTERVAL_INDEX:
        return Object.assign({}, state, {
            intervalIndex: action.intervalIndex
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
    case ENABLE_TIME_SLIDER:
        return Object.assign({}, state, {
            timeSliderDisabled: false
        });
    case DISABLE_TIME_SLIDER:
        return Object.assign({}, state, {
            timeSliderDisabled: true
        });
    case RESET_TIME_SLIDER:
        return Object.assign({}, state, {
            timeFrame: 0,
            numberOfFrames: 0,
            timeSliderDisabled: true,
            timeSliderKey: !state.timeSliderKey
        });
    case SET_TRAIL_LENGTH:
        return Object.assign({}, state, {
            trailLength: action.trailLength
        });
    default:
        return state;
    }
};

const toggleDebugMode = function () {
    return {type: TOGGLE_DEBUG_MODE};
};

const startDebugger = function () {
    return {type: START_DEBUGGER};
};

const stopDebugger = function () {
    return {type: STOP_DEBUGGER};
};

const setTrail = function (trail) {
    return {
        type: SET_TRAIL,
        trail: trail
    };
};

const enableAnimation = function () {
    return {type: ENABLE_ANIMATION};
};

const disableAnimation = function () {
    return {type: DISABLE_ANIMATION};
};

const setAnimateIndex = function (animateIndex) {
    return {
        type: SET_ANIMATE_INDEX,
        animateIndex: animateIndex
    };
};

const setIntervalIndex = function (intervalIndex) {
    return {
        type: SET_INTERVAL_INDEX,
        intervalIndex: intervalIndex
    };
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

const enableTimeSlider = function () {
    return {type: ENABLE_TIME_SLIDER};
};

const disableTimeSlider = function () {
    return {type: ENABLE_TIME_SLIDER};
};

const resetTimeSlider = function () {
    return {type: RESET_TIME_SLIDER};
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
    toggleDebugMode,
    startDebugger,
    stopDebugger,
    setTrail,
    enableAnimation,
    disableAnimation,
    setAnimateIndex,
    setIntervalIndex,
    setTrailSkinId,
    setAnimationSkinId,
    setContext,
    setTimeFrame,
    setNumberOfFrames,
    enableTimeSlider,
    disableTimeSlider,
    resetTimeSlider,
    setTrailLength
};
