import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import pauseIcon from '../../../debugger-icons/icon--pause.svg';
import styles from './pause.css';

const PauseComponent = function (props) {
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
                styles.pause,
                {
                    [styles.isPaused]: paused
                }
            )}
            draggable={false}
            src={pauseIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};

PauseComponent.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    title: PropTypes.string
};

PauseComponent.defaultProps = {
    title: 'Pause'
};

export default PauseComponent;
