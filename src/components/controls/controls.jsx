import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import GreenFlag from '../green-flag/green-flag.jsx';
import StopAll from '../stop-all/stop-all.jsx';
import TestFlag from '../test-flag/test-flag.jsx';
import DebugMode from '../debugger-buttons/debug-mode/debug-mode.jsx';
import TurboMode from '../turbo-mode/turbo-mode.jsx';
import HeatmapButton from '../heatmap-button/heatmap-button.jsx';
import HeatmapIntensitySlider from '../heatmap-intensity-slider/heatmap-intensity-slider.jsx';
import {TimeSliderMode, TimeSliderStates} from '../../reducers/time-slider.js';

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
    testTitle: {
        id: 'gui.controls.test',
        defaultMessage: 'Test',
        description: 'Test button title'
    },
    heatmapTitle: {
        id: 'gui.controls.heatmap',
        defaultMessage: 'Toggle Heatmap',
        description: 'Heatmap button title'
    }
});

const Controls = function (props) {
    const {
        active,
        className,
        timeSliderMode,
        intl,
        onDebugModeClick,
        onGreenFlagClick,
        onHeatmapToggle,
        onHeatmapIntensityChange,
        onStopAllClick,
        onTestFlagClick,
        turbo,
        testsLoaded,
        heatmapVisible,
        heatmapIntensity,
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
                active={active || timeSliderMode === TimeSliderMode.TEST_FINISHED}
                title={intl.formatMessage(messages.stopTitle)}
                onClick={onStopAllClick}
            />
            <DebugMode
                debugMode={timeSliderMode === TimeSliderMode.DEBUG}
                title={intl.formatMessage(messages.debugTitle)}
                onClick={onDebugModeClick}
            />
            { timeSliderMode === TimeSliderMode.DEBUG &&
                <HeatmapButton
                    active={heatmapVisible}
                    title={intl.formatMessage(messages.heatmapTitle)}
                    onClick={onHeatmapToggle}
                />
            }
            { timeSliderMode === TimeSliderMode.DEBUG && heatmapVisible &&
                <HeatmapIntensitySlider
                    intensity={heatmapIntensity}
                    onIntensityChange={onHeatmapIntensityChange}
                />
            }
            {testsLoaded &&
                <TestFlag
                    active={timeSliderMode === TimeSliderMode.TEST_RUNNING}
                    title={intl.formatMessage(messages.testTitle)}
                    onClick={onTestFlagClick}
                />
            }
            {turbo ? (
                <TurboMode />
            ) : null}
        </div>
    );
};

Controls.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    timeSliderMode: PropTypes.oneOf(TimeSliderStates).isRequired,
    intl: intlShape.isRequired,
    onDebugModeClick: PropTypes.func.isRequired,
    onGreenFlagClick: PropTypes.func.isRequired,
    onHeatmapToggle: PropTypes.func.isRequired,
    onHeatmapIntensityChange: PropTypes.func.isRequired,
    onStopAllClick: PropTypes.func.isRequired,
    onTestFlagClick: PropTypes.func.isRequired,
    turbo: PropTypes.bool,
    testsLoaded: PropTypes.bool,
    heatmapVisible: PropTypes.bool,
    heatmapIntensity: PropTypes.number
};

Controls.defaultProps = {
    active: false,
    turbo: false,
    testsLoaded: false,
    heatmapVisible: false,
    heatmapIntensity: 10
};

export default injectIntl(Controls);
