import React from 'react';
import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import TestMarkers from '../test-markers/test-markers.jsx';
import PropTypes from 'prop-types';

import styles from './time-interface.css';
import ResumePause from '../debugger-buttons/resume-pause/resume-pause.jsx';
import Step from '../debugger-buttons/step/step.jsx';

import recordingIcon from '../../debugger-icons/icon--recording.svg';

import {defineMessages, injectIntl, intlShape} from 'react-intl';
import classnames from 'classnames';


const messages = defineMessages({
    resumeTitle: {
        id: 'gui.controls.resume',
        defaultMessage: 'Resume',
        description: 'Resume button title'
    },
    pauseTitle: {
        id: 'gui.controls.pause',
        defaultMessage: 'Pause',
        description: 'Pause button title'
    },
    stepTitle: {
        id: 'gui.controls.step',
        defaultMessage: 'Step',
        description: 'Step button title'
    },
    stepBackTitle: {
        id: 'gui.controls.stepBack',
        defaultMessage: 'Step back',
        description: 'Step back button title'
    }
});

const TimeInterfaceComponent = function (props) {
    const {
        numberOfFrames,
        onTimeChange,
        onFrameChange,
        onTimeMouseDown,
        timeFrame,
        paused,
        changed,
        markers,
        onToggleResumeClick,
        onStepBackClick,
        onStepClick,
        onremoveFutureClick,
        intl
    } = props;

    const frames = Array.from(Array(numberOfFrames), () => []);
    const markedFrames = Array(numberOfFrames);
    markers.forEach(marker => {
        if (marker[0] < numberOfFrames) {
            frames[marker[0]].push(marker[1]);
            markedFrames[marker[0]] = true;
        }
    });

    return (
        <Box>
            <TestMarkers
                frames={frames}
                onFrameChange={onFrameChange}
            />
            <TimeSliderComponent
                numberOfFrames={numberOfFrames}
                markedFrames={markedFrames}
                onChange={onTimeChange}
                onMouseDown={onTimeMouseDown}
                timeFrame={timeFrame}
                sliderEnabled={!changed && numberOfFrames > 0}
                paused={paused}
                onremoveFutureClick={onremoveFutureClick}
            />
            {/* Recording icon is grey when paused or (replaying) in history */}
            <img
                className={classnames(styles.recordingIcon, (paused || timeFrame < numberOfFrames - 1) ?
                    styles.grey :
                    styles.blinking)}
                src={recordingIcon}
                draggable={false}
            />
            <Step
                className={styles.stepBack}
                enabled={!changed && timeFrame > 0}
                title={intl.formatMessage(messages.stepBackTitle)}
                onClick={onStepBackClick}
            />
            <ResumePause
                paused={paused}
                title={paused ?
                    intl.formatMessage(messages.resumeTitle) :
                    intl.formatMessage(messages.pauseTitle)}
                onClick={onToggleResumeClick}
            />
            <Step
                enabled={paused}
                title={intl.formatMessage(messages.stepTitle)}
                onClick={onStepClick}
            />
        </Box>
    );
};

TimeInterfaceComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    onTimeChange: PropTypes.func.isRequired,
    onFrameChange: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    timeFrame: PropTypes.number.isRequired,
    paused: PropTypes.bool.isRequired,
    changed: PropTypes.bool.isRequired,
    markers: PropTypes.arrayOf(PropTypes.array),
    onToggleResumeClick: PropTypes.func.isRequired,
    onStepBackClick: PropTypes.func.isRequired,
    onStepClick: PropTypes.func.isRequired,
    onremoveFutureClick: PropTypes.func.isRequired,
    intl: intlShape.isRequired
};

export default injectIntl(TimeInterfaceComponent);
