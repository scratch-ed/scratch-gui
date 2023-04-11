const SET_ANIMATION = 'scratch-gui/debugger/SET_ANIMATION';
const SET_CONTEXT = 'scratch-gui/debugger/SET_CONTEXT';
const SET_DEBUG_MODE = 'scratch-gui/debugger/SET_DEBUG_MODE';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/debugger/SET_NUMBER_OF_FRAMES';
const SET_ONLY_KEEP_TIME_FRAME = 'scratch-gui/debugger/SET_ONLY_KEEP_TIME_FRAME';
const SET_PAUSED = 'scratch-gui/debugger/SET_PAUSED';
const SET_CHANGED = 'scratch-gui/debugger/SET_CHANGED';
const SET_TIME_FRAME = 'scratch-gui/debugger/SET_TIME_FRAME';
const SET_TRAIL_LENGTH = 'scratch-gui/debugger/SET_TRAIL_LENGTH';

const initialState = {
    // State related to the trail animation.
    animate: false,
    // State related to the debugger GUI.
    context: null,
    debugMode: false,
    numberOfFrames: 0,
    onlyKeepTimeFrame: -1,
    paused: false,
    changed: false,
    timeFrame: 0,
    trailLength: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_ANIMATION:
        return Object.assign({}, state, {
            animate: action.animate
        });
    case SET_CONTEXT:
        return Object.assign({}, state, {
            context: action.context
        });
    case SET_DEBUG_MODE:
        return Object.assign({}, state, {
            debugMode: action.debugMode
        });
    case SET_NUMBER_OF_FRAMES:
        return Object.assign({}, state, {
            numberOfFrames: action.numberOfFrames
        });
    case SET_ONLY_KEEP_TIME_FRAME:
        return Object.assign({}, state, {
            onlyKeepTimeFrame: action.onlyKeepTimeFrame
        });
    case SET_PAUSED:
        if (action.paused) {
            return Object.assign({}, state, {
                paused: true
            });
        }
        // When a program starts (again), nothing has changed yet
        return Object.assign({}, state, {
            paused: false,
            changed: false
        });
    case SET_CHANGED:
        return Object.assign({}, state, {
            changed: action.changed
        });
    case SET_TIME_FRAME:
        return Object.assign({}, state, {
            timeFrame: action.timeFrame
        });

    case SET_TRAIL_LENGTH:
        return Object.assign({}, state, {
            trailLength: action.trailLength
        });
    default:
        return state;
    }
};

const enableAnimation = function () {
    return {
        type: SET_ANIMATION,
        animate: true
    };
};

const disableAnimation = function () {
    return {
        type: SET_ANIMATION,
        animate: false
    };
};

const setContext = function (context) {
    return {
        type: SET_CONTEXT,
        context: context
    };
};

const setDebugMode = function (debugMode) {
    return {
        type: SET_DEBUG_MODE,
        debugMode: debugMode
    };
};

const setNumberOfFrames = function (numberOfFrames) {
    return {
        type: SET_NUMBER_OF_FRAMES,
        numberOfFrames: numberOfFrames
    };
};

const setOnlyKeepTimeFrame = function (onlyKeepTimeFrame) {
    return {
        type: SET_ONLY_KEEP_TIME_FRAME,
        onlyKeepTimeFrame: onlyKeepTimeFrame
    };
};


const setChanged = function (changed) {
    return {
        type: SET_CHANGED,
        changed: changed
    };
};

const setPaused = function (paused) {
    if (!paused) {
        return {
            type: SET_PAUSED,
            paused: false,
            changed: false
        };
    }
    return {
        type: SET_PAUSED,
        paused: true
    };
};

const setTimeFrame = function (timeFrame) {
    return {
        type: SET_TIME_FRAME,
        timeFrame: timeFrame
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
    enableAnimation,
    disableAnimation,
    setContext,
    setDebugMode,
    setNumberOfFrames,
    setOnlyKeepTimeFrame,
    setPaused,
    setChanged,
    setTimeFrame,
    setTrailLength
};
