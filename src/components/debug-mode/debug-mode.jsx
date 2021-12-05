import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import debugModeIcon from './icon--debug-mode.svg';
import styles from './debug-mode.css';

const DebugModeComponent = function (props) {
    const {
        active,
        className,
        onClick,
        title,
        ...componentProps
    } = props;

    return (
        <img
            className={classNames(
                className,
                styles.debugMode,
                {
                    [styles.isActive]: active
                }
            )}
            draggable={false}
            src={debugModeIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};

DebugModeComponent.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string
};

DebugModeComponent.defaultProps = {
    active: false,
    title: 'Debug'
};

export default DebugModeComponent;
