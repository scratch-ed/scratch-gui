import React from 'react';
import AceEditor from 'react-ace';
import Box from '../box/box.jsx';
import TimeSliderComponent from '../time-slider/time-slider.jsx';
import TrailSliderComponent from '../trail-slider/trail-slider.jsx';
import PropTypes from 'prop-types';
import StartDebuggerButtonComponent from '../start-debugger-button/start-debugger-button.jsx';
import StopDebuggerButtonComponent from '../stop-debugger-button/stop-debugger-button.jsx';
import FileInputComponent from '../file-input/file-input.jsx';

import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-javascript.js';
import 'ace-builds/src-noconflict/theme-chrome.js';

const DebuggerTabComponent = function (props) {
    const {
        codeString,
        numberOfFrames,
        onClickStart,
        onClickStop,
        onEditorChange,
        onTemplateChange,
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
                <FileInputComponent
                    labelString={'Template: '}
                    onChange={onTemplateChange}
                />
            </Box>
            <Box>
                <StartDebuggerButtonComponent onClick={onClickStart} />
                <StopDebuggerButtonComponent onClick={onClickStop} />
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
    onEditorChange: PropTypes.func.isRequired,
    onTemplateChange: PropTypes.func.isRequired,
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
