import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import debugModeIcon from '../../../debugger-icons/icon--debug-mode.svg';
import styles from './debug-mode.css';

const DebugModeComponent = function (props) {
    const {
        className,
        debugMode,
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
                    [styles.inDebugMode]: debugMode
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
    className: PropTypes.string,
    debugMode: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string
};

DebugModeComponent.defaultProps = {
    title: 'Debug'
};

export default DebugModeComponent;
