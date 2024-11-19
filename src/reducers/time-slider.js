const SET_CONTEXT = 'scratch-gui/time-slider/SET_CONTEXT';
const START_DEBUG = 'scratch-gui/time-slider/START_DEBUG';
const START_TEST = 'scratch-gui/time-slider/START_TEST';
const FINISH_TEST = 'scratch-gui/time-slider/FINISH_TEST';
const CLOSE_SLIDER = 'scratch-gui/time-slider/CLOSE_SLIDER';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/time-slider/SET_NUMBER_OF_FRAMES';
const SET_TIMESTAMPS = 'scratch-gui/time-slider/SET_TIMESTAMPS';
const SET_MARKERS = 'scratch-gui/time-slider/SET_MARKERS';
const ADD_RENDER = 'scratch-gui/time-slider/ADD_RENDER';
const CLEAR_RENDERS = 'scratch-gui/time-slider/CLEAR_RENDERS';
const SET_PAUSED = 'scratch-gui/time-slider/SET_PAUSED';
const SET_CHANGED = 'scratch-gui/time-slider/SET_CHANGED';
const SET_REMOVE_FUTURE = 'scratch-gui/time-slider/SET_REMOVE_FUTURE';
const SET_TIME_FRAME = 'scratch-gui/time-slider/SET_TIME_FRAME';

const TimeSliderMode = Object.freeze({
    OFF: 'off',
    DEBUG: 'debug',
    TEST_RUNNING: 'running',
    TEST_FINISHED: 'finished'
});

const TimeSliderStates = Object.values(TimeSliderMode);

const initialState = {
    // State related to the debugger and tester time slider.
    context: null,
    timeSliderMode: TimeSliderMode.OFF,
    numberOfFrames: 0,
    timestamps: [],
    markers: [],
    renders: [],
    paused: false,
    changed: false,
    removeFuture: false,
    timeFrame: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_CONTEXT:
        return Object.assign({}, state, {
            context: action.context
        });
    case START_DEBUG:
        return Object.assign({}, state, {
            timeSliderMode: TimeSliderMode.DEBUG
        });
    case START_TEST:
        return Object.assign({}, state, {
            timeSliderMode: TimeSliderMode.TEST_RUNNING
        });
    case FINISH_TEST:
        return Object.assign({}, state, {
            timeSliderMode: TimeSliderMode.TEST_FINISHED
        });
    case CLOSE_SLIDER:
        return Object.assign({}, state, {
            timeSliderMode: TimeSliderMode.OFF
        });
    case SET_NUMBER_OF_FRAMES:
        return Object.assign({}, state, {
            numberOfFrames: action.numberOfFrames
        });
    case SET_TIMESTAMPS:
        return Object.assign({}, state, {
            timestamps: action.timestamps
        });
    case SET_MARKERS:
        return Object.assign({}, state, {
            markers: action.markers
        });
    case ADD_RENDER:
        state.renders.push(action.render);
        return Object.assign({}, state, {
            renders: state.renders
        });
    case CLEAR_RENDERS:
        return Object.assign({}, state, {
            renders: []
        });
    case SET_PAUSED:
        return Object.assign({}, state, {
            paused: action.paused
        });
    case SET_CHANGED:
        return Object.assign({}, state, {
            changed: action.changed
        });
    case SET_REMOVE_FUTURE:
        return Object.assign({}, state, {
            removeFuture: action.removeFuture
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

const startDebugging = function () {
    return {
        type: START_DEBUG
    };
};

const startTesting = function () {
    return {
        type: START_TEST
    };
};

const finishTesting = function () {
    return {
        type: FINISH_TEST
    };
};

const closeSlider = function () {
    return {
        type: CLOSE_SLIDER
    };
};

const setNumberOfFrames = function (numberOfFrames) {
    return {
        type: SET_NUMBER_OF_FRAMES,
        numberOfFrames: numberOfFrames
    };
};

const setTimestamps = function (timestamps) {
    return {
        type: SET_TIMESTAMPS,
        timestamps: timestamps
    };
};

const setMarkers = function (markers) {
    return {
        type: SET_MARKERS,
        markers: markers
    };
};

const addRender = function (render) {
    return {
        type: ADD_RENDER,
        render: render
    };
};

const clearRenders = function () {
    return {
        type: CLEAR_RENDERS
    };
};

const setPaused = function (paused) {
    return {
        type: SET_PAUSED,
        paused: paused
    };
};

const setChanged = function (changed) {
    return {
        type: SET_CHANGED,
        changed: changed
    };
};

const setRemoveFuture = function (removeFuture) {
    return {
        type: SET_REMOVE_FUTURE,
        removeFuture: removeFuture
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
    initialState as timeSliderInitialState,
    TimeSliderMode,
    TimeSliderStates,
    setContext,
    startDebugging,
    startTesting,
    finishTesting,
    closeSlider,
    setNumberOfFrames,
    setTimestamps,
    setMarkers,
    addRender,
    clearRenders,
    setPaused,
    setChanged,
    setRemoveFuture,
    setTimeFrame
};
