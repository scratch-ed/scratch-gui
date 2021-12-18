import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import SliderComponent from '../slider/slider.jsx';

import styles from './debugger-tab.css';

const DebuggerTabComponent = function (props) {
    const {
        breakpoints,
        numberOfFrames,
        onTimeChange,
        onTimeMouseDown,
        onTimeMouseUp,
        onTrailChange,
        onTrailMouseDown,
        onTrailMouseUp,
        running,
        timeFrame,
        trailLength
    } = props;

    const MAX_TRAIL_LENGTH = 50;

    return (
        <Box className={styles.debuggerTab}>
            <label>
                <span>{'Current frame: '}</span>
                <TimeSliderComponent
                    disabled={running}
                    numberOfFrames={numberOfFrames}
                    onChange={onTimeChange}
                    onMouseDown={onTimeMouseDown}
                    onMouseUp={onTimeMouseUp}
                    value={timeFrame}
                />
            </label>
            <label>
                <span>{'Trail length: '}</span>
                <SliderComponent
                    max={MAX_TRAIL_LENGTH}
                    onChange={onTrailChange}
                    onMouseDown={onTrailMouseDown}
                    onMouseUp={onTrailMouseUp}
                    value={trailLength}
                />
            </label>
            <h2>{'Breakpoints: '}</h2>
            <ul>
                {breakpoints.size > 0 ?
                    [...breakpoints].map((blockId, i) => <li key={i}>{blockId}</li>) :
                    <p>{'No breakpoints placed.'}</p>
                }
            </ul>
        </Box>
    );
};

DebuggerTabComponent.propTypes = {
    breakpoints: PropTypes.instanceOf(Set).isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    onTimeChange: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    onTimeMouseUp: PropTypes.func.isRequired,
    onTrailChange: PropTypes.func.isRequired,
    onTrailMouseDown: PropTypes.func.isRequired,
    onTrailMouseUp: PropTypes.func.isRequired,
    running: PropTypes.bool.isRequired,
    timeFrame: PropTypes.number.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default DebuggerTabComponent;
