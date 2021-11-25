import React from 'react';
import AceEditor from 'react-ace';
import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import TrailSliderComponent from '../trail-slider/trail-slider.jsx';
import PropTypes from 'prop-types';
import DebuggerButtonComponent from '../debugger-button/debugger-button.jsx';

import startButtonIcon from './start-button.svg';
import stopButtonIcon from './stop-button.svg';
import stepButtonIcon from './step-button.svg';

import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-javascript.js';
import 'ace-builds/src-noconflict/theme-chrome.js';

const DebuggerTabComponent = function (props) {
    const {
        codeString,
        numberOfFrames,
        onClickStart,
        onClickStop,
        onClickStep,
        onEditorChange,
        onTimeInput,
        onTimeMouseDown,
        onTimeMouseUp,
        onTrailInput,
        onTrailMouseDown,
        onTrailMouseUp,
        timeFrame,
        timeSliderDisabled,
        timeSliderKey,
        trailLength
    } = props;

    return (
        <Box>
            <Box>
                <DebuggerButtonComponent
                    alt={'START'}
                    src={startButtonIcon}
                    onClick={onClickStart}
                />
                <DebuggerButtonComponent
                    alt={'STOP'}
                    src={stopButtonIcon}
                    onClick={onClickStop}
                />
                <DebuggerButtonComponent
                    alt={'STEP'}
                    src={stepButtonIcon}
                    onClick={onClickStep}
                />
            </Box>
            <AceEditor
                mode={'javascript'}
                theme={'chrome'}
                showPrintMargin={false}
                defaultValue={codeString}
                onChange={onEditorChange}
            />
            <TimeSliderComponent
                key={timeSliderKey}
                timeSliderDisabled={timeSliderDisabled}
                onInput={onTimeInput}
                onMouseDown={onTimeMouseDown}
                onMouseUp={onTimeMouseUp}
                numberOfFrames={numberOfFrames}
                timeFrame={timeFrame}
            />
            <TrailSliderComponent
                onInput={onTrailInput}
                onMouseDown={onTrailMouseDown}
                onMouseUp={onTrailMouseUp}
                trailLength={trailLength}
            />
        </Box>
    );
};

DebuggerTabComponent.propTypes = {
    codeString: PropTypes.string.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    onClickStart: PropTypes.func.isRequired,
    onClickStop: PropTypes.func.isRequired,
    onClickStep: PropTypes.func.isRequired,
    onEditorChange: PropTypes.func.isRequired,
    onTimeInput: PropTypes.func.isRequired,
    onTimeMouseDown: PropTypes.func.isRequired,
    onTimeMouseUp: PropTypes.func.isRequired,
    onTrailInput: PropTypes.func.isRequired,
    onTrailMouseDown: PropTypes.func.isRequired,
    onTrailMouseUp: PropTypes.func.isRequired,
    timeFrame: PropTypes.number.isRequired,
    timeSliderDisabled: PropTypes.bool.isRequired,
    timeSliderKey: PropTypes.bool.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default DebuggerTabComponent;
