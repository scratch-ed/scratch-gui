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
        onToggleResumeClick,
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
            />
            <ResumePause
                paused={paused}
                running={running}
                title={intl.formatMessage(messages.pauseTitle)}
                onClick={onToggleResumeClick}
            />
            <Step
                paused={paused}
                running={running}
                title={intl.formatMessage(messages.stepTitle)}
                onClick={onStepClick}
            />
            <output
                name={'rangeValue'}
            >
                {`${timeFrame + 1}/${numberOfFrames}`}
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
    onToggleResumeClick: PropTypes.func.isRequired,
    onStepClick: PropTypes.func.isRequired,
    intl: intlShape.isRequired
};

export default injectIntl(TimeInterfaceComponent);
