import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import classNames from 'classnames';

import ReactTooltip from 'react-tooltip';

import passedIcon from '../test-results/passed.png';
import failedIcon from '../test-results/failed.png';
import keycapIcon from './keycap.png';
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
    } else {
        start1 = test1.marker.start;
        end1 = test1.marker.end;
    }
    if (typeof test2.marker === 'number') {
        start2 = test2.marker;
        end2 = test2.marker;
    } else {
        start2 = test2.marker.start;
        end2 = test2.marker.end;
    }

    return start1 < end2 + 10 && start2 < end1 + 10;
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

const Band = ({tests, timeframe, tickSize}) => (
    <div className={styles.bandPadding}>
        <div className={styles.lineWrapper}>
            {
                tests.map(test => {
                    if (typeof test.marker !== 'number') {
                        return (
                            <MarkRectangle
                                key={test.id}
                                begin={test.marker.start}
                                end={test.marker.end}
                                timeframe={timeframe}
                                tickSize={tickSize}
                                test={test}
                            />
                        );
                    }
                    return (
                        <Mark
                            key={test.id}
                            timestamp={test.marker}
                            timeframe={timeframe}
                            test={test}
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
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
    })),
    timeframe: PropTypes.number,
    tickSize: PropTypes.number
};


const MarkRectangle = ({begin, end, timeframe, tickSize, test}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${begin / timeframe * 100}%`}}
    >
        <div
            className={styles.rectangleMark}
            style={{width: `${(end - begin) * 100 / tickSize}px`, background: test.passed ? '#77d354' : '#f00d0d',
                borderRadius: '10px'}}
            data-for={test.id}
            data-tip=""
        >{test.feedback ? test.feedback : test.name}
        </div>
    </div>
);

MarkRectangle.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
    }),
    timeframe: PropTypes.number,
    tickSize: PropTypes.number,
    begin: PropTypes.number,
    end: PropTypes.number
};

const Mark = ({timestamp, timeframe, test}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${timestamp / timeframe * 100}%`}}
    >
        <img
            className={styles.markerIcon}
            draggable={false}
            src={test.passed ? passedIcon : failedIcon}
            data-for={test.id}
            data-tip=""
        />
        <ReactTooltip
            className={styles.tooltip}
            effect="solid"
            id={test.id}
            place="top"
        >
            {test.feedback ? test.feedback : test.name}
        </ReactTooltip>
    </div>
);

Mark.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
    }),
    timeframe: PropTypes.number,
    timestamp: PropTypes.number
};

const EventMarker = ({event, index, tickSize}) => {
    if (event.type === 'key') {
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
                        {event.data.key}
                    </div>
                </div>
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={`keypress-${index}`}
                    place="top"
                >
                    {`Pressed '${event.data.key}' key`}
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
                    {`Clicked on ${event.data.target}`}
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
        end: PropTypes.number
    }),
    index: PropTypes.number,
    tickSize: PropTypes.number
};

const Timeline = ({vm, numberOfFrames, timeFrame, setFrame, timestamps, events, markers}) => {
    if (!numberOfFrames) {
        return null;
    }
    const timeframe = timestamps[numberOfFrames - 1];
    const testGroups = separateTests(vm.getMarkedTests());

    let timeTicks = [];
    let tickSize = 10;
    if (timeframe) {
        tickSize = Math.round(timeframe / numberOfFrames / 10) * 8;
        timeTicks = Array(...Array(Math.floor(timeframe / tickSize) + 1)).map((_, index) => index * tickSize);
    }

    return (<div className={styles.scrollWrapper}>
        <div className={styles.scrollDetails}>
            <div className={styles.content}>
                <div className={classNames(styles.lineWrapper, styles.tickHeight)}>
                    {timeTicks.map(tick => (
                        <div
                            key={tick}
                            className={styles.timelineItem}
                            style={{left: `${tick / timeframe * 100}%`}}
                        >{tick}
                        </div>
                    ))}
                </div>

                <div
                    className={styles.lineWrapper}
                    style={{width: `${timeframe / tickSize * 100}px`}}
                >
                    <ul className={styles.line}>
                        {timestamps.map((timestamp, index) => (
                            <div
                                key={index}
                                className={styles.timelineItem}
                                style={{left: `${timestamp / timeframe * 100}%`}}
                            >
                                <li
                                    onClick={() => setFrame(index)}
                                    key={index}
                                    className={classNames(styles.dot, {[styles.active]: index === timeFrame})}
                                />
                            </div>
                        ))}
                    </ul>
                </div>

                <div className={classNames(styles.lineWrapper)}>
                    {
                        events.map((event, index) => (
                            <div
                                key={index}
                                className={styles.timelineItem}
                                style={{left: `${event.timestamp / timeframe * 100}%`}}
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

                {
                    testGroups.map((tests, index) => (
                        <Band
                            className={styles.bandPadding}
                            key={index}
                            tests={tests}
                            timeframe={timeframe}
                            tickSize={tickSize}
                            groupid={`testgroup-${index}`}
                        />
                    ))
                }
            </div>
        </div>
    </div>);
};

Timeline.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    timeFrame: PropTypes.number,
    numberOfFrames: PropTypes.number,
    setFrame: PropTypes.func,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    events: PropTypes.arrayOf(PropTypes.object),
    markers: PropTypes.arrayOf(PropTypes.number)
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
    timestamps: state.scratchGui.timeSlider.timestamps,
    events: state.scratchGui.timeSlider.events,
    markers: state.scratchGui.timeSlider.markers
});

const mapDispatchToProps = dispatch => ({
    setFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timeline);
