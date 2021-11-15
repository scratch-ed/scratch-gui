import React from 'react';

import styles from './time-slider.css';
import PropTypes from 'prop-types';

const TimeSliderComponent = function (props) {
    const {
        onInput,
        onMouseDown,
        onMouseUp,
        numberOfFrames,
        timeFrame,
        timeSliderDisabled,
        ...componentProps
    } = props;

    return (
        <input
            {...componentProps}
            disabled={timeSliderDisabled}
            className={styles.timeSliderInput}
            type={'range'}
            onInput={onInput}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            defaultValue={timeFrame}
            min={'0'}
            max={numberOfFrames - 1}
        />
    );
};

TimeSliderComponent.propTypes = {
    onInput: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onMouseUp: PropTypes.func.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    timeFrame: PropTypes.string.isRequired,
    timeSliderDisabled: PropTypes.bool.isRequired
};

export default TimeSliderComponent;
