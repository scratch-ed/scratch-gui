export const getCompressedIntervals = (
    timeTicks,
    tickSize,
    isGap = (start, end) => end - start > tickSize
) => {
    const gaps = [];

    for (let index = 0; index < timeTicks.length - 1; index++) {
        const start = timeTicks[index];
        const end = timeTicks[index + 1];

        if (isGap(start, end)) {
            gaps.push({start: start, end: end});
        }
    }

    return gaps;
};

export const getCompressedGap = (eventTime, timeTicks, tickSize, isGap) => {
    const gaps = getCompressedIntervals(timeTicks, tickSize, isGap);
    return gaps.find(gap => eventTime > gap.start && eventTime < gap.end) || null;
};

export const isEventInCompressedGap = (eventTime, timeTicks, tickSize, isGap) =>
    getCompressedGap(eventTime, timeTicks, tickSize, isGap) !== null;

export const getCompressedGapPosition = (eventTime, timeTicks, tickSize, barWidth, isGap, knownGap) => {
    const gap = knownGap || getCompressedGap(eventTime, timeTicks, tickSize, isGap);
    if (!gap) {
        return null;
    }

    const gapIndex = timeTicks.indexOf(gap.start);
    const compressedBarStart = gapIndex * barWidth;
    return compressedBarStart + (barWidth / 2);
};
