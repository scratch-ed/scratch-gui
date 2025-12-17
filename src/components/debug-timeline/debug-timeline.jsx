import React from 'react';
import {connect} from 'react-redux';
import Ruler from './ruler.jsx';
import ActiveBarRow from './active-bar-row.jsx';
import Grid from './grid.jsx';
import {EVENT_TYPES} from './constants.ts';
import styles from './debug-timeline.css';
import Category from './category.jsx';
import PropTypes from 'prop-types';
import {locateActiveBullet} from '../../reducers/time-slider';

const getCategories = activeThreads => {
    const names = [];

    for (const value of activeThreads.values()) {
        const codeName = value[0].topBlockName;
        names.push(EVENT_TYPES[codeName]);
    }

    return names;
};

const generateTimelineCuts = (activeThreads, size) => {
    let combined = Array.from(activeThreads.values()).flatMap(activeList =>
        activeList.map(activeElement => [activeElement.start, activeElement.end])
    );

    if (combined.length === 0) {
        return [];
    }

    combined = combined.sort((a, b) => {
        if (a[0] === b[0]) {
            return a[1] - b[1];
        }

        return a[0] - b[0];
    });

    const activeRange = [];
    activeRange.push(combined[0]);

    let currentEnd = combined[0][1];
    for (let index = 1; index < combined.length; index++) {
        const element = combined[index];

        if (element[0] <= currentEnd) {
            currentEnd = Math.max(currentEnd, element[1]);
            activeRange[activeRange.length - 1][1] = currentEnd;
        } else {
            activeRange.push(element);
            currentEnd = element[1];
        }
    }

    const timeTicks = new Set();
    timeTicks.add(0);

    for (const timeRange of activeRange) {
        const lower = Math.floor(timeRange[0] / size) * size;
        timeTicks.add(lower);

        const upper = Math.ceil(timeRange[1] / size) * size;
        timeTicks.add(upper);

        for (let valueInRange = lower + size; valueInRange < upper; valueInRange += size) {
            timeTicks.add(valueInRange);
        }

    }

    return Array.from(timeTicks).sort((a, b) => a - b);
};

const DebugTimeline = ({
    activeThreads, zoomLevel, timeFrame, timestamps, events, locateActive, onLocateActiveBullet
}) => {
    const categories = getCategories(activeThreads);

    const tickSize = Math.round(100 * zoomLevel);
    const timeTicks = generateTimelineCuts(activeThreads, tickSize);

    const isGap = (tick, nextTick) => {
        return Math.abs((nextTick - tick) - tickSize) > 1e-12;
    };

    return (
        <div className={styles.flexRow}>
            <div className={styles.scrollDetails}>
                <div className={styles.content}>
                    <div className={styles.debug}>
                        <div className={styles.categoryListContainer}>
                            <Category categories={categories} />
                        </div>
                        <div>
                            <Ruler
                                timeTicks={timeTicks}
                                currentTick={timestamps[timeFrame]}
                                tickSize={tickSize}
                                isGap={isGap}
                            />
                            <div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                {Array.from(activeThreads.entries()).map(([threadId, threadList]) => (
                                    <div
                                        key={`track-container-${threadId}`}
                                        className={styles.trackContainer}
                                    >
                                        <Grid
                                            key={`${threadId}-grid`}
                                            timeTicks={timeTicks}
                                            tickSize={tickSize}
                                            isGap={isGap}
                                        />
                                        {threadList.map((threadData, index) => (
                                            <ActiveBarRow
                                                key={`${threadId}-${index}-track`}
                                                activeThread={threadData}
                                                timeTicks={timeTicks}
                                                tickSize={tickSize}
                                                onSelectBar={() => {}}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

DebugTimeline.propTypes = {
    activeThreads: PropTypes.instanceOf(Map).isRequired,
    timeFrame: PropTypes.number,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    events: PropTypes.arrayOf(PropTypes.object),
    zoomLevel: PropTypes.number,
    locateActive: PropTypes.bool,
    onLocateActiveBullet: PropTypes.func
};

const mapStateToProps = state => ({
    activeThreads: state.scratchGui.timeSlider.activeThreads,
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    timestamps: state.scratchGui.timeSlider.timestamps,
    events: state.scratchGui.timeSlider.events,
    zoomLevel: state.scratchGui.timeSlider.zoomLevel,
    locateActive: state.scratchGui.timeSlider.locateActiveBullet,
});

const mapDispatchToProps = dispatch => ({
    onLocateActiveBullet: locate => dispatch(locateActiveBullet(locate))
});

export default connect(mapStateToProps, mapDispatchToProps)(DebugTimeline);
