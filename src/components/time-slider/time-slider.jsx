import React from 'react';

import styles from './time-slider.css';
import PropTypes from 'prop-types';

const TimeSliderComponent = function (props) {
    const {
        onInput,
        onMouseUp,
        onMouseDown
    } = props;

    return (
        <input
            className={styles.timeSliderInput}
            type={'range'}
            onInput={onInput}
            onMouseUp={onMouseUp}
            onMouseDown={onMouseDown}
        />
    );
};

TimeSliderComponent.propTypes = {
    onInput: PropTypes.func.isRequired,
    onMouseUp: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired
};

export default TimeSliderComponent;
