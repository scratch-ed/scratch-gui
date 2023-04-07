import React from 'react';
import PropTypes from 'prop-types';

import styles from './time-slider.css';

const TimeSliderComponent = function (props) {
    const {
        numberOfFrames,
        timeFrame,
        disabled,
        ...componentProps
    } = props;

    return (
        <input
            {...componentProps}
            className={styles.timeSlider}
            type={'range'}
            min={'0'}
            max={Math.max(0, numberOfFrames - 1)}
            value={timeFrame}
            disabled={disabled}
        />
    );
};

TimeSliderComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    timeFrame: PropTypes.number.isRequired,
    disabled: PropTypes.bool.isRequired
};

export default TimeSliderComponent;
