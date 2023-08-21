import React from 'react';
import PropTypes from 'prop-types';
import {setOpened} from '../../reducers/test-results';
import {connect} from 'react-redux';


import Box from '../box/box.jsx';

import styles from './test-result-tab.css';
import {FormattedMessage} from 'react-intl';
import passed from './passed.png';
import failed from './failed.png';
import maybe from './maybe.png';

const TestResultTabComponent = function (props) {
    const {
        getTestResults
    } = props;

    // TODO: use multiple of the feedback trees in the test results
    const testResults = Object.values(getTestResults())[0];
    const feedbackTree = testResults ? testResults : {value: '', children: []};

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
                {
                    // only display children of the root element. The root element is just a placeholder
                    feedbackTree.children.map(child =>
                        (<ConnectedFeedbackTreeComponent
                            // the first child of the feedback tree is the root node
                            feedbackTree={child}
                            id={child.id}
                            key={child.id}
                        />)
                    )
                }
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

    // icon can be passed, failed or maybe
    let icon;
    if (feedbackTree.groupPassed) {
        icon = (<img
            className={styles.feedbackIcon}
            src={passed}
        />);
    } else if (feedbackTree.children.filter(child => child.groupPassed).length > 0) {
        icon = (<img
            className={styles.feedbackIcon}
            src={maybe}
        />);
    } else {
        icon = (<img
            className={styles.feedbackIcon}
            src={failed}
        />);
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
                {icon}
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
    // eslint-disable-next-line no-undefined
    opened: state.scratchGui.testResults.openedMap[props.id] === undefined ?
        // open failed groups by default
        !props.feedbackTree.groupPassed : state.scratchGui.testResults.openedMap[props.id]

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
