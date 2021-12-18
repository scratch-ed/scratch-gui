import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import pauseIcon from './icon--pause.svg';
import styles from './pause.css';

const PauseComponent = function (props) {
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
                styles.pause
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
    title: PropTypes.string
};

PauseComponent.defaultProps = {
    title: 'Pause'
};

export default PauseComponent;
