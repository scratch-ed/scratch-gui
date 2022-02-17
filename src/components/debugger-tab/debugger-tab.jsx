import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import SliderComponent from '../slider/slider.jsx';

import styles from './debugger-tab.css';

const DebuggerTabComponent = function (props) {
    const {
        breakpoints,
        onTrailChange,
        onTrailMouseDown,
        onTrailMouseUp,
        trailLength
    } = props;

    const MAX_TRAIL_LENGTH = 50;

    return (
        <Box className={styles.debuggerTab}>
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
            <h2>{'Breakpoints: '}</h2>
            <ul>
                {breakpoints.size > 0 ?
                    [...breakpoints].map((blockId, i) => <li key={i}>{blockId}</li>) :
                    <p>{'No breakpoints placed.'}</p>
                }
            </ul>
        </Box>
    );
};

DebuggerTabComponent.propTypes = {
    breakpoints: PropTypes.instanceOf(Set).isRequired,
    onTrailChange: PropTypes.func.isRequired,
    onTrailMouseDown: PropTypes.func.isRequired,
    onTrailMouseUp: PropTypes.func.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default DebuggerTabComponent;
