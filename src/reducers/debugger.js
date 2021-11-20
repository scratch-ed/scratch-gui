const testPlan =
`({
    beforeExecution: function(template, submission, output) {
        output.describe('Testen voor Papegaai', (l) => {
            l.test('Papegaai bestaat', (l) => {
                l.expect(submission.containsSprite('Papegaai'))
                    .withError('Er moet een sprite met de naam Papegaai bestaan in het project!')
                    .toBe(true);
            });
        });
    },

    /** @param {Evaluation} e */
    duringExecution: function(e) {
        e.actionTimeout = 8000;
        // e.acceleration = 10;

        e.scheduler
            .wait(1000)
            .log(() => {
                e.test('Papegaai beweegt niet', (l) => {
                    l.expect(e.log.hasSpriteMoved('Papegaai'))
                        .withError('De papegaai mag niet bewegen voor er op geklikt wordt')
                        .toBe(false);
                });
            })
            .clickSprite('Papegaai', false)
            .wait(3000)
            .end();
    },

    /** @param {Evaluation} e */
    afterExecution: function(e) {
        e.describe('Testen voor papegaai', (l) => {
            // We beschouwen enkel de frames na de klik
            const klikEvent = e.log.events.filter({ type: 'click' })[0];
            const frames = searchFrames(e.log.frames, { after: klikEvent.time });
            const directions = []; // We slaan de richting van de papegaai op bij elke verandering van richting.
            let previousFrame = frames[0];
            let oldDirection = previousFrame.getSprite('Papegaai').direction;

            l.test('Papegaai vliegt enkel horizontaal', (l) => {
                l.expect(numericEquals(e.log.getMaxY('Papegaai'), e.log.getMinY('Papegaai')))
                    .withError('De y-coördinaat van de Papegaai blijft niet constant')
                    .toBe(true);
            });

            // De papegaai moet (horizontaal) van richting veranderen, maar enkel als de papegaai zich bij rand van het speelveld bevindt.
            for (const frame of frames) {
                const sprite = frame.getSprite('Papegaai');
                if (oldDirection !== sprite.direction) {
                    // De richting van de sprite is veranderd
                    directions.push(sprite.direction);
                    oldDirection = sprite.direction;
                    // Test of de papegaai de rand raakt
                    const papegaai = previousFrame.getSprite('Papegaai');
                    const raaktRand = papegaai.bounds.right > 220 || papegaai.bounds.left < -220;
                    l.test('De papegaai raakt de rand bij het veranderen van richting', (l) => {
                        l.expect(raaktRand)
                            .withError(
                                'De papegaai is veranderd van richting zonder de rand te raken van het speelveld',
                            )
                            .toBe(true);
                    });
                    l.test('De papegaai vliegt horizontaal', (l) => {
                        // Test of de papegaai altijd van links naar rechts en omgekeerd beweegt
                        l.expect(sprite.direction === 90 || sprite.direction === -90)
                            .withError(
                                'De richting van de papegaai is niet 90 of -90, de papegaai vliegt niet horizontaal.',
                            )
                            .toBe(true);
                    });
                }
                previousFrame = frame;
            }

            l.test('De papegaai veranderde minimum 2 keer van richting', (l) => {
                l.expect(directions.length > 2)
                    .withError(
                        \`De papegaai moet minstens twee veranderen van richting, maar is maar \${directions.length} keer veranderd\`,
                    )
                    .toBe(true);
            });

            // De papegaai verandert van kostuum tijdens het vliegen
            l.test('Papegaai klappert met vleugels', (l) => {
                // De papegaai verandert van kostuum tijdens het vliegen
                const costumeChanges = e.log.getCostumeChanges('Papegaai');
                l.expect(costumeChanges.length > 4)
                    .withError(
                        \`De Papegaai moet constant wisselen tussen de kostuums 'VleugelsOmhoog' en 'VleugelsOmlaag'\`,
                    )
                    .toBe(true);
            });
        });

        e.describe('Blokjes', (l) => {
            l.test('Gebruik van een lus', (l) => {
                // Gebruik best een lus de papegaai te bewegen en van kostuum te veranderen.
                l.expect(e.log.blocks.containsLoop())
                    .withError('Er werd geen herhalingslus gebruikt')
                    .toBe(true);
            });
            // De code in de lus wordt minstens 2 keer herhaald
            l.test('Correcte gebruik van de lus', (l) => {
                l.expect(e.log.blocks.numberOfExecutions('control_forever') > 2)
                    .withError('De code in de lus werd minder dan 2 keer herhaald')
                    .toBe(true);
            });
        });
    }
})`;

