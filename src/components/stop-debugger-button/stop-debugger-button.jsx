import React from 'react';
import stopDebuggerIcon from './stop-button.svg';
import styles from './stop-debugger-button.css';
import PropTypes from 'prop-types';

const StopDebuggerButtonComponent = function (props) {
    const {
        onClick,
        ...componentProps
    } = props;

    return (
        <input
            {...componentProps}
            type={'image'}
            id={styles.stopDebuggerButton}
            alt={'STOP'}
            draggable={'false'}
            src={stopDebuggerIcon}
            onClick={onClick}
        />
    );
};

StopDebuggerButtonComponent.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default StopDebuggerButtonComponent;
