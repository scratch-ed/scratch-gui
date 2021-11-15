import React from 'react';
import styles from './file-input.css';
import PropTypes from 'prop-types';

const FileInputComponent = function (props) {
    const {
        labelString,
        onChange,
        ...componentProps
    } = props;

    return (
        <span>{labelString}<input
            {...componentProps}
            type={'file'}
            id={styles.fileInput}
            onChange={onChange}
        /></span>
    );
};

FileInputComponent.propTypes = {
    labelString: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

export default FileInputComponent;
