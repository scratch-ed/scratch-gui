import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import stepIcon from '../../../debugger-icons/icon--step.svg';
import styles from './step.css';

const StepComponent = function (props) {
    const {
        className,
        onClick,
        paused,
        running,
        title,
        ...componentProps
    } = props;

    return (
        <img
            className={classNames(
                className,
                styles.step,
                {
                    [styles.isEnabled]: running && paused
                }
            )}
            draggable={false}
            src={stepIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};

StepComponent.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    running: PropTypes.bool.isRequired,
    title: PropTypes.string
};

StepComponent.defaultProps = {
    title: 'Step'
};

export default StepComponent;
