import {
    getNonWaitActivityRanges,
    getWaitBoundaries
} from '../../src/components/debug-timeline/timeline-utils.js';

describe('getNonWaitActivityRanges', () => {
    test('removes wait sections from every thread before combining ranges', () => {
        const activeThreads = new Map([
            ['first', {
                periods: [{
                    start: 0,
                    end: 3000,
                    waitPeriods: [
                        {start: 0, end: 1000},
                        {start: 2000, end: 3000}
                    ]
                }]
            }],
            ['second', {
                periods: [{
                    start: 0,
                    end: 3000,
                    waitPeriods: [{start: 0, end: 3000}]
                }]
            }]
        ]);

        expect(getNonWaitActivityRanges(activeThreads, 3000)).toEqual([[1000, 2000]]);
    });

    test('keeps non-wait activity around a wait interval', () => {
        const activeThreads = new Map([
            ['thread', {
                periods: [{
                    start: 0,
                    end: 5000,
                    waitPeriods: [{start: 1000, end: 4000}]
                }]
            }]
        ]);

        expect(getNonWaitActivityRanges(activeThreads, 5000)).toEqual([
            [0, 1000],
            [4000, 5000]
        ]);
    });

    test('uses the current timeline end for open waits and periods', () => {
        const activeThreads = new Map([
            ['thread', {
                periods: [{
                    start: 0,
                    end: null,
                    waitPeriods: [{start: 0, end: null}]
                }]
            }]
        ]);

        expect(getNonWaitActivityRanges(activeThreads, 3000)).toEqual([]);
    });

    test('does not treat action periods as non-wait activity', () => {
        const activeThreads = new Map([
            ['thread', {
                periods: [{
                    start: 0,
                    end: 3000,
                    waitPeriods: [{start: 0, end: 3000}],
                    actionPeriods: [{start: 500, end: 2500}]
                }]
            }]
        ]);

        expect(getNonWaitActivityRanges(activeThreads, 3000)).toEqual([]);
    });

    test('returns separate boundaries for adjacent waits in one compressed gap', () => {
        const activeThreads = new Map([
            ['thread', {
                periods: [{
                    start: 0,
                    end: 5000,
                    waitPeriods: [
                        {start: 100, end: 1000},
                        {start: 1000, end: 2400}
                    ]
                }]
            }]
        ]);

        expect(getWaitBoundaries(activeThreads)).toEqual([100, 1000, 1000, 2400]);
    });
});
