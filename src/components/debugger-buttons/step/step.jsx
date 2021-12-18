import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import stepIcon from './icon--step.svg';
import styles from './step.css';

const StepComponent = function (props) {
    const {
        className,
        onClick,
        title,
        ...componentProps
    } = props;

    return (
        <img
            className={classNames(
                className,
                styles.step
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
    title: PropTypes.string
};

StepComponent.defaultProps = {
    title: 'Step'
};

export default StepComponent;
