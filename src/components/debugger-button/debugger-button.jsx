import React from 'react';
import styles from './debugger-button.css';
import PropTypes from 'prop-types';

const DebuggerButtonComponent = function (props) {
    const {
        ...componentProps
    } = props;

    return (
        <input
            type={'image'}
            draggable={'false'}
            id={styles.debuggerButton}
            {...componentProps}
        />
    );
};

DebuggerButtonComponent.propTypes = {
    alt: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    src: PropTypes.string.isRequired
};

export default DebuggerButtonComponent;
