const EPSILON = 1e-12;

export const getCompressedGap = (eventTime, timeTicks, tickSize) => {
    for (let index = 0; index < timeTicks.length - 1; index++) {
        const start = timeTicks[index];
        const end = timeTicks[index + 1];

        if (
            end - start > tickSize + EPSILON &&
            eventTime >= start - EPSILON &&
            eventTime <= end + EPSILON
        ) {
            return {start: start, end: end};
        }
    }

    return null;
};

export const isEventInCompressedGap = (eventTime, timeTicks, tickSize) =>
    getCompressedGap(eventTime, timeTicks, tickSize) !== null;

export const getCompressedGapPosition = (eventTime, timeTicks, tickSize, barWidth) => {
    const gap = getCompressedGap(eventTime, timeTicks, tickSize);
    if (!gap) {
        return null;
    }

    const gapIndex = timeTicks.indexOf(gap.start);
    const compressedBarStart = gapIndex * barWidth;
    return compressedBarStart + (barWidth / 2);
};
