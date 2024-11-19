import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import classNames from 'classnames';

import ReactTooltip from 'react-tooltip';

import TestComponent from '../test-results/test-component.jsx';

import passedIcon from '../test-results/passed.png';
import failedIcon from '../test-results/failed.png';
import keypressIcon from './keypress.png';
import mouseClickIcon from './mouseClick.png';
import styles from './timeline.css';

import {setTimeFrame} from '../../reducers/time-slider.js';

const Marker = ({tests, onClick, id}) => (
    (tests && tests.length > 0) ? (
        <>
            <img
                className={styles.markerIcon}
                draggable={false}
                src={tests.every(test => test.passed) ? passedIcon : failedIcon}
                onClick={onClick}
                data-for={id}
                data-tip=""
            />
            <ReactTooltip
                className={styles.tooltip}
                effect="solid"
                id={id}
                place="top"
            >
                {tests.map(test => (
                    <TestComponent
                        {...test}
                        key={test.id}
                    />))
                }
            </ReactTooltip>
        </>
    ) : null);

Marker.propTypes = {
    tests: PropTypes.arrayOf(PropTypes.object),
    onClick: PropTypes.func,
    id: PropTypes.string
};

const Timeline = ({vm, numberOfFrames, timeFrame, renders, setFrame, timestamps, events, markers}) => {
    const testTimestamp = Math.max.apply(Math, vm.getMarkedTests().map(test => test.marker));
    const eventTimestamp = Math.max.apply(Math, events.map(event => event.end));
    const timeframe = Math.max(timestamps[numberOfFrames - 1], testTimestamp, eventTimestamp);
    let testGroups = Object.groupBy(vm.getMarkedTests(), ({parent}) => parent);
    testGroups = Object.values(testGroups).map(group => Object.groupBy(group, ({marker}) => marker));

    return (<div className={styles.scrollWrapper}>
        <div className={styles.scrollDetails}>
            <div className={styles.content}>
                <div className={styles.linePadding}>
                    <ul className={styles.line}>
                        {timestamps.map((timestamp, index) => (
                            <div
                                key={index}
                                style={{position: 'relative', left: `${timestamp / timeframe * 100}%`, width: 0, height: 0}}
                            >
                                <li
                                    onClick={() => setFrame(index)}
                                    key={index}
                                    className={classNames(styles.dot, {[styles.active]: index === timeFrame})}
                                >{timestamp}</li>
                            </div>
                        ))}
                    </ul>
                </div>
                <div className={styles.linePadding}>
                    {
                        events.map((event, index) => (
                            <div
                                key={index}
                                style={{position: 'relative', left: `${event.begin / timeframe * 100}%`, width: 0, height: 0}}
                            >
                                <EventMarker event={event} index={index} />
                            </div>
                        ))
                    }
                </div>
                {
                    testGroups.map((group, index) => (
                        <Line key={index} group={group} groupName={Object.values(group)[0][0].parentName} timeframe={timeframe} groupid={`testgroup-${index}`}/>
                    ))
                }
                <div className={styles.container}>
                    {renders.slice(0, numberOfFrames).map((render, index) => (
                        <div key={index}>
                            <img
                                onClick={() => setFrame(index)}
                                className={styles.render}
                                src={render}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>);
};

const Line = ({group, groupName, timeframe, groupid}) => (
    <div className={styles.timelinePadding}>
        <div
            style={{position: 'absolute', left: '0'}}
        >{groupName}
        </div>
        {
            Object.entries(group).map(([timestamp, tests], index) => (
                <div
                    key={index}
                    style={{position: 'relative', left: `${timestamp / timeframe * 100}%`, width: 0, height: 0}}
                >
                    <img
                        className={styles.markerIcon}
                        draggable={false}
                        src={tests.every(test => test.passed) ? passedIcon : failedIcon}
                        data-for={`${groupid}-${timestamp}`}
                        data-tip=""
                    />
                    <ReactTooltip
                        className={styles.tooltip}
                        effect="solid"
                        id={`${groupid}-${timestamp}`}
                        place="top"
                    >
                        {tests.map(test => (
                            <TestComponent
                                {...test}
                                key={test.id}
                            />))
                        }
                    </ReactTooltip>
                </div>
            ))
        }
    </div>
)

const EventMarker = ({event, index}) => {
    if (event.type === 'key') {
        return (
            <>
                <img
                    className={styles.eventIcon}
                    draggable={false}
                    src={keypressIcon}
                    data-for={`keypress-${index}`}
                    data-tip=""
                />
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={`keypress-${index}`}
                    place="top"
                >
                    {`Pressed '${event.data.key}' key`}
                </ReactTooltip>
            </>
        )
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
        )
    }
    return null;
}


Timeline.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    timeFrame: PropTypes.number,
    numberOfFrames: PropTypes.number,
    renders: PropTypes.arrayOf(PropTypes.string),
    setFrame: PropTypes.func,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    events: PropTypes.arrayOf(PropTypes.object),
    markers: PropTypes.arrayOf(PropTypes.number)
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
    renders: state.scratchGui.timeSlider.renders,
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
