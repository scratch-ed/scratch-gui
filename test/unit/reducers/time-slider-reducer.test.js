import reducer, {
    addActiveThread,
    endActiveThread,
    timeSliderInitialState
} from '../../../src/reducers/time-slider';

const target = {
    targetName: 'Sprite1',
    topBlockName: 'event_whenflagclicked'
};

const createState = () => ({
    ...timeSliderInitialState,
    activeThreads: new Map()
});

describe('time-slider wait periods', () => {
    test('records contiguous waiting periods and closes them when execution resumes', () => {
        let state = reducer(createState(), addActiveThread('thread', target, {}, 0, false));
        state = reducer(state, addActiveThread('thread', target, {}, 100, true));
        state = reducer(state, addActiveThread('thread', target, {}, 200, true));
        state = reducer(state, addActiveThread('thread', target, {}, 300, false));

        expect(state.activeThreads.get('thread').periods[0].waitPeriods).toEqual([
            {start: 100, end: 300}
        ]);
    });

    test('closes an open waiting period when a thread ends', () => {
        let state = reducer(createState(), addActiveThread('thread', target, {}, 0, true));
        state = reducer(state, endActiveThread('thread', 250));

        expect(state.activeThreads.get('thread').periods[0].waitPeriods).toEqual([
            {start: 0, end: 250}
        ]);
    });
});
