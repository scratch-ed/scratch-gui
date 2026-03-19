const SET_CONTEXT = 'scratch-gui/time-slider/SET_CONTEXT';
const START_DEBUG = 'scratch-gui/time-slider/START_DEBUG';
const START_TEST = 'scratch-gui/time-slider/START_TEST';
const FINISH_TEST = 'scratch-gui/time-slider/FINISH_TEST';
const CLOSE_SLIDER = 'scratch-gui/time-slider/CLOSE_SLIDER';
const SET_NUMBER_OF_FRAMES = 'scratch-gui/time-slider/SET_NUMBER_OF_FRAMES';
const SET_TIMESTAMPS = 'scratch-gui/time-slider/SET_TIMESTAMPS';
const ADD_EVENT = 'scratch-gui/time-slider/ADD_EVENT';
const SET_EVENTS = 'scratch-gui/time-slider/SET_EVENTS';
const SET_ACTIVE_THREADS = 'scratch-gui/time-slider/SET_ACTIVE_THREADS';
const ADD_ACTIVE_THREAD = 'scratch-gui/time-slider/ADD_ACTIVE_THREAD';
const END_ACTIVE_THREAD = 'scratch-gui/time-slider/END_ACTIVE_THREAD';
const SET_PAUSED = 'scratch-gui/time-slider/SET_PAUSED';
const SET_CHANGED = 'scratch-gui/time-slider/SET_CHANGED';
const SET_REMOVE_FUTURE = 'scratch-gui/time-slider/SET_REMOVE_FUTURE';
const SET_TIME_FRAME = 'scratch-gui/time-slider/SET_TIME_FRAME';
const ZOOM_IN = 'scratch-gui/time-slider/ZOOM_IN';
const ZOOM_OUT = 'scratch-gui/time-slider/ZOOM_OUT';
const ZOOM_RESET = 'scratch-gui/time-slider/ZOOM_RESET';
const LOCATE_ACTIVE_BULLET = 'scratch-gui/time-slider/LOCATE_ACTIVE_BULLET';
const SET_EXPORT_TRIGGER = 'scratch-gui/time-slider/SET_EXPORT_TRIGGER';
const SET_HEATMAP_VISIBLE = 'scratch-gui/time-slider/SET_HEATMAP_VISIBLE';
const SET_SPRITE_POSITIONS = 'scratch-gui/time-slider/SET_SPRITE_POSITIONS';
const ADD_SPRITE_POSITION = 'scratch-gui/time-slider/ADD_SPRITE_POSITION';
const CLEAR_SPRITE_POSITIONS = 'scratch-gui/time-slider/CLEAR_SPRITE_POSITIONS';
const SET_HEATMAP_INTENSITY = 'scratch-gui/time-slider/SET_HEATMAP_INTENSITY';

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
    activeThreads: new Map(),
    paused: false,
    changed: false,
    removeFuture: false,
    timeFrame: 0,
    zoomLevel: 1,
    minZoomLevel: 0.1,
    maxZoomLevel: 2,
    zoomStep: 0.1,
    locateActiveBullet: false,
    exportTrigger: false,
    heatmapVisible: false,
    spritePositions: [],
    heatmapIntensity: 10
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
    case SET_ACTIVE_THREADS:
        return Object.assign({}, state, {
            activeThreads: action.threads
        });
    case ADD_ACTIVE_THREAD:
        const {topBlock, target, options, timestamp} = action;
        const currentThreadMap = new Map(state.activeThreads);

        if (currentThreadMap.has(topBlock)) {
            const activeObject = currentThreadMap.get(topBlock);
            const activeList = activeObject.periods;
            if (activeList[activeList.length - 1].hasEnded) {
                activeList.push({
                    ...target,
                    start: timestamp,
                    end: null,
                    hasEnded: false
                });
            }
        } else {
            const activeArray = [{
                ...target,
                start: timestamp,
                end: null,
                hasEnded: false
            }];

            currentThreadMap.set(topBlock, {
                periods: activeArray,
                options: options
            });
        }

        return Object.assign({}, state, {
            activeThreads: currentThreadMap
        });
    case END_ACTIVE_THREAD:
        const {topBlock: endTopBlock, timestamp: endTimestamp} = action;
        const endThreadMap = new Map(state.activeThreads);

        if (endThreadMap.has(endTopBlock)) {
            const activeObject = endThreadMap.get(endTopBlock);
            const activeList = activeObject.periods;
            const lastItem = activeList[activeList.length - 1];

            if (!lastItem.hasEnded) {
                lastItem.end = endTimestamp;
                lastItem.hasEnded = true;
            }
        }

        return Object.assign({}, state, {
            activeThreads: endThreadMap
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
    case SET_EXPORT_TRIGGER:
        return Object.assign({}, state, {
            exportTrigger: action.exportTrigger
        });
    case SET_HEATMAP_VISIBLE:
        return Object.assign({}, state, {
            heatmapVisible: action.heatmapVisible
        });
    case SET_SPRITE_POSITIONS:
        return Object.assign({}, state, {
            spritePositions: action.spritePositions
        });
    case ADD_SPRITE_POSITION:
        const {position} = action;
        const currentPositions = state.spritePositions || [];
        return Object.assign({}, state, {
            spritePositions: [...currentPositions, position]
        });
    case CLEAR_SPRITE_POSITIONS:
        return Object.assign({}, state, {
            spritePositions: []
        });
    case SET_HEATMAP_INTENSITY:
        return Object.assign({}, state, {
            heatmapIntensity: action.heatmapIntensity
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

const setActiveThreads = function (threads) {
    return {
        type: SET_ACTIVE_THREADS,
        threads: threads
    };
};

const addActiveThread = function (topBlock, target, options, timestamp) {
    return {
        type: ADD_ACTIVE_THREAD,
        topBlock: topBlock,
        target: target,
        options: options,
        timestamp: timestamp
    };
};

const endActiveThread = function (topBlock, timestamp) {
    return {
        type: END_ACTIVE_THREAD,
        topBlock: topBlock,
        timestamp: timestamp
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

const resetExportTrigger = function () {
    return {
        type: SET_EXPORT_TRIGGER,
        exportTrigger: false
    };
};

const triggerExportLogs = function () {
    return {
        type: SET_EXPORT_TRIGGER,
        exportTrigger: true
    };
};

const setHeatmapVisible = function (heatmapVisible) {
    return {
        type: SET_HEATMAP_VISIBLE,
        heatmapVisible: heatmapVisible
    };
};

const setSpritePositions = function (spritePositions) {
    return {
        type: SET_SPRITE_POSITIONS,
        spritePositions: spritePositions
    };
};

const addSpritePosition = function (position) {
    return {
        type: ADD_SPRITE_POSITION,
        position: position
    };
};

const clearSpritePositions = function () {
    return {
        type: CLEAR_SPRITE_POSITIONS
    };
};

const setHeatmapIntensity = function (heatmapIntensity) {
    return {
        type: SET_HEATMAP_INTENSITY,
        heatmapIntensity: heatmapIntensity
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
    setActiveThreads,
    addActiveThread,
    endActiveThread,
    setPaused,
    setChanged,
    setRemoveFuture,
    setTimeFrame,
    zoomIn,
    zoomOut,
    zoomReset,
    locateActiveBullet,
    resetExportTrigger,
    triggerExportLogs,
    setHeatmapVisible,
    setSpritePositions,
    addSpritePosition,
    clearSpritePositions,
    setHeatmapIntensity
};
