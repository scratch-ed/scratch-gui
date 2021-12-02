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
        disabled,
        ...componentProps
    } = props;

    return (
        <input
            {...componentProps}
            className={styles.timeSliderInput}
            type={'range'}
            value={timeFrame}
            min={'0'}
            max={numberOfFrames - 1}
            disabled={disabled}
            onChange={onInput}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
        />
    );
};

TimeSliderComponent.propTypes = {
    disabled: PropTypes.bool.isRequired,
    onInput: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onMouseUp: PropTypes.func.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    timeFrame: PropTypes.number.isRequired
};

export default TimeSliderComponent;
