import React from 'react';
import PropTypes from 'prop-types';
import {BAR_WIDTH, getCompressedPlotPosition, SUB_BAR_NUM} from './constants.ts';
import styles from './debug-timeline.css';

const EmptyRulerBar = () => (
    <div
        className={`${styles.rulerBar} ${styles.rulerBarEmpty}`}
        style={{width: `${BAR_WIDTH}px`}}
    >
        <p>{'...'}</p>
    </div>
);

const RulerSubBar = ({subBarIndex}) => {
    const borderClass = subBarIndex === SUB_BAR_NUM - 1 ? '' : styles.rulerSubbarBorder;

    return (
        <div
            className={`${styles.rulerSubbar} ${borderClass}`}
            style={{width: `${BAR_WIDTH / SUB_BAR_NUM}px`}}
        />
    );
};

RulerSubBar.propTypes = {
    subBarIndex: PropTypes.number.isRequired
};

const RulerBar = ({barNumber, isLastBar}) => (
    <div
        className={`${styles.rulerBar} ${isLastBar ? styles.rulerBarLast : ''}`}
        style={{width: `${BAR_WIDTH}px`}}
    >
        <div className={`${styles.rulerBarLabel} select-none`}>
            {Math.round(barNumber * 100) / 100}
        </div>
        <div className={styles.rulerSubbarContainer}>
            {Array.from({length: SUB_BAR_NUM}).map((_, j) => (
                <RulerSubBar
                    key={j}
                    subBarIndex={j}
                />
            ))}
        </div>
    </div>
);

RulerBar.propTypes = {
    barNumber: PropTypes.number.isRequired,
    isLastBar: PropTypes.bool.isRequired
};

const RulerIndicator = ({currentTick, timeTicks, tickSize}) => {
    // offset based on padding in ruler-thumb, if between 7-8 it has the best centering of the tip
    const leftOffset = getCompressedPlotPosition(currentTick, timeTicks, tickSize) - 7.5;
    return (
        <div
            className={styles.rulerThumb}
            style={{left: `${leftOffset}px`}}
        />
    );
};

RulerIndicator.propTypes = {
    currentTick: PropTypes.number.isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired
};

const Ruler = ({timeTicks, currentTick, tickSize, isGap}) => {
    const maxBars = timeTicks.length - 1;

    return (
        <div className={styles.rulerWrapper}>
            <div className={styles.rulerMainContainer}>
                <div className={styles.rulerTrackContainer}>
                    {timeTicks.map((tick, index) => {
                        if (index === timeTicks.length - 1) return null;
                        const nextTick = timeTicks[index + 1];

                        return isGap(tick, nextTick) ? (
                            <EmptyRulerBar key={index} />
                        ) : (
                            <RulerBar
                                key={index}
                                barNumber={tick}
                                isLastBar={index === maxBars - 1}
                            />
                        );
                    })}
                </div>
                {currentTick !== undefined &&
                    (
                        <RulerIndicator
                            currentTick={currentTick}
                            timeTicks={timeTicks}
                            tickSize={tickSize}
                        />
                    )
                }
            </div>
        </div>
    );
};

Ruler.propTypes = {
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    currentTick: PropTypes.number,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired
};

export default Ruler;
