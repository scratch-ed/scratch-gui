import React from 'react';
import PropTypes from 'prop-types';

import passedIcon from './passed.png';
import failedIcon from './failed.png';
import styles from './test-results.css';

// eslint-disable-next-line require-jsdoc
export default function TestComponent ({name, passed, feedback}) {
    const icon = (<img
        className={styles.feedbackIcon}
        src={passed ? passedIcon : failedIcon}
    />);
    return (
        <div className={styles.feedbackTree}>
            <div className={styles.feedbackRow}>
                <div className={styles.caretPadding} />
                {icon}
                <a>{feedback ? feedback : name}</a>
            </div>
        </div>
    );
}

TestComponent.propTypes = {
    name: PropTypes.string,
    passed: PropTypes.bool,
    feedback: PropTypes.string
};
