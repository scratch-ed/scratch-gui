import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import styles from './time-slider.css';
import removeHistoryIcon from '../../debugger-icons/icon--remove-history.svg';
import Box from '../box/box.jsx';

const TimeSliderComponent = function (props) {
    const {
        numberOfFrames,
        timeFrame,
        sliderEnabled,
        paused,
        onRemoveHistoryClick,
        ...componentProps
    } = props;

    return (
        <Box className={styles.timeSliderWrapper}>
            <input
                {...componentProps}
                className={styles.timeSlider}
                type={'range'}
                min={0}
                max={numberOfFrames === 1 ? 1 : Math.max(0, numberOfFrames - 1)}
                value={numberOfFrames === 1 ? 1 : timeFrame}
                disabled={!sliderEnabled}
            />
            <img
                className={classNames(
                    styles.removeHistoryButton,
                    {
                        [styles.isEnabled]: sliderEnabled && paused
                    })}
                src={removeHistoryIcon}
                draggable={false}
                onClick={onRemoveHistoryClick}
            />
        </Box>
    );
};

TimeSliderComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    timeFrame: PropTypes.number.isRequired,
    sliderEnabled: PropTypes.bool.isRequired,
    paused: PropTypes.bool.isRequired,
    onRemoveHistoryClick: PropTypes.func.isRequired
};

export default TimeSliderComponent;
