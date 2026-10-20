import {
    getCompressedGap,
    getCompressedGapPosition,
    isEventInCompressedGap
} from '../../src/components/debug-timeline/gap-utils.js';

describe('isEventInCompressedGap', () => {
    const timeTicks = [0, 1000, 2000, 6000, 7000];
    const tickSize = 1000;

    test('finds events inside a compressed interval', () => {
        expect(isEventInCompressedGap(4000, timeTicks, tickSize)).toBe(true);
    });

    test('keeps events at compressed interval boundaries visible', () => {
        expect(isEventInCompressedGap(2000, timeTicks, tickSize)).toBe(false);
        expect(isEventInCompressedGap(6000, timeTicks, tickSize)).toBe(false);
    });

    test('does not classify events in regular intervals as compressed', () => {
        expect(isEventInCompressedGap(1500, timeTicks, tickSize)).toBe(false);
        expect(isEventInCompressedGap(6500, timeTicks, tickSize)).toBe(false);
    });

    test('handles an unhandled final key or click event in a compressed interval', () => {
        expect(isEventInCompressedGap(4000, timeTicks, tickSize)).toBe(true);
    });

    test('places events inside a compressed span at its center', () => {
        expect(getCompressedGap(4000, timeTicks, tickSize)).toEqual({
            start: 2000,
            end: 6000
        });
        expect(getCompressedGapPosition(4000, timeTicks, tickSize, 80)).toBe(200);
    });
});
