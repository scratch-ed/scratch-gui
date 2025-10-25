const SET_CONTEXT = 'scratch-gui/time-slider/SET_CONTEXT';
const START_DEBUG = 'scratch-gui/time-slider/START_DEBUG';
const START_TEST = 'scratch-gui/time-slider/START_TEST';
const FINISH_TEST = 'scratch-gui/time-slider/FINISH_TEST';
const CLOSE_SLIDER = 'scratch-gui/time-slider/CLOSE_SLIDER';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/time-slider/SET_NUMBER_OF_FRAMES';
const SET_TIMESTAMPS = 'scratch-gui/time-slider/SET_TIMESTAMPS';
const ADD_EVENT = 'scratch-gui/time-slider/ADD_EVENT';
const SET_EVENTS = 'scratch-gui/time-slider/SET_EVENTS';
const SET_PAUSED = 'scratch-gui/time-slider/SET_PAUSED';
const SET_CHANGED = 'scratch-gui/time-slider/SET_CHANGED';
const SET_REMOVE_FUTURE = 'scratch-gui/time-slider/SET_REMOVE_FUTURE';
const SET_TIME_FRAME = 'scratch-gui/time-slider/SET_TIME_FRAME';
const ZOOM_IN = 'scratch-gui/time-slider/ZOOM_IN';
const ZOOM_OUT = 'scratch-gui/time-slider/ZOOM_OUT';
const ZOOM_RESET = 'scratch-gui/time-slider/ZOOM_RESET';
const LOCATE_ACTIVE_BULLET = 'scratch-gui/time-slider/LOCATE_ACTIVE_BULLET';

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
    events: [],
    paused: false,
    changed: false,
    removeFuture: false,
    timeFrame: 0,
    zoomLevel: 1,
    minZoomLevel: 0.1,
    maxZoomLevel: 2,
    zoomStep: 0.1,
    locateActiveBullet: false
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
            numberOfFrames: action.numberOfFrames,
            timestamps: state.timestamps.slice(0, action.numberOfFrames)
        });
    case SET_TIMESTAMPS:
        return Object.assign({}, state, {
            timestamps: action.timestamps
        });
    case ADD_EVENT:
        return Object.assign({}, state, {
            events: state.events.concat(action.event)
        });
    case SET_EVENTS:
        return Object.assign({}, state, {
            events: action.events
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
    case ZOOM_IN:
        return Object.assign({}, state, {
            zoomLevel: Math.max(state.zoomLevel - state.zoomStep, state.minZoomLevel)
        });
    case ZOOM_OUT:
        return Object.assign({}, state, {
            zoomLevel: Math.min(state.zoomLevel + state.zoomStep, state.maxZoomLevel)
        });
    case ZOOM_RESET:
        return Object.assign({}, state, {
            zoomLevel: 1
        });
    case LOCATE_ACTIVE_BULLET:
        return Object.assign({}, state, {
            locateActiveBullet: action.locateActiveBullet
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

const addEvent = function (event) {
    return {
        type: ADD_EVENT,
        event: event
    };
};

const setEvents = function (events) {
    return {
        type: SET_EVENTS,
        events: events
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

const zoomIn = function () {
    return {
        type: ZOOM_IN
    };
};

const zoomOut = function () {
    return {
        type: ZOOM_OUT
    };
};

const zoomReset = function () {
    return {
        type: ZOOM_RESET
    };
};

const locateActiveBullet = function (locate = true) {
    return {
        type: LOCATE_ACTIVE_BULLET,
        locateActiveBullet: locate
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
    addEvent,
    setEvents,
    setPaused,
    setChanged,
    setRemoveFuture,
    setTimeFrame,
    zoomIn,
    zoomOut,
    zoomReset,
    locateActiveBullet
};
