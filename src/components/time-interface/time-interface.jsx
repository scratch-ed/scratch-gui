import React from 'react';
import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import PropTypes from 'prop-types';

import styles from './time-interface.css';

const TimeInterfaceComponent = function (props) {
    const {
        numberOfFrames,
        onTimeChange,
        onTimeMouseDown,
        onTimeMouseUp,
        timeFrame
    } = props;

    return (
        <Box className={styles.timeInterface}>
            <TimeSliderComponent
                numberOfFrames={numberOfFrames}
                onChange={onTimeChange}
                onMouseDown={onTimeMouseDown}
                onMouseUp={onTimeMouseUp}
                timeFrame={timeFrame}
            />
        </Box>
    );
};

TimeInterfaceComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    onTimeChange: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    onTimeMouseUp: PropTypes.func.isRequired,
    timeFrame: PropTypes.number.isRequired
};

export default TimeInterfaceComponent;
