import React, {useLayoutEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import classNames from 'classnames';

import Band from './test-markers.jsx';
import Events from './events.jsx';

import styles from './timeline.css';

import {locateActiveBullet, setTimeFrame} from '../../reducers/time-slider.js';

const testsOverlap = (test1, test2) => {
    let start1;
    let end1;
    let start2;
    let end2;
    if (typeof test1.marker === 'number') {
        start1 = test1.marker;
        end1 = test1.marker;
    } else if (Array.isArray(test1.marker)) {
        start1 = test1.marker[0];
        end1 = test1.marker[test1.marker.length - 1];
    } else {
        start1 = test1.marker.start;
        end1 = test1.marker.end;
    }
    if (typeof test2.marker === 'number') {
        start2 = test2.marker;
        end2 = test2.marker;
    } else if (Array.isArray(test2.marker)) {
        start2 = test2.marker[0];
        end2 = test2.marker[test2.marker.length - 1];
    } else {
        start2 = test2.marker.start;
        end2 = test2.marker.end;
    }

    return start1 < end2 + 1 && start2 < end1 + 1;
};

// Sort tests into groups that don't have overlapping markers
const separateTests = tests => {
    const groups = [];

    tests.forEach(test => {
        let placed = false;
        for (const group of groups) {
            if (!group.some(t => testsOverlap(t, test))) {
                group.push(test);
                placed = true;
                break;
            }
        }

        if (!placed) {
            groups.push([test]);
        }
    });

    return groups;
};

const generateTimelineCuts = (timestamps, size) => {
    const cuts = new Set();
    cuts.add(0);

    for (const N of timestamps) {
        const lower = Math.floor(N / size) * size;
        cuts.add(lower);

        const upper = Math.ceil(N / size) * size;
        cuts.add(upper);
    }

    return Array.from(cuts).sort((a, b) => a - b);
};

const getCompressedWidth = (timestamp, ticks, size) => {
    if (ticks.length < 2 || timestamp < ticks[0]) return 0;

    let visibleTimeElapsed = 0;

    let spanFound = false;
    let i = 0;
    while (!spanFound && i < ticks.length - 1 && ticks[i] < timestamp) {
        const startCut = ticks[i];
        const endCut = ticks[i + 1];

        if (timestamp >= endCut) {
            visibleTimeElapsed += size;
        } else {
            const timeIntoSpan = timestamp - startCut;
            visibleTimeElapsed += timeIntoSpan;

            spanFound = true;
        }

        i++;
    }

    return visibleTimeElapsed;
};

const getCompressedPlotPosition = (timestamp, ticks, lastTimeStamp, size) => {
    if (ticks.length < 2 || timestamp < ticks[0]) return 0;

    const visibleTimeElapsed = getCompressedWidth(timestamp, ticks, size);
    const totalVisibleSpan = (size * (ticks.length - 2)) + (lastTimeStamp % size);

    return (visibleTimeElapsed / totalVisibleSpan) * 100;
};

const Timeline = ({
    vm, paused, numberOfFrames, timeFrame: currentFrame, setFrame, timestamps, events,
    zoomLevel, locateActive, onLocateActiveBullet, onBroadcastClick
}) => {
    const [highlight, setHighlight] = useState([]);
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        if ((locateActive || currentFrame !== -1) && containerRef.current) {
            // Small timeout to ensure the DOM is fully updated
            const timer = setTimeout(() => {
                const activeDot = containerRef.current.querySelector(`.${styles.active}`);
                if (activeDot) {
                    activeDot.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
                if (locateActive) {
                    onLocateActiveBullet(false);
                }
            }, 0);

            return () => clearTimeout(timer);
        }
    }, [locateActive, currentFrame, onLocateActiveBullet]);

    if (!numberOfFrames) {
        return null;
    }
    const timeElapsed = timestamps[numberOfFrames - 1];
    const tickSize = Math.round(100 * zoomLevel);
    const timeTicks = generateTimelineCuts(timestamps, tickSize);
    const lastTimeStamp = timestamps[timestamps.length - 1];

    const filteredTests = vm.getMarkedTests()
        .filter(t => {
            if (typeof t.marker === 'number') {
                return t.marker <= timeElapsed;
            } else if (Array.isArray(t.marker)) {
                return t.marker[0] <= timeElapsed;
            }
            return t.marker.start + (tickSize / 2) <= timeElapsed;
        })
        .map(t => {
            if (typeof t.marker === 'number') {
                return t;
            } else if (Array.isArray(t.marker)) {
                return {...t, marker: t.marker.filter(timestamp => timestamp <= timeElapsed)};
            }
            return {...t, marker: {start: t.marker.start, end: Math.min(t.marker.end, timeElapsed)}};
        });
    const testGroups = separateTests(filteredTests);
    const filteredEvents = events.filter(e => e.begin <= timeElapsed).map(e => ({
        ...e, end: Math.min(e.end, timeElapsed)
    }));

    const setFrameIndex = index => {
        if (!paused) {
            vm.runtime.pause();
        }
        setFrame(index);
    };

    const timestampToIndex = timestamps.reduce((map, item, index) => {
        map[item] = index;
        return map;
    }, {});

    const setFrameMark = timestamp => {
        if (!paused) {
            vm.runtime.pause();
        }
        setFrame(timestampToIndex[timestamp]);
    };

    const setFrameRange = (start, end) => {
        if (!paused) {
            vm.runtime.pause();
        }
        const index1 = timestampToIndex[start];
        const index2 = timestampToIndex[end];
        if (currentFrame < index1 || currentFrame >= index2) {
            setFrame(index1);
        } else {
            setFrame(currentFrame + 1);
        }
    };

    const clearHighlighting = () => setHighlight([]);
    const highlightFrames = frames => setHighlight(frames);
    const highlightFrameRange = (frame1, frame2) => {
        setHighlight(timestamps.filter(t => t >= frame1 && t <= frame2));
    };

    return (<div className={styles.flexRow} ref={containerRef}>
        <div className={styles.scrollDetails}>
            <div className={styles.content}>
                <div className={classNames(styles.flexRow, styles.tickHeight)}>
                    {timeTicks.slice(0, -1).map(tick => (
                        <div
                            key={tick}
                            className={styles.timelineItem}
                            style={{left: `${getCompressedPlotPosition(tick, timeTicks, lastTimeStamp, tickSize)}%`}}
                        >{tick}
                        </div>
                    ))}
                </div>

                <div
                    className={styles.flexRow}
                    style={{width: `${(timeTicks.length - 2) * 100}px`}}
                >
                    <ul className={styles.line}>
                        {timestamps.map((timestamp, index) => (
                            <div
                                key={index}
                                className={classNames(styles.timelineItem, {
                                    // Highlight frames when hovering over items
                                    [styles.highlightFrame]: highlight.includes(timestamp)
                                })}
                                style={{left: `${getCompressedPlotPosition(timestamp, timeTicks, lastTimeStamp, tickSize)}%`}}
                            >
                                <li
                                    onClick={() => setFrameIndex(index)}
                                    key={index}
                                    className={classNames(styles.dot, {[styles.active]: index === currentFrame})}
                                />
                            </div>
                        ))}
                    </ul>
                </div>

                <Events
                    events={filteredEvents}
                    // timeElapsed={timeElapsed}
                    mapTime={(timestamp) => getCompressedPlotPosition(timestamp, timeTicks, lastTimeStamp, tickSize)}
                    setFrameRange={setFrameRange}
                    clearHighlighting={clearHighlighting}
                    highlightFrameRange={highlightFrameRange}
                    onBroadcastClick={onBroadcastClick}
                />

                {
                    testGroups.map((tests, index) => (
                        <Band
                            key={index}
                            tests={tests}
                            mapTime={(timestamp) => getCompressedPlotPosition(timestamp, timeTicks, lastTimeStamp, tickSize)}
                            mapWidth={(timestamp) => getCompressedWidth(timestamp, timeTicks, tickSize)}
                            tickSize={tickSize}
                            groupid={`testgroup-${index}`}
                            setFrameMark={setFrameMark}
                            setFrameRange={setFrameRange}
                            clearHighlighting={clearHighlighting}
                            highlightFrames={highlightFrames}
                            highlightFrameRange={highlightFrameRange}
                        />
                    ))
                }
            </div>
        </div>
    </div>);
};

Timeline.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    paused: PropTypes.bool,
    timeFrame: PropTypes.number,
    numberOfFrames: PropTypes.number,
    setFrame: PropTypes.func,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    events: PropTypes.arrayOf(PropTypes.object),
    zoomLevel: PropTypes.number,
    locateActive: PropTypes.bool,
    onLocateActiveBullet: PropTypes.func,
    onBroadcastClick: PropTypes.func
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    paused: state.scratchGui.timeSlider.paused,
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

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timeline);
