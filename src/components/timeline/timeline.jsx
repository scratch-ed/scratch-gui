import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import classNames from 'classnames';

import ReactTooltip from 'react-tooltip';

import passedIcon from '../test-results/passed.png';
import failedIcon from '../test-results/failed.png';
import keycapIcon from './keycap.png';
import broadcastIcon from './broadcast.png';
import mouseClickIcon from './mouseClick.png';
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

const TestTooltip = ({test}) => (
    <ReactTooltip
        className={styles.tooltip}
        effect="solid"
        id={test.id}
        place="top"
    >
        {test.feedback ? test.feedback : test.name}
    </ReactTooltip>
);

TestTooltip.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool
    })
};

const MarkMultiple = ({timestamps, timeElapsed, test, handleClick}) => (
    <div className={styles.flexRow}>
        {timestamps.map(timestamp => (
            <div
                key={timestamp}
                className={styles.timelineItem}
                style={{left: `${timestamp / timeElapsed * 100}%`}}
                onClick={() => handleClick(timestamp)}
            >
                <div
                    className={styles.markMultiple}
                    style={{background: test.passed ? '#77d354' : '#f00d0d'}}
                    data-for={test.id}
                    data-tip=""
                />
                <TestTooltip test={test} />
            </div>
        ))}
    </div>
);

MarkMultiple.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    }),
    timeElapsed: PropTypes.number,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    handleClick: PropTypes.func
};

const MarkRectangle = ({begin, end, timeElapsed, tickSize, test, handleClick}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${begin / timeElapsed * 100}%`}}
        onClick={handleClick}
    >
        <div
            className={styles.markRectangle}
            style={{
                width: `${(end - begin) * 100 / tickSize}px`,
                background: test.passed ? '#77d354' : '#f00d0d'
            }}
            data-for={test.id}
            data-tip=""
        >{test.feedback ? test.feedback : test.name}
        </div>
        <TestTooltip test={test} />
    </div>
);

MarkRectangle.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    }),
    timeElapsed: PropTypes.number,
    tickSize: PropTypes.number,
    begin: PropTypes.number,
    end: PropTypes.number,
    handleClick: PropTypes.func
};

const Mark = ({timestamp, timeElapsed, test, handleClick}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${timestamp / timeElapsed * 100}%`}}
        onClick={handleClick}
    >
        <img
            className={styles.markerIcon}
            draggable={false}
            src={test.passed ? passedIcon : failedIcon}
            data-for={test.id}
            data-tip=""
        />
        <TestTooltip test={test} />
    </div>
);

Mark.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    }),
    timeElapsed: PropTypes.number,
    timestamp: PropTypes.number,
    handleClick: PropTypes.func
};

const Band = ({tests, timeElapsed, tickSize, setFrameMark, setFrameRange}) => (
    <div className={styles.bandPadding}>
        <div className={styles.flexRow}>
            {
                tests.map(test => {
                    if (typeof test.marker === 'number') {
                        return (
                            <Mark
                                key={test.id}
                                timestamp={test.marker}
                                timeElapsed={timeElapsed}
                                test={test}
                                handleClick={() => setFrameMark(test.marker)}
                            />
                        );
                    } else if (Array.isArray(test.marker)) {
                        return (
                            <MarkMultiple
                                key={test.id}
                                timestamps={test.marker}
                                timeElapsed={timeElapsed}
                                test={test}
                                handleClick={setFrameMark}
                            />
                        );
                    }
                    return (
                        <MarkRectangle
                            key={test.id}
                            begin={test.marker.start}
                            end={test.marker.end}
                            timeElapsed={timeElapsed}
                            tickSize={tickSize}
                            test={test}
                            handleClick={() => setFrameRange(test.marker.start, test.marker.end)}
                        />
                    );
                })
            }
        </div>
    </div>
);

Band.propTypes = {
    tests: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    })),
    timeElapsed: PropTypes.number,
    tickSize: PropTypes.number,
    setFrameMark: PropTypes.func,
    setFrameRange: PropTypes.func
};

const eventSeenMessage = (event, formatter) => {
    if (event.sprites.length > 0) {
        return `${formatter.format(event.sprites)} reacted`;
    }
    return `...but nothing happened`;
};

