/**
 * this adds a range to the ranges array, but excludes any wait periods that overlap with the range
 */
const addRangeWithoutWaits = (ranges, start, end, waitPeriods) => {
    if (end <= start) {
        return;
    }

    const waits = waitPeriods
        .map(period => ({
            start: Math.max(start, period.start),
            end: Math.min(end, period.end === null ? end : period.end)
        }))
        .filter(period => period.end > period.start)
        .sort((first, second) => first.start - second.start);

    let currentStart = start;
    waits.forEach(wait => {
        if (wait.start > currentStart) {
            ranges.push([currentStart, wait.start]);
        }
        currentStart = Math.max(currentStart, wait.end);
    });

    if (currentStart < end) {
        ranges.push([currentStart, end]);
    }
};

/**
 * this returns an array of ranges that represent the non-wait activity of the active threads
 */
export const getNonWaitActivityRanges = (activeThreads, timestampEnd) => {
    const ranges = [];

    activeThreads.forEach(threadData => {
        threadData.periods.forEach(period => {
            const end = period.end === null ? timestampEnd : period.end;
            addRangeWithoutWaits(ranges, period.start, end, period.waitPeriods || []);
        });
    });

    return ranges;
};

/**
 * this returns true if the active threads have any non-wait activity between start and end
 */
export const hasNonWaitActivity = (activeThreads, start, end) => {
    for (const threadData of activeThreads.values()) {
        for (const period of threadData.periods) {
            const periodEnd = period.end === null ? end : period.end;
            const ranges = [];
            addRangeWithoutWaits(ranges, period.start, periodEnd, period.waitPeriods || []);
            if (ranges.some(range => range[0] < end && range[1] > start)) {
                return true;
            }
        }
    }

    return false;
};
