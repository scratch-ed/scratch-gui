import React from 'react';
import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import PropTypes from 'prop-types';

import styles from './time-interface.css';
import ResumePause from '../debugger-buttons/resume-pause/resume-pause.jsx';
import Step from '../debugger-buttons/step/step.jsx';

import {defineMessages, injectIntl, intlShape} from 'react-intl';


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
    }
});

const TimeInterfaceComponent = function (props) {
    const {
        numberOfFrames,
        onTimeChange,
        onTimeMouseDown,
        onTimeMouseUp,
        timeFrame,
        running,
        paused,
        changed,
        onToggleResumeClick,
        onStepBackClick,
        onStepClick,
        intl
    } = props;

    return (
        <Box className={styles.timeInterface}>
            <TimeSliderComponent
                numberOfFrames={numberOfFrames}
                onChange={onTimeChange}
                onMouseDown={onTimeMouseDown}
                onMouseUp={onTimeMouseUp}
                timeFrame={timeFrame}
                disabled={changed}
            />
            <Step
                className={styles.stepBack}
                enabled={running && paused && timeFrame > 0}
                title={intl.formatMessage(messages.stepTitle)}
                onClick={onStepBackClick}
            />
            <ResumePause
                paused={paused}
                running={running}
                title={paused ? intl.formatMessage(messages.pauseTitle) : intl.formatMessage(messages.resumeTitle)}
                onClick={onToggleResumeClick}
            />
            <Step
                enabled={running && paused}
                title={intl.formatMessage(messages.stepTitle)}
                onClick={onStepClick}
            />
            <output
                name={'rangeValue'}
            >
                {numberOfFrames > 0 ? `${timeFrame + 1}/${numberOfFrames}` : '0/0'}
            </output>
        </Box>
    );
};

TimeInterfaceComponent.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    onTimeChange: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    onTimeMouseUp: PropTypes.func.isRequired,
    timeFrame: PropTypes.number.isRequired,
    running: PropTypes.bool.isRequired,
    paused: PropTypes.bool.isRequired,
    changed: PropTypes.bool.isRequired,
    onToggleResumeClick: PropTypes.func.isRequired,
    onStepBackClick: PropTypes.func.isRequired,
    onStepClick: PropTypes.func.isRequired,
    intl: intlShape.isRequired
};

export default injectIntl(TimeInterfaceComponent);
