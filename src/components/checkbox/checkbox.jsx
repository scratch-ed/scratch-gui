import React from 'react';
import styles from './checkbox.css';
import PropTypes from 'prop-types';

const CheckboxComponent = function (props) {
    const {
        defaultValue,
        onChange
    } = props;

    return (
        <input
            id={styles.checkbox}
            type={'checkbox'}
            defaultValue={defaultValue}
            onChange={onChange}
        />
    );
};

CheckboxComponent.propTypes = {
    defaultValue: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

export default CheckboxComponent;
