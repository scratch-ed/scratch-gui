import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import classNames from 'classnames';

import Band from './test-markers.jsx';
import Events from './events.jsx';

import styles from './timeline.css';

import {setTimeFrame} from '../../reducers/time-slider.js';

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

const Timeline = ({vm, paused, numberOfFrames, timeFrame: currentFrame, setFrame, timestamps, events}) => {
    const [highlight, setHighlight] = useState([]);

    if (!numberOfFrames) {
        return null;
    }
    const timeElapsed = timestamps[numberOfFrames - 1];
    let timeTicks = [];
    let tickSize = 10;
    if (timeElapsed) {
        tickSize = (Math.round(timeElapsed / numberOfFrames / 10) + 1) * 10;
        timeTicks = Array(...Array(Math.floor(timeElapsed / tickSize) + 1)).map((_, index) => index * tickSize);
    }

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

    return (<div className={styles.flexRow}>
        <div className={styles.scrollDetails}>
            <div className={styles.content}>
                <div className={classNames(styles.flexRow, styles.tickHeight)}>
                    {timeTicks.map(tick => (
                        <div
                            key={tick}
                            className={styles.timelineItem}
                            style={{left: `${tick / timeElapsed * 100}%`}}
                        >{tick}
                        </div>
                    ))}
                </div>

                <div
                    className={styles.flexRow}
                    style={{width: `${timeElapsed / tickSize * 100}px`}}
                >
                    <ul className={styles.line}>
                        {timestamps.map((timestamp, index) => (
                            <div
                                key={index}
                                className={classNames(styles.timelineItem, {
                                    // Highlight frames when hovering over items
                                    [styles.highlightFrame]: highlight.includes(timestamp)
                                })}
                                style={{left: `${timestamp / timeElapsed * 100}%`}}
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
                    timeElapsed={timeElapsed}
                    setFrameRange={setFrameRange}
                    clearHighlighting={clearHighlighting}
                    highlightFrameRange={highlightFrameRange}
                />

                {
                    testGroups.map((tests, index) => (
                        <Band
                            className={styles.bandPadding}
                            key={index}
                            tests={tests}
                            timeElapsed={timeElapsed}
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
    events: PropTypes.arrayOf(PropTypes.object)
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    paused: state.scratchGui.timeSlider.paused,
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
    timestamps: state.scratchGui.timeSlider.timestamps,
    events: state.scratchGui.timeSlider.events
});

const mapDispatchToProps = dispatch => ({
    setFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timeline);
