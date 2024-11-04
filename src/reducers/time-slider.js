const SET_CONTEXT = 'scratch-gui/time-slider/SET_CONTEXT';
const START_DEBUG = 'scratch-gui/time-slider/START_DEBUG';
const START_TEST = 'scratch-gui/time-slider/START_TEST';
const FINISH_TEST = 'scratch-gui/time-slider/FINISH_TEST';
const CLOSE_SLIDER = 'scratch-gui/time-slider/CLOSE_SLIDER';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/time-slider/SET_NUMBER_OF_FRAMES';
const SET_MARKERS = 'scratch-gui/time-slider/SET_MARKERS';
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
    markers: [],
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
    case SET_MARKERS:
        return Object.assign({}, state, {
            markers: action.markers
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

const setMarkers = function (markers) {
    return {
        type: SET_MARKERS,
        markers: markers
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
    setMarkers,
    setPaused,
    setChanged,
    setRemoveFuture,
    setTimeFrame
};
