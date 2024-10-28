import React, {useState} from 'react';
import PropTypes from 'prop-types';

import TestComponent from './test-component.jsx';
import passedIcon from './passed.png';
import failedIcon from './failed.png';
import styles from './test-results.css';

// eslint-disable-next-line require-jsdoc
export default function TestGroupComponent ({testGroup}) {
    const [opened, setOpened] = useState(testGroup.visibility);
    const icon = (<img
        className={styles.feedbackIcon}
        src={testGroup.testsPassed ? passedIcon : failedIcon}
    />);

    let caretStyle = styles.hidden;
    if (testGroup.children.length > 0) {
        caretStyle = opened ? styles.caretOpen : styles.caretClosed;
    }

    return (
        <div
            className={styles.feedbackTree}
        >
            <div className={styles.feedbackRow}>
                <div
                    className={caretStyle}
                    onClick={() => setOpened(!opened)}
                />
                {icon}
                {testGroup.name}
            </div>
            {testGroup.summary}

            <div className={opened ? '' : styles.hidden}>
                {testGroup.children.map(child => {
                    if ('children' in child) {
                        return (<TestGroupComponent
                            testGroup={child}
                            key={child.id}
                        />);
                    }
                    return (<TestComponent
                        {...child}
                        key={child.id}
                    />);
                })}
            </div>
        </div>
    );
}

TestGroupComponent.propTypes = {
    testGroup: PropTypes.shape({
        children: PropTypes.arrayOf(PropTypes.object),
        name: PropTypes.string,
        visibility: PropTypes.bool,
        summary: PropTypes.string,
        testsPassed: PropTypes.bool
    })
};
