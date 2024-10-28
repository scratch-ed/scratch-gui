import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import styles from './time-slider.css';
import removeFutureIcon from '../../debugger-icons/icon--remove-future.svg';
import Box from '../box/box.jsx';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

const messages = defineMessages({
    removeFutureTitle: {
        id: 'gui.controls.removeFuture',
        defaultMessage: 'Remove future part of recording',
        description: 'Remove "future" of history'
    }
});

const TimeSliderComponent = function (props) {
    const {
        numberOfFrames,
        markedFrames,
        timeFrame,
        sliderEnabled,
        paused,
        onremoveFutureClick,
        intl,
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
                list="test-markers"
            />
            <datalist id="test-markers">
                {
                    // markedFrames.map((marked, index) => (marked && <option value={index} />))
                }
            </datalist>
            <img
                className={classNames(
                    styles.removeFutureButton,
                    {
                        [styles.isEnabled]: sliderEnabled && paused && timeFrame < numberOfFrames - 1
                    })}
                src={removeFutureIcon}
                draggable={false}
                onClick={onremoveFutureClick}
                title={intl.formatMessage(messages.removeFutureTitle)}
            />
        </Box>
    );
};

TimeSliderComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    markedFrames: PropTypes.arrayOf(PropTypes.bool).isRequired,
    timeFrame: PropTypes.number.isRequired,
    sliderEnabled: PropTypes.bool.isRequired,
    paused: PropTypes.bool.isRequired,
    onremoveFutureClick: PropTypes.func.isRequired,
    intl: intlShape.isRequired
};

export default injectIntl(TimeSliderComponent);
