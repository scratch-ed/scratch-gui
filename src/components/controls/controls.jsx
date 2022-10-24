import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import GreenFlag from '../green-flag/green-flag.jsx';
import StopAll from '../stop-all/stop-all.jsx';
import DebugMode from '../debugger-buttons/debug-mode/debug-mode.jsx';
import RewindMode from '../debugger-buttons/rewind-mode/rewind-mode.jsx';
import ResumePause from '../debugger-buttons/resume-pause/resume-pause.jsx';
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
    rewindTitle: {
        id: 'gui.controls.rewind',
        defaultMessage: 'Rewind last execution',
        description: 'Rewind mode button title'
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
        numberOfFrames,
        onDebugModeClick,
        onGreenFlagClick,
        onToggleResumeClick,
        onRewindModeClick,
        onStepClick,
        onStopAllClick,
        paused,
        rewindMode,
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
                    <RewindMode
                        numberOfFrames={numberOfFrames}
                        rewindMode={rewindMode}
                        title={intl.formatMessage(messages.rewindTitle)}
                        onClick={onRewindModeClick}
                    />
                    <ResumePause
                        paused={paused}
                        running={active}
                        title={intl.formatMessage(messages.pauseTitle)}
                        onClick={onToggleResumeClick}
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
    numberOfFrames: PropTypes.number.isRequired,
    onDebugModeClick: PropTypes.func.isRequired,
    onGreenFlagClick: PropTypes.func.isRequired,
    onToggleResumeClick: PropTypes.func.isRequired,
    onRewindModeClick: PropTypes.func.isRequired,
    onStepClick: PropTypes.func.isRequired,
    onStopAllClick: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    rewindMode: PropTypes.bool.isRequired,
    turbo: PropTypes.bool
};

Controls.defaultProps = {
    active: false,
    turbo: false
};

export default injectIntl(Controls);
