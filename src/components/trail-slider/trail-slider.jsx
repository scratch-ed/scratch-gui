import React from 'react';
import PropTypes from 'prop-types';

import styles from './trail-slider.css';

const TrailSliderComponent = function (props) {
    const {
        maxTrailLength,
        trailLength,
        ...componentProps
    } = props;

    return (<div>
        <input
            {...componentProps}
            className={styles.trailSlider}
            type={'range'}
            min={'0'}
            max={maxTrailLength}
            value={trailLength}
        />
        <br />
        <output name={'rangeValue'}>{`${trailLength}/${maxTrailLength}`}</output>
    </div>
    );
};

TrailSliderComponent.propTypes = {
    maxTrailLength: PropTypes.number.isRequired,
    trailLength: PropTypes.number.isRequired
};

export default TrailSliderComponent;
