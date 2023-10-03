import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import pauseIcon from '../../../debugger-icons/icon--pause.svg';
import pauseStyles from './pause.css';
import resumeStyles from './resume.css';
import resumeIcon from '../../../debugger-icons/icon--resume.svg';

const ResumePauseComponent = function (props) {
    const {
        className,
        onClick,
        paused,
        title,
        ...componentProps
    } = props;

    return (
        paused ? (<img
            className={classNames(
                className,
                resumeStyles.resume
            )}
            draggable={false}
            src={resumeIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />) : (<img
            className={classNames(
                className,
                pauseStyles.pause
            )}
            draggable={false}
            src={pauseIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />)
    );
};

ResumePauseComponent.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    title: PropTypes.string
};

ResumePauseComponent.defaultProps = {
    title: 'ResumePause'
};

export default ResumePauseComponent;
