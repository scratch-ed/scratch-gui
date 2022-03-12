import React from 'react';
import PropTypes from 'prop-types';

import styles from './time-slider.css';

const TimeSliderComponent = function (props) {
    const {
        numberOfFrames,
        timeFrame,
        ...componentProps
    } = props;

    return (
        <div>
            <input
                {...componentProps}
                className={styles.timeSlider}
                type={'range'}
                min={'0'}
                max={Math.max(0, numberOfFrames - 1)}
                value={timeFrame}
            />
            <br />
            <output name={'rangeValue'}>{`${timeFrame + 1}/${numberOfFrames}`}</output>
        </div>
    );
};

TimeSliderComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    timeFrame: PropTypes.number.isRequired
};

export default TimeSliderComponent;
