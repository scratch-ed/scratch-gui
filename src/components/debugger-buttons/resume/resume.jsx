import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import resumeIcon from '../../../debugger-icons/icon--resume.svg';
import styles from './resume.css';

const ResumeComponent = function (props) {
    const {
        className,
        onClick,
        paused,
        title,
        ...componentProps
    } = props;

    return (
        <img
            className={classNames(
                className,
                styles.resume,
                {
                    [styles.isPaused]: paused
                }
            )}
            draggable={false}
            src={resumeIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};

ResumeComponent.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    title: PropTypes.string
};

ResumeComponent.defaultProps = {
    title: 'Resume'
};

export default ResumeComponent;
