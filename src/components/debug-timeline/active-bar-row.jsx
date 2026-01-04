import React from 'react';
import PropTypes from 'prop-types';
import {EVENT_INFO, TRACK_HEIGHT} from './constants.ts';
import {getCompressedPlotPosition} from './helpers.ts';
import styles from './debug-timeline.css';

const ActiveBarRow = ({
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
            title={`${activeThread.targetName}: ${EVENT_INFO[activeThread.topBlockName].name}`}
        >
            <div className={styles.trackBar}>
                <div
                    className={`${styles.trackBarContent} ${colorClass}`}
                    onDoubleClick={() => onSelectBar(activeThread)}
                />
            </div>
        </div>
    );
};

ActiveBarRow.propTypes = {
    activeThread: PropTypes.shape({
        targetName: PropTypes.string.isRequired,
        topBlockName: PropTypes.string.isRequired,
        start: PropTypes.number.isRequired,
        end: PropTypes.number,
        hasEnded: PropTypes.bool.isRequired
    }).isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    // When double-clicking on a bar, the stack of code corresponding to the sprites hat block should be highlighted
    onSelectBar: PropTypes.func.isRequired
};

export default ActiveBarRow;
