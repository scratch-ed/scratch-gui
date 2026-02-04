import React from 'react';
import PropTypes from 'prop-types';
import {EVENT_INFO, TRACK_HEIGHT} from './constants.ts';
import {getCompressedPlotPosition} from './helpers.ts';
import styles from './debug-timeline.css';

const ActiveBarElement = ({
    activeThread,
    timeTicks,
    tickSize,
    onSelectBar
}) => {
    const end = activeThread.hasEnded ? activeThread.end : timeTicks[timeTicks.length - 1];

    const left = getCompressedPlotPosition(activeThread.start, timeTicks, tickSize);
    const width = getCompressedPlotPosition(end, timeTicks, tickSize) - left;

    const colorClass = styles[EVENT_INFO[activeThread.topBlockName].color];

    return (
        <div
            className={styles.trackBarContainer}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                height: `${TRACK_HEIGHT}px`
            }}
            title={`${activeThread.targetName} reacted on: ${EVENT_INFO[activeThread.topBlockName].name.toLowerCase()}`}
        >
            <div className={styles.trackBar}>
                <div
                    className={`${styles.trackBarContent} ${colorClass}`}
                    onClick={() => onSelectBar(activeThread.start, end)}
                />
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
        hasEnded: PropTypes.bool.isRequired
    }).isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    onSelectBar: PropTypes.func.isRequired
};

const ActiveBarRow = ({
    threadId,
    periods,
    timeTicks,
    tickSize,
    onSelectBar
}) => (
    periods.map((threadData, index) => (
        <ActiveBarElement
            key={`${threadId}-${index}-track`}
            activeThread={threadData}
            timeTicks={timeTicks}
            tickSize={tickSize}
            onSelectBar={onSelectBar}
        />
    ))
);

ActiveBarRow.propTypes = {
    threadId: PropTypes.string.isRequired,
    periods: PropTypes.arrayOf(PropTypes.object).isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    onSelectBar: PropTypes.func.isRequired
};

export default ActiveBarRow;
