import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import testFlagIcon from './icon--test-flag.svg';
import styles from './test-flag.css';

const TestFlagComponent = function (props) {
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
                styles.testFlag,
                {
                    [styles.isActive]: active
                }
            )}
            draggable={false}
            src={testFlagIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};

TestFlagComponent.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string
};

TestFlagComponent.defaultProps = {
    active: false,
    title: 'Test'
};

export default TestFlagComponent;
