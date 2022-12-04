import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';

import styles from './test-result-tab.css';
import {FormattedMessage} from 'react-intl';

const TestResultTabComponent = function (props) {
    const {
        getTestResults
    } = props;

    return (
        <Box className={styles.testResultTab}>
            <label>
                <span>
                    <FormattedMessage
                        defaultMessage="Test Results"
                        description="head of test result tab"
                        id="gui.testResultTab.header"
                    />
                </span>
                <br />
                <FeedbackTreeComponent
                    feedbackTree={Object.values(getTestResults())[0] ?
                        Object.values(getTestResults())[0] : {value: '', children: []}}
                    depth={0}
                />
            </label>
        </Box>
    );
};

TestResultTabComponent.propTypes = {
    getTestResults: PropTypes.func.isRequired
};

const FeedbackTreeComponent = function (props) {
    const {
        feedbackTree,
        depth
    } = props;

    return (
        <div>
            <a>{(feedbackTree.groupPassed ? 'Passed: ' : 'Failed: ') + feedbackTree.value}</a>
            <div className={styles.feedbackTree}>
                {feedbackTree.children.map((child => FeedbackTreeComponent({feedbackTree: child, depth: (depth + 1)})))}
            </div>
        </div>
    );
};

FeedbackTreeComponent.propTypes = {
    feedbackTree: PropTypes.object.isRequired,
    depth: PropTypes.number.isRequired
};

export default TestResultTabComponent;
