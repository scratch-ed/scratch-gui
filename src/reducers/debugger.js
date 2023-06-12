const SET_CONTEXT = 'scratch-gui/debugger/SET_CONTEXT';
const SET_DEBUG_MODE = 'scratch-gui/debugger/SET_DEBUG_MODE';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/debugger/SET_NUMBER_OF_FRAMES';
const SET_PAUSED = 'scratch-gui/debugger/SET_PAUSED';
const SET_CHANGED = 'scratch-gui/debugger/SET_CHANGED';
const SET_TIME_FRAME = 'scratch-gui/debugger/SET_TIME_FRAME';

const initialState = {
    // State related to the debugger GUI.
    context: null,
    debugMode: false,
    numberOfFrames: 0,
    paused: false,
    changed: false,
    timeFrame: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
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
    case SET_PAUSED:
        return Object.assign({}, state, {
            paused: action.paused
        });
    case SET_CHANGED:
        return Object.assign({}, state, {
            changed: action.changed
        });
    case SET_TIME_FRAME:
        return Object.assign({}, state, {
            timeFrame: action.timeFrame
        });
    default:
        return state;
    }
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

const setChanged = function (changed) {
    return {
        type: SET_CHANGED,
        changed: changed
    };
};

const setPaused = function (paused) {
    return {
        type: SET_PAUSED,
        paused: paused
    };
};

const setTimeFrame = function (timeFrame) {
    return {
        type: SET_TIME_FRAME,
        timeFrame: timeFrame
    };
};

export {
    reducer as default,
    initialState as debuggerInitialState,
    setContext,
    setDebugMode,
    setNumberOfFrames,
    setPaused,
    setChanged,
    setTimeFrame
};
