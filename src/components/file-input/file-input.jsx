import React from 'react';
import styles from './file-input.css';
import PropTypes from 'prop-types';

const FileInputComponent = function (props) {
    const {
        accept,
        labelString,
        onChange,
        ...componentProps
    } = props;

    return (
        <span>{labelString}<input
            {...componentProps}
            accept={accept}
            type={'file'}
            id={styles.fileInput}
            onChange={onChange}
        /></span>
    );
};

FileInputComponent.propTypes = {
    accept: PropTypes.string,
    labelString: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

export default FileInputComponent;
