import React from 'react';
import PropTypes from 'prop-types';

import styles from './slider.css';

const SliderComponent = function (props) {
    const {
        className,
        max,
        value,
        ...componentProps
    } = props;

    return (
        <div>
            <input
                {...componentProps}
                className={className ? className : styles.slider}
                type={'range'}
                min={'0'}
                max={max}
                value={value}
            />
            <br />
            <output name={'rangeValue'}>{value}</output>
        </div>
    );
};

SliderComponent.propTypes = {
    className: PropTypes.string,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
};

export default SliderComponent;
