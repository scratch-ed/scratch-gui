import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import SliderComponent from '../slider/slider.jsx';

import styles from './debugger-tab.css';
import {FormattedMessage} from 'react-intl';

const DebuggerTabComponent = function (props) {
    const {
        onTrailChange,
        onTrailMouseDown,
        onTrailMouseUp,
        trailLength
    } = props;

    const MAX_TRAIL_LENGTH = 50;

    return (
        <Box className={styles.debuggerTab}>
            <label>
                <span>
                    <FormattedMessage
                        defaultMessage="Trail length"
                        description="Trail length slider label"
                        id="gui.debuggerTab.trailLength"
                    />
                </span>
                <SliderComponent
                    max={MAX_TRAIL_LENGTH}
                    onChange={onTrailChange}
                    onMouseDown={onTrailMouseDown}
                    onMouseUp={onTrailMouseUp}
                    value={trailLength}
                />
            </label>
        </Box>
    );
};

DebuggerTabComponent.propTypes = {
    onTrailChange: PropTypes.func.isRequired,
    onTrailMouseDown: PropTypes.func.isRequired,
    onTrailMouseUp: PropTypes.func.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default DebuggerTabComponent;
