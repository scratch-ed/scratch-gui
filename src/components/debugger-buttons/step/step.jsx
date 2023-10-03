import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import stepIcon from '../../../debugger-icons/icon--step.svg';
import styles from './step.css';

const StepComponent = function (props) {
    const {
        className,
        onClick,
        enabled,
        title,
        ...componentProps
    } = props;

    return (
        <img
            className={classNames(
                className,
                styles.step,
                {
                    [styles.isEnabled]: enabled
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
    enabled: PropTypes.bool.isRequired,
    title: PropTypes.string
};

StepComponent.defaultProps = {
    title: 'Step'
};

export default StepComponent;
