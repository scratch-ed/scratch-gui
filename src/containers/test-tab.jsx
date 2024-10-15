import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import Box from '../components/box/box.jsx';
import passedIcon from '../components/test-results/passed.png';
import failedIcon from '../components/test-results/failed.png';

import styles from '../components/test-results/test-results.css';

const TestTab = ({getTestResults}) => {
    const testResults = getTestResults();
    return (<Box className={styles.wrapper}>
        <Box className={styles.testDetails}>
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
        </Box>
    </Box>);
};

TestTab.propTypes = {
    getTestResults: PropTypes.func
};

const mapStateToProps = state => ({
    getTestResults: state.scratchGui.vm.getTestResults.bind(state.scratchGui.vm)
});

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
    testGroup: PropTypes.shape({
        children: PropTypes.arrayOf(PropTypes.object),
        name: PropTypes.string,
        visibility: PropTypes.bool,
        summary: PropTypes.string,
        testsPassed: PropTypes.bool
    })
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

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(TestTab);
