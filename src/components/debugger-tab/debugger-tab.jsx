import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import DebuggerButtonComponent from '../debugger-button/debugger-button.jsx';
import SliderComponent from '../slider/slider.jsx';
import Switch from 'react-switch';

import styles from './debugger-tab.css';
import stepButtonIcon from './step-button.svg';

const DebuggerTabComponent = function (props) {
    const {
        debugMode,
        numberOfFrames,
        onClickStep,
        onTimeChange,
        onTimeMouseDown,
        onTimeMouseUp,
        onToggle,
        onTrailChange,
        onTrailMouseDown,
        onTrailMouseUp,
        running,
        timeFrame,
        trailLength
    } = props;

    const MAX_TRAIL_LENGTH = 50;

    return (
        <Box className={styles.debuggerTab}>
            <label>
                <span>{'Debug mode: '}</span>
                <Switch
                    onChange={onToggle}
                    checked={debugMode}
                />
            </label>
            <br />
            {debugMode ?
                <Box>
                    <Box>
                        <DebuggerButtonComponent
                            alt={'STEP'}
                            src={stepButtonIcon}
                            onClick={onClickStep}
                        />
                    </Box>
                    <label>
                        <span>{'Current frame: '}</span>
                        <TimeSliderComponent
                            disabled={running}
                            numberOfFrames={numberOfFrames}
                            onChange={onTimeChange}
                            onMouseDown={onTimeMouseDown}
                            onMouseUp={onTimeMouseUp}
                            value={timeFrame}
                        />
                    </label>
                    <label>
                        <span>{'Trail length: '}</span>
                        <SliderComponent
                            max={MAX_TRAIL_LENGTH}
                            onChange={onTrailChange}
                            onMouseDown={onTrailMouseDown}
                            onMouseUp={onTrailMouseUp}
                            value={trailLength}
                        />
                    </label>
                </Box> :
                null}
        </Box>
    );
};

DebuggerTabComponent.propTypes = {
    debugMode: PropTypes.bool.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    onClickStep: PropTypes.func.isRequired,
    onTimeChange: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    onTimeMouseUp: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    onTrailChange: PropTypes.func.isRequired,
    onTrailMouseDown: PropTypes.func.isRequired,
    onTrailMouseUp: PropTypes.func.isRequired,
    running: PropTypes.bool.isRequired,
    timeFrame: PropTypes.number.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default DebuggerTabComponent;