const EventMarker = ({event, index, tickSize}) => {
    const formatter = new Intl.ListFormat('en', {style: 'long', type: 'conjunction'});

    if (event.type === 'key') {
        let key;
        let text;
        switch (event.data.key) {
        case ' ':
        case 'SPACE':
            key = ' ';
            text = 'Space';
            break;
        case 'ArrowLeft':
        case 'LEFT ARROW':
            key = '⬅';
            text = 'Left Arrow';
            break;
        case 'ArrowRight':
        case 'RIGHT ARROW':
            key = '➡';
            text = 'Right Arrow';
            break;
        case 'ArrowUp':
        case 'UP ARROW':
            key = '⬆';
            text = 'Up Arrow';
            break;
        case 'ArrowDown':
        case 'DOWN ARROW':
            key = '⬇';
            text = 'Down Arrow';
            break;
        default:
            key = event.data.key.toUpperCase();
            text = event.data.key.toUpperCase();
        }
        return (
            <>
                <div
                    data-for={`keypress-${index}`}
                    data-tip=""
                >
                    <img
                        className={styles.eventIcon}
                        draggable={false}
                        src={keycapIcon}
                    />
                    <div
                        className={styles.eventKeyData}
                    >
                        {key}
                    </div>
                </div>
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={`keypress-${index}`}
                    place="top"
                >
                    <div>{`The '${text}' key was pressed`}</div>
                    <div>{eventSeenMessage(event, formatter)}</div>
                </ReactTooltip>
                {
                    // <div
                    //     style={{width: `${(event.end - event.begin) * 100 / tickSize}px`, height: '5px', background: 'grey',
                    //         borderRadius: '3px', transform: 'translatey(-15px)'}}
                    //     data-for={`keypress-${index}`}
                    //     data-tip=""
                    // />
                }
            </>
        );
    }
    if (event.type === 'click') {
        return (
            <>
                <img
                    className={styles.eventIcon}
                    draggable={false}
                    src={mouseClickIcon}
                    data-for={`mouseClick-${index}`}
                    data-tip=""
                />
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={`mouseClick-${index}`}
                    place="top"
                >
                    <div>{`Clicked on ${event.data.target}`}</div>
                    <div>{eventSeenMessage(event, formatter)}</div>
                </ReactTooltip>
            </>
        );
    }
    return null;
};

EventMarker.propTypes = {
    event: PropTypes.shape({
        type: PropTypes.string,
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.object,
        begin: PropTypes.number,
        end: PropTypes.number,
        sprites: PropTypes.arrayOf(PropTypes.string)
    }),
    index: PropTypes.number,
    tickSize: PropTypes.number
};

const broadcastMessage = (event, formatter) => {
    if (event.sprites.length > 0) {
        return `Broadcast '${event.data.name}' received by ${formatter.format(event.sprites)}`;
    }
    return `Broadcast '${event.data.name}' was sent, but no one was there to receive it`;
};

const Events = ({events, timeElapsed, tickSize}) => {
    const formatter = new Intl.ListFormat('en', {style: 'long', type: 'conjunction'});

    const clickAndKeyEvents = events.filter(e => e.type === 'key' || e.type === 'click');
    const broadcastEvents = events.filter(e => e.type === 'broadcast');

    return (
        <>
            <div className={classNames(styles.flexRow)}>
                {
                    clickAndKeyEvents.map((event, index) => (
                        <div
                            key={index}
                            className={styles.timelineItem}
                            style={{left: `${event.timestamp / timeElapsed * 100}%`}}
                        >
                            <EventMarker
                                event={event}
                                index={index}
                                tickSize={tickSize}
                            />
                        </div>
                    ))
                }
            </div>
            <div className={classNames(styles.flexRow)}>
                {
                    broadcastEvents.map((event, index) => (
                        <div
                            key={index}
                            className={styles.timelineItem}
                            style={{left: `${event.timestamp / timeElapsed * 100}%`}}
                        >
                            <div
                                data-for={`broadcast-${index}`}
                                data-tip=""
                            >
                                <img
                                    className={styles.eventIcon}
                                    draggable={false}
                                    src={broadcastIcon}
                                />
                            </div>
                            <ReactTooltip
                                className={styles.tooltip}
                                effect="solid"
                                id={`broadcast-${index}`}
                                place="top"
                            >
                                {broadcastMessage(event, formatter)}
                            </ReactTooltip>
                        </div>
                    ))
                }
            </div>
        </>
    );
};

Events.propTypes = {
    events: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string,
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.object,
        begin: PropTypes.number,
        end: PropTypes.number,
        sprites: PropTypes.arrayOf(PropTypes.string)
    })),
    timeElapsed: PropTypes.number,
    tickSize: PropTypes.number
};

const Timeline = ({vm, paused, numberOfFrames, timeFrame: currentFrame, setFrame, timestamps, events}) => {
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
                                className={styles.timelineItem}
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
                    tickSize={tickSize}
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
