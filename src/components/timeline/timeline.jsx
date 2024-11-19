import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import classNames from 'classnames';

import ReactTooltip from 'react-tooltip';

import TestComponent from '../test-results/test-component.jsx';

import passedIcon from '../test-results/passed.png';
import failedIcon from '../test-results/failed.png';
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

const Timeline = ({numberOfFrames, timeFrame, renders, setFrame, timestamps, markers}) => {
    const timeframe = timestamps[numberOfFrames - 1];

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
                <div className={styles.timelinePadding}>
                    {
                        // timestamps.map((timestamp, index) => (
                        //     <Marker
                        //         tests={markers[index]}
                        //         onClick={() => setFrame(index)}
                        //         id={`timeline-tooltip-${index}`}
                        //     />
                        // )
                    }
                </div>
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

Timeline.propTypes = {
    timeFrame: PropTypes.number,
    numberOfFrames: PropTypes.number,
    renders: PropTypes.arrayOf(PropTypes.string),
    setFrame: PropTypes.func,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    markers: PropTypes.arrayOf(PropTypes.number)
};

const mapStateToProps = state => ({
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
    renders: state.scratchGui.timeSlider.renders,
    timestamps: state.scratchGui.timeSlider.timestamps,
    markers: state.scratchGui.timeSlider.markers
});

const mapDispatchToProps = dispatch => ({
    setFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timeline);
