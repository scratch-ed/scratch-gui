import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import resumeIcon from './icon--resume.svg';
import styles from './resume.css';

const ResumeComponent = function (props) {
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
                styles.resume
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
    title: PropTypes.string
};

ResumeComponent.defaultProps = {
    title: 'Resume'
};

export default ResumeComponent;
