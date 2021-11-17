import React from 'react';

import styles from './trail-slider.css';
import PropTypes from 'prop-types';

const TrailSliderComponent = function (props) {
    const {
        onInput,
        onMouseDown,
        onMouseUp,
        trailLength,
        ...componentProps
    } = props;

    const MAX_LENGTH = 50;

    return (
        <React.Fragment>
            <label htmlFor={styles.trailSliderInput}>{'Trail length:'}</label>
            <input
                {...componentProps}
                id={styles.trailSliderInput}
                type={'range'}
                min={'0'}
                max={MAX_LENGTH}
                defaultValue={trailLength}
                onInput={onInput}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
            />
            <p id={styles.trailLength}>{trailLength}</p>
        </React.Fragment>
    );
};

TrailSliderComponent.propTypes = {
    onInput: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onMouseUp: PropTypes.func.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default TrailSliderComponent;
