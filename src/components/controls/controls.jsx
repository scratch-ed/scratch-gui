import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import GreenFlag from '../green-flag/green-flag.jsx';
import StopAll from '../stop-all/stop-all.jsx';
import DebugMode from '../debugger-buttons/debug-mode/debug-mode.jsx';
import Resume from '../debugger-buttons/resume/resume.jsx';
import Pause from '../debugger-buttons/pause/pause.jsx';
import Step from '../debugger-buttons/step/step.jsx';
import TurboMode from '../turbo-mode/turbo-mode.jsx';

import styles from './controls.css';


const messages = defineMessages({
    goTitle: {
        id: 'gui.controls.go',
        defaultMessage: 'Go',
        description: 'Green flag button title'
    },
    stopTitle: {
        id: 'gui.controls.stop',
        defaultMessage: 'Stop',
        description: 'Stop button title'
    },
    debugTitle: {
        id: 'gui.controls.debug',
        defaultMessage: 'Debug mode',
        description: 'Debug mode button title'
    },
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

const Controls = function (props) {
    const {
        active,
        className,
        debugMode,
        intl,
        onDebugModeClick,
        onGreenFlagClick,
        onPauseClick,
        onResumeClick,
        onStepClick,
        onStopAllClick,
        paused,
        turbo,
        ...componentProps
    } = props;

    return (
        <div
            className={classNames(styles.controlsContainer, className)}
            {...componentProps}
        >
            <GreenFlag
                active={active}
                title={intl.formatMessage(messages.goTitle)}
                onClick={onGreenFlagClick}
            />
            <StopAll
                active={active}
                title={intl.formatMessage(messages.stopTitle)}
                onClick={onStopAllClick}
            />
            <DebugMode
                debugMode={debugMode}
                title={intl.formatMessage(messages.debugTitle)}
                onClick={onDebugModeClick}
            />
            {debugMode ?
                <>
                    <Resume
                        paused={paused}
                        running={active}
                        title={intl.formatMessage(messages.resumeTitle)}
                        onClick={onResumeClick}
                    />
                    <Pause
                        paused={paused}
                        running={active}
                        title={intl.formatMessage(messages.pauseTitle)}
                        onClick={onPauseClick}
                    />
                    <Step
                        paused={paused}
                        running={active}
                        title={intl.formatMessage(messages.stepTitle)}
                        onClick={onStepClick}
                    />
                </> :
                null}
            {turbo ? (
                <TurboMode />
            ) : null}
        </div>
    );
};

Controls.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    debugMode: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    onDebugModeClick: PropTypes.func.isRequired,
    onGreenFlagClick: PropTypes.func.isRequired,
    onPauseClick: PropTypes.func.isRequired,
    onResumeClick: PropTypes.func.isRequired,
    onStepClick: PropTypes.func.isRequired,
    onStopAllClick: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    turbo: PropTypes.bool
};

Controls.defaultProps = {
    active: false,
    turbo: false
};

export default injectIntl(Controls);
