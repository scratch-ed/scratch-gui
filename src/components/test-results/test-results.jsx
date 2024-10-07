import React, {useState} from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import passedIcon from './passed.png';
import failedIcon from './failed.png';

import styles from './test-results.css';
import {FormattedMessage} from 'react-intl';

import {TestGroup} from 'scratch-vm';

const TestResultComponent = ({testResults}) => {
    return (
        <Box className={styles.testResults}>
            <label>
                <span>
                    <FormattedMessage
                        defaultMessage="Test Results"
                        description="head of test result tab"
                        id="gui.testResultTab.header"
                    />
                </span>
                <br />
                {
                    testResults.map(result => {
                        if ('children' in result) {
                            return (<TestGroupComponent
                                testGroup={result}
                                key={result.id}
                            />);
                        }
                        return (<TestComponent
                            {...result}
                            key={result.id}
                        />);
                    })
                }
            </label>
        </Box>
    );
};

TestResultComponent.propTypes = {
    testResults: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.instanceOf(TestGroup)
    ]))
};

const TestGroupComponent = ({testGroup}) => {
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
};

TestGroupComponent.propTypes = {
    testGroup: PropTypes.instanceOf(TestGroup)
};

const TestComponent = ({name, passed, feedback}) => {
    const icon = (<img
        className={styles.feedbackIcon}
        src={passed ? passedIcon : failedIcon}
    />);
    return (
        <div className={styles.feedbackTree}>
            <div className={styles.feedbackRow}>
                {icon}
                <a>{feedback ? feedback : name}</a>
            </div>
        </div>
    );
};

TestComponent.propTypes = {
    name: PropTypes.string,
    passed: PropTypes.bool,
    feedback: PropTypes.string
};

export default TestResultComponent;
