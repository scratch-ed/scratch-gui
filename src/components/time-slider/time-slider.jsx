import React from 'react';
import PropTypes from 'prop-types';

import styles from './time-slider.css';

import SliderComponent from '../slider/slider.jsx';

const TimeSliderComponent = function (props) {
    const {
        numberOfFrames,
        ...componentProps
    } = props;

    return (
        <SliderComponent
            {...componentProps}
            className={styles.timeSlider}
            max={Math.max(0, numberOfFrames - 1)}
        />
    );
};

TimeSliderComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired
};

export default TimeSliderComponent;
