import React from 'react';
import PropTypes from 'prop-types';
import {setOpened} from '../../reducers/test-results';
import {connect} from 'react-redux';


import Box from '../box/box.jsx';

import styles from './test-result-tab.css';
import {FormattedMessage} from 'react-intl';
import passed from './passed.png';
import failed from './failed.png';

const TestResultTabComponent = function (props) {
    const {
        getTestResults
    } = props;

    let feedbackTree;
    // TODO: use multiple of the feedback trees in the test results
    const testResults = Object.values(getTestResults())[0];
    if (testResults && testResults.children[0]) {
        feedbackTree = testResults.children[0];
    } else {
        feedbackTree = {value: '', children: []};
    }

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
                <ConnectedFeedbackTreeComponent
                    // the first child of the feedback tree is the root node
                    feedbackTree={feedbackTree}
                    id={feedbackTree.id}
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
        opened,
        setOpened,
        feedbackTree,
        id
    } = props;

    // caret can be open, closed or hidden
    let caretStyle = styles.hidden;
    if (feedbackTree.children && feedbackTree.children.length > 0) {
        caretStyle = opened ? styles.caretOpen : styles.caretClosed;
    }

    return (
        <div
            className={styles.feedbackTree}
            key={id}
        >
            <div className={styles.feedbackRow}>
                <div
                    className={caretStyle}
                    onClick={() => setOpened(!opened, id)}
                />
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
            <div className={opened ? '' : styles.hidden}>
                {feedbackTree.children.map(child =>
                    (<ConnectedFeedbackTreeComponent
                        feedbackTree={child}
                        id={child.id}
                        key={child.id}
                    />)
                )}
            </div>
        </div>
    );
};

const mapStateToProps = (state, props) => ({
    opened: state.scratchGui.testResults.openedMap[props.id] ?
        // open failed groups by default
        state.scratchGui.testResults.openedMap[props.id] : !props.feedbackTree.groupPassed

});

const mapDispatchToProps = dispatch => ({
    setOpened: (opened, nodeId) => dispatch(setOpened(opened, nodeId))
});

FeedbackTreeComponent.propTypes = {
    opened: PropTypes.bool.isRequired,
    setOpened: PropTypes.func.isRequired,
    feedbackTree: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired
};

const ConnectedFeedbackTreeComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(FeedbackTreeComponent);

export default TestResultTabComponent;
