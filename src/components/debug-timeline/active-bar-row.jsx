import React from 'react';
import PropTypes from 'prop-types';
import {EVENT_INFO, TRACK_HEIGHT} from './constants.ts';
import {getCompressedPlotPosition} from './helpers.ts';
import {getCompressedIntervals} from './gap-utils.js';
import styles from './debug-timeline.css';
import Event from './event.jsx';

const formatWaitDuration = duration => {
    if (duration < 1000) {
        return `${Math.round(duration)}ms`;
    }

    const seconds = duration / 1000;
    return `${Number(seconds.toFixed(seconds < 10 ? 1 : 0))}s`;
};

const formatElapsedWaitDuration = duration => `${Math.round(duration / 1000)}s`;

const getWaitLabel = (requestedDuration, elapsedDuration) => {
    const durationText = requestedDuration === null || requestedDuration === undefined ?
        formatElapsedWaitDuration(elapsedDuration) : formatWaitDuration(requestedDuration);

    return `WAIT ${durationText}`;
};

const getWaitSegments = (start, end, timeTicks, tickSize, isGap) => {
    const segments = [];
    let segmentStart = start;
    const gaps = getCompressedIntervals(timeTicks, tickSize, isGap);

    for (const gap of gaps) {
        const gapStart = gap.start;
        const gapEnd = gap.end;
        if (gapEnd <= start || gapStart >= end) {
            continue;
        }

        if (gapStart > segmentStart) {
            segments.push({start: segmentStart, end: gapStart});
        }

        segments.push({
            start: gapStart,
            end: gapEnd,
            compressed: true
        });
        segmentStart = gapEnd;
    }

    if (end > segmentStart) {
        segments.push({start: segmentStart, end: end});
    }

    return segments;
};

const ActiveBarElement = ({
    activeThread,
    timeTicks,
    lastTimestamp,
    tickSize,
    isGap,
    onSelectBar
}) => {
    const end = activeThread.hasEnded ? activeThread.end : lastTimestamp;

    const left = getCompressedPlotPosition(activeThread.start, timeTicks, tickSize);
    const width = getCompressedPlotPosition(end, timeTicks, tickSize) - left;

    const colorClass = styles[EVENT_INFO[activeThread.topBlockName].color];
    const waitPeriods = activeThread.waitPeriods || [];

    return (
        <div
            className={styles.trackBarContainer}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                height: `${TRACK_HEIGHT}px`
            }}
            title={`${activeThread.start}-${end}: ${activeThread.targetName} reacted on ${
                EVENT_INFO[activeThread.topBlockName].name.toLowerCase()}`}
        >
            <div className={styles.trackBar}>
                <div
                    className={`${styles.trackBarContent} ${colorClass}`}
                    onClick={() => onSelectBar(activeThread.start, end)}
                >
                    {waitPeriods.map((period, index) => {
                        const waitEnd = period.end === null ? end : period.end;
                        const duration = Math.max(0, waitEnd - period.start);
                        const durationText = formatWaitDuration(duration);
                        const waitLabel = getWaitLabel(period.requestedDuration, duration);
                        const waitTitle =
                            `WAIT: ${period.start}-${waitEnd}ms (${durationText})`;
                        const segments = getWaitSegments(
                            period.start, waitEnd, timeTicks, tickSize, isGap
                        );
                        const widestSegment = segments.reduce(
                            (widest, segment) => {
                                const segmentWidth =
                                    getCompressedPlotPosition(segment.end, timeTicks, tickSize) -
                                    getCompressedPlotPosition(segment.start, timeTicks, tickSize);
                                return segmentWidth > widest.width ?
                                    {segment: segment, width: segmentWidth} : widest;
                            },
                            {segment: null, width: -1}
                        ).segment;

                        return (
                            <React.Fragment key={index}>
                                {segments.map((segment, segmentIndex) => {
                                    const waitLeft = getCompressedPlotPosition(
                                        segment.start, timeTicks, tickSize
                                    ) - left;
                                    const waitWidth = getCompressedPlotPosition(
                                        segment.end, timeTicks, tickSize
                                    ) - getCompressedPlotPosition(segment.start, timeTicks, tickSize);
                                    return (
                                        <div
                                            key={segmentIndex}
                                            className={styles.waitBarContent}
                                            style={{
                                                left: `${waitLeft}px`,
                                                width: `${waitWidth}px`
                                            }}
                                            title={waitTitle}
                                        >
                                            {segment === widestSegment && (
                                                <span className={styles.waitMarker}>
                                                    {waitLabel}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

ActiveBarElement.propTypes = {
    activeThread: PropTypes.shape({
        targetName: PropTypes.string.isRequired,
        topBlockName: PropTypes.string.isRequired,
        start: PropTypes.number.isRequired,
        end: PropTypes.number,
        hasEnded: PropTypes.bool.isRequired,
        waitPeriods: PropTypes.arrayOf(PropTypes.shape({
            start: PropTypes.number.isRequired,
            end: PropTypes.number,
            requestedDuration: PropTypes.number
        })).isRequired
    }).isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    lastTimestamp: PropTypes.number.isRequired,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired,
    onSelectBar: PropTypes.func.isRequired
};

const BroadcastsOnRow = ({
    broadcastsSent,
    timeTicks,
    tickSize
}) => (
    <div>
        {broadcastsSent.map((event, index) => (
            <Event
                key={index}
                index={index}
                activeTargetName={''}
                position={getCompressedPlotPosition(event.begin, timeTicks, tickSize)}
                event={event}
                transparent={true}
            />
        ))}
    </div>
);

BroadcastsOnRow.propTypes = {
    broadcastsSent: PropTypes.arrayOf(PropTypes.object).isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired
};

const ActiveBarRow = ({
    threadId,
    periods,
    timeTicks,
    broadcastsSent,
    lastTimestamp,
    tickSize,
    isGap,
    onSelectBar
}) => (
    periods.map((threadData, index) => (
        <div key={index}>
            <ActiveBarElement
                key={`${threadId}-${index}-track`}
                activeThread={threadData}
                timeTicks={timeTicks}
                lastTimestamp={lastTimestamp}
                tickSize={tickSize}
                isGap={isGap}
                onSelectBar={onSelectBar}
            />
            {broadcastsSent.length > 0 &&
                <BroadcastsOnRow
                    broadcastsSent={broadcastsSent}
                    timeTicks={timeTicks}
                    tickSize={tickSize}
                />
            }
        </div>
    ))
);

ActiveBarRow.propTypes = {
    threadId: PropTypes.string.isRequired,
    periods: PropTypes.arrayOf(PropTypes.object).isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    broadcastsSent: PropTypes.arrayOf(PropTypes.object).isRequired,
    lastTimestamp: PropTypes.number.isRequired,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired,
    onSelectBar: PropTypes.func.isRequired
};

export default ActiveBarRow;
