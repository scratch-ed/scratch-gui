import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import TrailSliderComponent from '../trail-slider/trail-slider.jsx';
import DebuggerButtonComponent from '../debugger-button/debugger-button.jsx';

import stepButtonIcon from './step-button.svg';
import Switch from 'react-switch';

const DebuggerTabComponent = function (props) {
    const {
        debugMode,
        numberOfFrames,
        onClickStep,
        onTimeInput,
        onTimeMouseDown,
        onTimeMouseUp,
        onToggle,
        onTrailInput,
        onTrailMouseDown,
        onTrailMouseUp,
        running,
        timeFrame,
        trailLength
    } = props;

    return (
        <Box>
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
                            onInput={onTimeInput}
                            onMouseDown={onTimeMouseDown}
                            onMouseUp={onTimeMouseUp}
                            timeFrame={timeFrame}
                        />
                    </label>
                    <label>
                        <span>{'Trail length: '}</span>
                        <TrailSliderComponent
                            onInput={onTrailInput}
                            onMouseDown={onTrailMouseDown}
                            onMouseUp={onTrailMouseUp}
                            trailLength={trailLength}
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
    onTimeInput: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    onTimeMouseUp: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    onTrailInput: PropTypes.func.isRequired,
    onTrailMouseDown: PropTypes.func.isRequired,
    onTrailMouseUp: PropTypes.func.isRequired,
    running: PropTypes.bool.isRequired,
    timeFrame: PropTypes.number.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default DebuggerTabComponent;
