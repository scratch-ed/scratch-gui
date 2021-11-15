import React from 'react';
import startDebuggerIcon from './start-button.svg';
import styles from './start-debugger-button.css';
import PropTypes from 'prop-types';

const StartDebuggerButtonComponent = function (props) {
    const {
        onClick,
        ...componentProps
    } = props;

    return (
        <input
            {...componentProps}
            type={'image'}
            id={styles.startDebuggerButton}
            alt={'START'}
            draggable={'false'}
            src={startDebuggerIcon}
            onClick={onClick}
        />
    );
};

StartDebuggerButtonComponent.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default StartDebuggerButtonComponent;
