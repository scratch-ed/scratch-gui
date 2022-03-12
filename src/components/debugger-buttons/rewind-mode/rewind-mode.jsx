import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import rewindModeIcon from '../../../debugger-icons/icon--rewind-mode.svg';
import styles from './rewind-mode.css';

const RewindModeComponent = function (props) {
    const {
        className,
        numberOfFrames,
        onClick,
        rewindMode,
        title,
        ...componentProps
    } = props;

    return (
        <img
            className={classNames(
                className,
                styles.rewindMode,
                {
                    [styles.inRewindMode]: rewindMode
                },
                {
                    [styles.isAvailable]: numberOfFrames > 0
                }
            )}
            draggable={false}
            src={rewindModeIcon}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};

RewindModeComponent.propTypes = {
    className: PropTypes.string,
    numberOfFrames: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    rewindMode: PropTypes.bool.isRequired,
    title: PropTypes.string
};

RewindModeComponent.defaultProps = {
    title: 'Rewind'
};

export default RewindModeComponent;
