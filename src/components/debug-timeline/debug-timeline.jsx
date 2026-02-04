import React, {useEffect, useRef} from 'react';
import {connect} from 'react-redux';
import Ruler from './ruler.jsx';
import Row from './row.jsx';
import ActiveBarRow from './active-bar-row.jsx';
import {EVENT_INFO} from './constants.ts';
import styles from './debug-timeline.css';
import Category from './category.jsx';
import PropTypes from 'prop-types';
import {locateActiveBullet, setTimeFrame} from '../../reducers/time-slider';
import EventsBarRow from './events-bar-row.jsx';
import GridProvider from './grid-provider.jsx';
import VM from "scratch-vm";

const getCategories = (activeThreads, hasEvents) => {
    const names = [];

    if (hasEvents) {
        names.push({
            ...EVENT_INFO.events,
            options: {}
        });
    }

    for (const value of activeThreads.values()) {
        const codeName = value.periods[0].topBlockName;
        const category = EVENT_INFO[codeName];
        names.push({
            ...category,
            options: value.options
        });
    }

    return names;
};

const timelineFiller = (timeTicks, minElements, size) => {
    if (timeTicks.length >= minElements) {
        return timeTicks;
    }

    const result = [...timeTicks];

    // add elements before the first element (apart from the standard 0), must be bigger than 0
    let addedToLeft = 0;
    const firstElement = result[1];
    while (result.length < minElements && firstElement - ((addedToLeft + 1) * size) >= 0) {
        result.unshift(firstElement - ((addedToLeft + 1) * size));
        addedToLeft++;
    }

    // add elements after the last element
    let addedToRight = 0;
    const lastElement = result[result.length - 1];
    while (result.length < minElements) {
        const newElement = lastElement + ((addedToRight + 1) * size);
        if (!result.includes(newElement)) {
            result.push(newElement);
        }
        addedToRight++;
    }

    return result.sort((a, b) => a - b);
};

const generateTimelineCuts = (activeThreads, events, timestampEnd, size) => {
    let combined = Array.from(activeThreads.values()).flatMap(threadData =>
        threadData.periods.map(activeElement => [activeElement.start, activeElement.end])
    );

    if (events && events.length > 0) {
        // add the last event to the combined array to make sure no icon is out of bounds
        combined.push([events[events.length - 1].begin, events[events.length - 1].end]);
    }

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

    timeTicks.add(timestampEnd);

    const ticks = Array.from(timeTicks).sort((a, b) => a - b);
    return timelineFiller(ticks, 12, size);
};

const DebugTimeline = ({
    vm, paused, activeThreads, zoomLevel, timeFrame, timestamps, events, locateActive, setFrame, onLocateActiveBullet
}) => {
    const categories = getCategories(activeThreads, events !== null && events.length > 0);

    const tickSize = Math.round(100 * zoomLevel);

    const timestampEnd = Math.ceil(timestamps[timestamps.length - 1] / tickSize) * tickSize;
    const timeTicks = generateTimelineCuts(activeThreads, events, timestampEnd, tickSize);

    const timestampToIndex = timestamps.reduce((map, item, index) => {
        map[item] = index;
        return map;
    }, {});

    const setFrameRange = (start, end) => {
        if (!paused) {
            vm.runtime.pause();
        }
        const index1 = timestampToIndex[start];
        const index2 = timestampToIndex[end];
        if (timeFrame < index1 || timeFrame >= index2) {
            setFrame(index1);
        } else {
            setFrame(timeFrame + 1);
        }
    };

    const isGap = (tick, nextTick) => {
        return Math.abs((nextTick - tick) - tickSize) > 1e-12;
    };

    const rulerIndicatorRef = useRef(null);
    useEffect(() => {
        if ((locateActive || timeFrame !== -1) && rulerIndicatorRef.current) {
            const timer = setTimeout(() => {
                const rulerIndicator = rulerIndicatorRef.current.querySelector(`.${styles.rulerThumb}`);
                if (rulerIndicator !== null) {
                    rulerIndicator.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
                if (locateActive) {
                    onLocateActiveBullet(false);
                }
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [locateActive, timeFrame, onLocateActiveBullet]);

    return (
        <div className={styles.flexRow} ref={rulerIndicatorRef}>
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
                                <GridProvider
                                    timeTicks={timeTicks}
                                    tickSize={tickSize}
                                    isGap={isGap}
                                >
                                    <Row
                                        id={'events'}
                                    >
                                        <EventsBarRow
                                            events={events || []}
                                            timeTicks={timeTicks}
                                            tickSize={tickSize}
                                        />
                                    </Row>
                                    {Array.from(activeThreads.entries()).map(([threadId, {periods}]) => (
                                        <Row
                                            key={`row-${threadId}`}
                                            id={threadId}
                                        >
                                            <ActiveBarRow
                                                threadId={threadId}
                                                periods={periods}
                                                timeTicks={timeTicks}
                                                tickSize={tickSize}
                                                onSelectBar={setFrameRange}
                                            />
                                        </Row>
                                    ))}
                                </GridProvider>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

DebugTimeline.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    paused: PropTypes.bool,
    activeThreads: PropTypes.instanceOf(Map).isRequired,
    timeFrame: PropTypes.number,
    numberOfFrames: PropTypes.number,
    setFrame: PropTypes.func,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    events: PropTypes.arrayOf(PropTypes.object),
    zoomLevel: PropTypes.number,
    locateActive: PropTypes.bool,
    onLocateActiveBullet: PropTypes.func
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    paused: state.scratchGui.timeSlider.paused,
    activeThreads: state.scratchGui.timeSlider.activeThreads,
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
    timestamps: state.scratchGui.timeSlider.timestamps,
    events: state.scratchGui.timeSlider.events,
    zoomLevel: state.scratchGui.timeSlider.zoomLevel,
    locateActive: state.scratchGui.timeSlider.locateActiveBullet,
});

const mapDispatchToProps = dispatch => ({
    setFrame: timeFrame => dispatch(setTimeFrame(timeFrame)),
    onLocateActiveBullet: locate => dispatch(locateActiveBullet(locate))
});

export default connect(mapStateToProps, mapDispatchToProps)(DebugTimeline);
