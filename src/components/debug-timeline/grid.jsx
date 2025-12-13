import React from 'react';
import PropTypes from 'prop-types';
import {BAR_WIDTH, SUB_BAR_NUM} from './constants.ts';
import styles from './debug-timeline.css';

const EmptyGridItem = () => (
    <div
        className={styles.gridEmpty}
        style={{width: `${BAR_WIDTH}px`}}
    >
        <p>{'...'}</p>
    </div>
);

const GridItem = ({startTick, currentSubBar, tickSize}) => {
    const width = tickSize / SUB_BAR_NUM;
    const currentTick = startTick + (currentSubBar * width);

    return (
        <div
            className={styles.gridItem}
            title={`${currentTick}-${currentTick + width}`}
        >
            <div className="mix-grid-item-content" />
        </div>
    );
};

GridItem.propTypes = {
    startTick: PropTypes.number.isRequired,
    currentSubBar: PropTypes.number.isRequired,
    tickSize: PropTypes.number.isRequired
};

const Grid = ({
    timeTicks,
    tickSize,
    isGap
}) => {
    const colorClass = index => (index % 2 === 0 ? styles.colorEven : styles.colorOdd);

    return (
        <div className={styles.gridContainer}>
            {timeTicks.map((tick, index) => {
                if (index === timeTicks.length - 1) return null;

                const nextTick = timeTicks[index + 1];
                const isLastBar = timeTicks.length - 2 === index;

                return (
                    <div
                        key={index}
                        className={`${styles.gridBar} ${colorClass(index)} ${isLastBar ? styles.gridBarLast : ''}`}
                        style={{width: `${BAR_WIDTH}px`}}
                    >
                        {isGap(tick, nextTick) ? (
                            <EmptyGridItem />
                        ) : (
                            <div className={styles.gridSubbarRow}>
                                {Array.from({length: SUB_BAR_NUM}).map((_, subBarIndex) => (
                                    <GridItem
                                        key={subBarIndex}
                                        startTick={tick}
                                        currentSubBar={subBarIndex}
                                        tickSize={tickSize}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

Grid.propTypes = {
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired
};

export default Grid;
