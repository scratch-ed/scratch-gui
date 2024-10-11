import React from 'react';
import PropTypes from 'prop-types';
import TestResultComponent from '../components/test-results/test-results.jsx';
import {connect} from 'react-redux';

const TestTab = ({getTestResults}) => (
    <TestResultComponent testResults={getTestResults()} />
);

TestTab.propTypes = {
    getTestResults: PropTypes.func
};

const mapStateToProps = state => ({
    getTestResults: state.scratchGui.vm.getTestResults.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(TestTab);