const TOGGLE_DEBUG_MODE = 'scratch-gui/debugger/TOGGLE_DEBUG_MODE';
const UPDATE_BREAKPOINTS = 'scratch-gui/debugger/UPDATE_BREAKPOINTS';
const START_DEBUGGER = 'scratch-gui/debugger/START_DEBUGGER';
const STOP_DEBUGGER = 'scratch-gui/debugger/STOP_DEBUGGER';
const SET_TRAIL = 'scratch-gui/debugger/SET_TRAIL';
const ENABLE_ANIMATION = 'scratch-gui/debugger/ENABLE_ANIMATION';
const DISABLE_ANIMATION = 'scratch-gui/debugger/DISABLE_ANIMATION';
const SET_ANIMATE_INDEX = 'scratch-gui/debugger/SET_ANIMATE_INDEX';
const SET_INTERVAL_INDEX = 'scratch-gui/debugger/SET_INTERVAL_INDEX';
const SET_TRAIL_SKIN_ID = 'scratch-gui/debugger/SET_TRAIL_SKIN_ID';
const SET_ANIMATION_SKIN_ID = 'scratch-gui/debugger/SET_ANIMATION_SKIN_ID';
const SET_JUDGE = 'scratch-gui/debugger/SET_JUDGE';
const SET_CODE_STRING = 'scratch-gui/debugger/SET_CODE_STRING';
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
    isRunning: false,
    // State related to the trail animation.
    trail: [],
    animate: false,
    animateIndex: 0,
    intervalIndex: null,
    trailSkinId: null,
    animationSkinId: null,
    // State related to the debugger GUI.
    judge: null,
    codeString: testPlan,
    timeFrame: 0,
    numberOfFrames: 0,
    timeSliderDisabled: true,
    trailLength: 0,
    timeSliderKey: true,

    inDebugMode: false,
    breakpoints: new Set()
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case TOGGLE_DEBUG_MODE:
        return Object.assign({}, state, {
            inDebugMode: !state.inDebugMode
        });
    case UPDATE_BREAKPOINTS:
        if (!state.breakpoints.delete(action.blockId)) {
            state.breakpoints.add(action.blockId);
        }
        return Object.assign({}, state, {
            breakpoints: state.breakpoints
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
    case SET_JUDGE:
        return Object.assign({}, state, {
            judge: action.judge
        });
    case SET_CODE_STRING:
        return Object.assign({}, state, {
            codeString: action.codeString
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

const updateBreakpoints = function (blockId) {
    return {
        type: UPDATE_BREAKPOINTS,
        blockId: blockId
    };
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

const setJudge = function (judge) {
    return {
        type: SET_JUDGE,
        judge: judge
    };
};

const setCodeString = function (codeString) {
    return {
        type: SET_CODE_STRING,
        codeString: codeString
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
    updateBreakpoints,
    startDebugger,
    stopDebugger,
    setTrail,
    enableAnimation,
    disableAnimation,
    setAnimateIndex,
    setIntervalIndex,
    setTrailSkinId,
    setAnimationSkinId,
    setJudge,
    setCodeString,
    setTimeFrame,
    setNumberOfFrames,
    enableTimeSlider,
    disableTimeSlider,
    resetTimeSlider,
    setTrailLength
};
