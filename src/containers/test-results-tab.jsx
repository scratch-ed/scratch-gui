import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import Box from '../components/box/box.jsx';
import TestGroupComponent from '../components/test-results/test-group.jsx';
import TestComponent from '../components/test-results/test-component.jsx';

import styles from '../components/test-results/test-results.css';

const TestResultsTab = ({getTestResults}) => {
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

TestResultsTab.propTypes = {
    getTestResults: PropTypes.func
};

const mapStateToProps = state => ({
    getTestResults: state.scratchGui.vm.getTestResults.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(TestResultsTab);
