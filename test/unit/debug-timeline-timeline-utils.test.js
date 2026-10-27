import {getNonWaitActivityRanges} from '../../src/components/debug-timeline/timeline-utils.js';

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
});
