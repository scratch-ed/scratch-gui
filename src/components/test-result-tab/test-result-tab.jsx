import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';

import styles from './test-result-tab.css';
import {FormattedMessage} from 'react-intl';
import passed from './passed.png';
import failed from './failed.png';

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
                    // the first child of the feedback tree is the root node
                    feedbackTree={Object.values(getTestResults())[0].children[0] ?
                        Object.values(getTestResults())[0].children[0] : {value: '', children: []}}
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
        <div className={styles.feedbackTree}>
            <div>
                {feedbackTree.groupPassed ?
                    <img
                        className={styles.feedbackIcon}
                        src={passed}
                    /> :
                    <img
                        className={styles.feedbackIcon}
                        src={failed}
                    />
                }
                <a>{feedbackTree.value}</a>
            </div>
            <div>
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
